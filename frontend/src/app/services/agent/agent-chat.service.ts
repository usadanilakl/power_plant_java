import { Injectable, signal, computed, inject } from '@angular/core';
import { AgentService, AgentChatResponse } from './agent.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'search_results' | 'confirmation_required' | 'action_completed' | 'error';
  data?: Record<string, any>;
  confirmationId?: string;
  pendingAction?: {
    actionName: string;
    description: string;
    parameters: Record<string, any>;
  };
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class AgentChatService {
  private agentService = inject(AgentService);

  sessionId = signal<string | null>(null);
  messages = signal<ChatMessage[]>([]);
  isLoading = signal(false);
  isOpen = signal(false);
  isAvailable = signal(false);

  messageCount = computed(() => this.messages().length);

  constructor() {
    this.checkAvailability();
  }

  checkAvailability(): void {
    this.agentService.checkStatus().subscribe({
      next: (res) => {
        this.isAvailable.set(res.responseData === true);
      },
      error: () => {
        this.isAvailable.set(false);
      }
    });
  }

  togglePanel(): void {
    this.isOpen.update(v => !v);
  }

  openPanel(): void {
    this.isOpen.set(true);
  }

  closePanel(): void {
    this.isOpen.set(false);
  }

  sendMessage(text: string): void {
    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      type: 'text',
      timestamp: new Date()
    };

    this.messages.update(msgs => [...msgs, userMessage]);
    this.isLoading.set(true);

    this.agentService.chat({
      sessionId: this.sessionId(),
      message: text,
      confirmationId: null,
      confirmed: false
    }).subscribe({
      next: (res) => {
        this.handleResponse(res.responseData);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.addAssistantMessage('Sorry, something went wrong. Please try again.', 'error');
        this.isLoading.set(false);
      }
    });
  }

  confirmAction(confirmationId: string): void {
    this.isLoading.set(true);

    this.agentService.chat({
      sessionId: this.sessionId(),
      message: null,
      confirmationId: confirmationId,
      confirmed: true
    }).subscribe({
      next: (res) => {
        this.handleResponse(res.responseData);
        this.isLoading.set(false);
      },
      error: () => {
        this.addAssistantMessage('Error confirming action.', 'error');
        this.isLoading.set(false);
      }
    });
  }

  cancelAction(confirmationId: string): void {
    this.isLoading.set(true);

    this.agentService.chat({
      sessionId: this.sessionId(),
      message: null,
      confirmationId: confirmationId,
      confirmed: false
    }).subscribe({
      next: (res) => {
        this.handleResponse(res.responseData);
        this.isLoading.set(false);
      },
      error: () => {
        this.addAssistantMessage('Error cancelling action.', 'error');
        this.isLoading.set(false);
      }
    });
  }

  clearChat(): void {
    const sid = this.sessionId();
    if (sid) {
      this.agentService.clearSession(sid).subscribe();
    }
    this.sessionId.set(null);
    this.messages.set([]);
  }

  // Future: STT input
  // Browser (non-Electron): Use Web Speech API (SpeechRecognition)
  // Electron: Use vosk (offline recognition) via IPC
  // Detection: check window.electronAPI to determine runtime context
  startVoiceInput(): void { /* No-op for now */ }
  stopVoiceInput(): void { /* No-op for now */ }

  // Future: TTS output
  // Browser (non-Electron): Use Web Speech API (speechSynthesis)
  // Electron: Use say.js via IPC
  speakMessage(text: string): void { /* No-op for now */ }

  private handleResponse(response: AgentChatResponse): void {
    if (response.sessionId) {
      this.sessionId.set(response.sessionId);
    }

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response.message,
      type: response.type,
      data: response.data ?? undefined,
      confirmationId: response.confirmationId ?? undefined,
      pendingAction: response.pendingAction ?? undefined,
      timestamp: new Date()
    };

    this.messages.update(msgs => [...msgs, assistantMessage]);
  }

  private addAssistantMessage(content: string, type: ChatMessage['type']): void {
    const msg: ChatMessage = {
      role: 'assistant',
      content,
      type,
      timestamp: new Date()
    };
    this.messages.update(msgs => [...msgs, msg]);
  }
}
