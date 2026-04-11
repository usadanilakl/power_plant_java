import { Injectable, signal, computed, inject, Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { AgentService, AgentChatResponse } from './agent.service';
import { AgentCreationFlowService } from './agent-creation-flow.service';
import { SpeechService } from './speech.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'search_results' | 'confirmation_required' | 'action_completed' | 'creation_flow' | 'matching_jobs' | 'bulk_cards' | 'error';
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
  private injector = inject(Injector);
  private _creationFlowService: AgentCreationFlowService | null = null;

  speech = inject(SpeechService);

  get creationFlowService(): AgentCreationFlowService {
    if (!this._creationFlowService) {
      this._creationFlowService = this.injector.get(AgentCreationFlowService);
    }
    return this._creationFlowService;
  }

  sessionId = signal<string | null>(null);
  messages = signal<ChatMessage[]>([]);
  isLoading = signal(false);
  isOpen = signal(false);
  isAvailable = signal(false);

  /** Emits bulk card data from AI generation for the bulk create dialog */
  bulkCardsGenerated$ = new Subject<any[]>();

  // Track which message is currently being spoken (for UI highlight)
  currentSpeakingMessageTimestamp = signal<Date | null>(null);

  messageCount = computed(() => this.messages().length);

  constructor() {
    this.checkAvailability();
  }

  // ========== Availability ==========

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

  // ========== Panel ==========

  togglePanel(): void {
    this.isOpen.update(v => !v);
  }

  openPanel(): void {
    this.isOpen.set(true);
  }

  closePanel(): void {
    this.isOpen.set(false);
  }

  // ========== Chat ==========

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
      error: () => {
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

  // ========== TTS Delegation ==========

  speakMessage(text: string, messageTimestamp: Date): void {
    this.currentSpeakingMessageTimestamp.set(messageTimestamp);
    this.speech.speakText(text);
  }

  stopSpeaking(): void {
    this.speech.stopSpeaking();
    this.currentSpeakingMessageTimestamp.set(null);
  }

  // ========== Private ==========

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

    // Handle creation flow — delegate to the state machine
    if (response.type === 'creation_flow' && response.data) {
      this.creationFlowService.startFlow(response.data);
      return;
    }

    // Handle bulk card generation — emit to bulk create dialog
    if (response.type === 'bulk_cards' && response.data?.['cards']) {
      this.bulkCardsGenerated$.next(response.data['cards'] as any[]);
      return;
    }

    // Auto-speak assistant text responses
    if (this.speech.autoSpeak() && response.message && (response.type === 'text' || response.type === 'search_results')) {
      this.speakMessage(response.message, assistantMessage.timestamp);
    }
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
