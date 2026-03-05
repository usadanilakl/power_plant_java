import { Injectable, signal, computed, inject, effect, Injector } from '@angular/core';
import { AgentService, AgentChatResponse } from './agent.service';
import { AgentCreationFlowService } from './agent-creation-flow.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'search_results' | 'confirmation_required' | 'action_completed' | 'creation_flow' | 'error';
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

  // TTS state
  isSpeaking = signal(false);
  currentSpeakingMessageTimestamp = signal<Date | null>(null);

  // TTS settings (persisted to localStorage)
  availableVoices = signal<SpeechSynthesisVoice[]>([]);
  selectedVoiceURI = signal<string | null>(null);
  speechRate = signal<number>(1.15);
  autoSpeak = signal(true);

  // STT state
  isRecording = signal(false);
  sttSupported = signal(false);
  transcriptBuffer = signal('');

  messageCount = computed(() => this.messages().length);

  private isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
  private recognition: any = null;

  // TTS — cached voice (loaded async via onvoiceschanged)
  private englishVoice: SpeechSynthesisVoice | null = null;
  private static readonly LS_KEY_VOICE = 'jackson_tts_voice_uri';
  private static readonly LS_KEY_RATE = 'jackson_tts_speech_rate';
  private static readonly LS_KEY_AUTO_SPEAK = 'jackson_tts_auto_speak';

  // Electron STT (Vosk) audio pipeline state
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private voskResultCleanup: (() => void) | null = null;
  private voskErrorCleanup: (() => void) | null = null;

  constructor() {
    this.loadTtsSettings();
    this.checkAvailability();
    this.initSttSupport();
    this.initTtsVoices();
    this.persistTtsSettings();
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

  // ========== TTS (Text-to-Speech) ==========
  // Uses speechSynthesis Web API — works in both browser and Electron Chromium

  private loadTtsSettings(): void {
    try {
      const savedRate = localStorage.getItem(AgentChatService.LS_KEY_RATE);
      if (savedRate !== null) {
        const rate = parseFloat(savedRate);
        if (!isNaN(rate) && rate >= 0.5 && rate <= 2.0) {
          this.speechRate.set(rate);
        }
      }
      const savedVoice = localStorage.getItem(AgentChatService.LS_KEY_VOICE);
      if (savedVoice) {
        this.selectedVoiceURI.set(savedVoice);
      }
      const savedAutoSpeak = localStorage.getItem(AgentChatService.LS_KEY_AUTO_SPEAK);
      if (savedAutoSpeak !== null) {
        this.autoSpeak.set(savedAutoSpeak !== 'false');
      }
    } catch { /* ignore localStorage errors */ }
  }

  private persistTtsSettings(): void {
    effect(() => {
      try { localStorage.setItem(AgentChatService.LS_KEY_RATE, String(this.speechRate())); } catch { /* ignore */ }
    });
    // Voice URI is only persisted explicitly in setVoice() — not here.
    // This ensures auto-selected voices don't get "stuck" in localStorage
    // when the priority cascade changes.
    effect(() => {
      try { localStorage.setItem(AgentChatService.LS_KEY_AUTO_SPEAK, String(this.autoSpeak())); } catch { /* ignore */ }
    });
  }

  private initTtsVoices(): void {
    if (typeof speechSynthesis === 'undefined') return;

    this.loadEnglishVoice();
    // Chrome/Electron loads natural voices async — cache when ready
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadEnglishVoice();
    }

    // Prime the speech engine on first user interaction (prevents silent drops)
    const unlock = () => {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      speechSynthesis.speak(u);
      speechSynthesis.cancel();
      document.removeEventListener('click', unlock, true);
      document.removeEventListener('keydown', unlock, true);
    };
    document.addEventListener('click', unlock, true);
    document.addEventListener('keydown', unlock, true);
  }

  private loadEnglishVoice(): void {
    const voices = speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    this.availableVoices.set(englishVoices);
    console.log('[TTS] Available English voices:', englishVoices.map(v => `${v.name} (${v.lang})`));

    // If user has a saved preference, use it
    const savedURI = this.selectedVoiceURI();
    if (savedURI) {
      const savedVoice = voices.find(v => v.voiceURI === savedURI);
      if (savedVoice) {
        this.englishVoice = savedVoice;
        console.log('[TTS] Using saved voice:', savedVoice.name);
        return;
      }
    }

    // Auto-select best voice: Google UK Male > Google voices > Natural voices > any English
    this.englishVoice =
      voices.find(v => v.name === 'Google UK English Male')
      ?? voices.find(v => v.name.startsWith('Google') && v.lang.startsWith('en'))
      ?? voices.find(v => v.lang.startsWith('en') && v.name.includes('Online') && v.name.includes('Natural'))
      ?? voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural'))
      ?? voices.find(v => v.lang.startsWith('en-US'))
      ?? voices.find(v => v.lang.startsWith('en'))
      ?? null;

    if (this.englishVoice) {
      this.selectedVoiceURI.set(this.englishVoice.voiceURI);
      console.log('[TTS] Auto-selected voice:', this.englishVoice.name);
    } else {
      console.warn('[TTS] No English voices found');
    }
  }

  setVoice(voiceURI: string): void {
    this.selectedVoiceURI.set(voiceURI);
    const voice = this.availableVoices().find(v => v.voiceURI === voiceURI);
    if (voice) {
      this.englishVoice = voice;
    }
    // Only persist when the user explicitly chooses a voice
    try { localStorage.setItem(AgentChatService.LS_KEY_VOICE, voiceURI); } catch { /* ignore */ }
  }

  speakMessage(text: string, messageTimestamp: Date): void {
    if (typeof speechSynthesis === 'undefined') return;

    // Cancel any ongoing speech
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    const cleaned = this.cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleaned);

    if (this.englishVoice) {
      utterance.voice = this.englishVoice;
    }
    utterance.rate = this.speechRate();
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking.set(true);
      this.currentSpeakingMessageTimestamp.set(messageTimestamp);
    };

    utterance.onend = () => {
      this.isSpeaking.set(false);
      this.currentSpeakingMessageTimestamp.set(null);
    };

    utterance.onerror = () => {
      this.isSpeaking.set(false);
      this.currentSpeakingMessageTimestamp.set(null);
    };

    speechSynthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
    this.isSpeaking.set(false);
    this.currentSpeakingMessageTimestamp.set(null);
  }

  private cleanTextForSpeech(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, 'code block omitted')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n{2,}/g, '. ')
      .trim();
  }

  // ========== STT (Speech-to-Text) ==========
  // Browser: Web Speech API (SpeechRecognition)
  // Electron: Vosk via IPC (offline, runs in main process)

  startVoiceInput(): void {
    if (this.isRecording()) return;

    if (this.isElectron) {
      this.startElectronStt();
    } else {
      this.startBrowserStt();
    }
  }

  stopVoiceInput(): void {
    if (!this.isRecording()) return;

    if (this.isElectron) {
      this.stopElectronStt();
    } else {
      this.stopBrowserStt();
    }
  }

  private initSttSupport(): void {
    if (this.isElectron) {
      // Check if Vosk model is available in the main process
      const api = (window as any).electronAPI;
      api.voskGetStatus().then((res: any) => {
        this.sttSupported.set(res?.data?.available === true);
      }).catch(() => {
        this.sttSupported.set(false);
      });
    } else {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.sttSupported.set(!!SR);
    }
  }

  private startBrowserStt(): void {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    let finalTranscript = '';

    this.recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      this.transcriptBuffer.set((finalTranscript + interim).trim());
    };

    this.recognition.onerror = (event: any) => {
      console.error('[STT] Recognition error:', event.error);
      this.isRecording.set(false);
    };

    this.recognition.onend = () => {
      this.isRecording.set(false);
    };

    this.recognition.start();
    this.isRecording.set(true);
    this.transcriptBuffer.set('');
  }

  private stopBrowserStt(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.isRecording.set(false);
  }

  // Electron STT — Vosk via IPC
  // Audio pipeline: getUserMedia → AudioWorklet (PCM16) → IPC → VoskManager in main process
  private async startElectronStt(): Promise<void> {
    const api = (window as any).electronAPI;
    if (!api) return;

    try {
      // Tell main process to start the Vosk recognizer
      const startResult = await api.voskStart();
      if (!startResult.success) {
        console.error('[STT] Vosk start failed:', startResult.error);
        return;
      }

      // Subscribe to results from main process
      let finalTranscript = '';

      this.voskResultCleanup = api.onVoskResult((result: any) => {
        if (result.isFinal) {
          finalTranscript += result.transcript + ' ';
          this.transcriptBuffer.set(finalTranscript.trim());
        } else {
          this.transcriptBuffer.set((finalTranscript + result.transcript).trim());
        }
      });

      this.voskErrorCleanup = api.onVoskError((error: string) => {
        console.error('[STT] Vosk error:', error);
        this.stopElectronStt();
      });

      // Capture microphone audio
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Load AudioWorklet processor (converts Float32 → Int16 PCM)
      await this.audioContext.audioWorklet.addModule('assets/audio/pcm-processor.js');
      this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');

      // Send PCM16 chunks to main process via one-way IPC
      this.audioWorkletNode.port.onmessage = (event: MessageEvent) => {
        api.voskSendAudio(event.data);
      };

      source.connect(this.audioWorkletNode);
      this.audioWorkletNode.connect(this.audioContext.destination);

      this.isRecording.set(true);
      this.transcriptBuffer.set('');
    } catch (err: any) {
      console.error('[STT] Failed to start Electron STT:', err);
      this.cleanupElectronStt();
    }
  }

  private async stopElectronStt(): Promise<void> {
    const api = (window as any).electronAPI;

    // Stop Vosk recognizer in main process (may emit final result)
    if (api) {
      try { await api.voskStop(); } catch { /* ignore */ }
    }

    this.cleanupElectronStt();
    this.isRecording.set(false);
  }

  private cleanupElectronStt(): void {
    // Disconnect audio pipeline
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }

    // Unsubscribe IPC listeners
    if (this.voskResultCleanup) {
      this.voskResultCleanup();
      this.voskResultCleanup = null;
    }
    if (this.voskErrorCleanup) {
      this.voskErrorCleanup();
      this.voskErrorCleanup = null;
    }
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

    // Auto-speak assistant text responses
    if (this.autoSpeak() && response.message && (response.type === 'text' || response.type === 'search_results')) {
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
