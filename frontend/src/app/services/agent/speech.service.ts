import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SpeechService {
  // TTS state
  isSpeaking = signal(false);
  availableVoices = signal<SpeechSynthesisVoice[]>([]);
  selectedVoiceURI = signal<string | null>(null);
  speechRate = signal<number>(1.15);
  autoSpeak = signal(true);

  // STT state
  isRecording = signal(false);
  sttSupported = signal(false);
  transcriptBuffer = signal('');

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
    this.initSttSupport();
    this.initTtsVoices();
    this.persistTtsSettings();
  }

  // ========== TTS (Text-to-Speech) ==========

  speakText(text: string): void {
    if (typeof speechSynthesis === 'undefined') return;

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
    };

    utterance.onend = () => {
      this.isSpeaking.set(false);
    };

    utterance.onerror = () => {
      this.isSpeaking.set(false);
    };

    speechSynthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
    this.isSpeaking.set(false);
  }

  setVoice(voiceURI: string): void {
    this.selectedVoiceURI.set(voiceURI);
    const voice = this.availableVoices().find(v => v.voiceURI === voiceURI);
    if (voice) {
      this.englishVoice = voice;
    }
    try { localStorage.setItem(SpeechService.LS_KEY_VOICE, voiceURI); } catch { /* ignore */ }
  }

  cleanTextForSpeech(text: string): string {
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

  // ========== Private TTS ==========

  private loadTtsSettings(): void {
    try {
      const savedRate = localStorage.getItem(SpeechService.LS_KEY_RATE);
      if (savedRate !== null) {
        const rate = parseFloat(savedRate);
        if (!isNaN(rate) && rate >= 0.5 && rate <= 2.0) {
          this.speechRate.set(rate);
        }
      }
      const savedVoice = localStorage.getItem(SpeechService.LS_KEY_VOICE);
      if (savedVoice) {
        this.selectedVoiceURI.set(savedVoice);
      }
      const savedAutoSpeak = localStorage.getItem(SpeechService.LS_KEY_AUTO_SPEAK);
      if (savedAutoSpeak !== null) {
        this.autoSpeak.set(savedAutoSpeak !== 'false');
      }
    } catch { /* ignore localStorage errors */ }
  }

  private persistTtsSettings(): void {
    effect(() => {
      try { localStorage.setItem(SpeechService.LS_KEY_RATE, String(this.speechRate())); } catch { /* ignore */ }
    });
    effect(() => {
      try { localStorage.setItem(SpeechService.LS_KEY_AUTO_SPEAK, String(this.autoSpeak())); } catch { /* ignore */ }
    });
  }

  private initTtsVoices(): void {
    if (typeof speechSynthesis === 'undefined') return;

    this.loadEnglishVoice();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadEnglishVoice();
    }

    // Prime the speech engine on first user interaction
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

    const savedURI = this.selectedVoiceURI();
    if (savedURI) {
      const savedVoice = voices.find(v => v.voiceURI === savedURI);
      if (savedVoice) {
        this.englishVoice = savedVoice;
        console.log('[TTS] Using saved voice:', savedVoice.name);
        return;
      }
    }

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

  // ========== Private STT ==========

  private initSttSupport(): void {
    if (this.isElectron) {
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

  private async startElectronStt(): Promise<void> {
    const api = (window as any).electronAPI;
    if (!api) return;

    try {
      const startResult = await api.voskStart();
      if (!startResult.success) {
        console.error('[STT] Vosk start failed:', startResult.error);
        return;
      }

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

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      await this.audioContext.audioWorklet.addModule('assets/audio/pcm-processor.js');
      this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');

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

    if (api) {
      try { await api.voskStop(); } catch { /* ignore */ }
    }

    this.cleanupElectronStt();
    this.isRecording.set(false);
  }

  private cleanupElectronStt(): void {
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

    if (this.voskResultCleanup) {
      this.voskResultCleanup();
      this.voskResultCleanup = null;
    }
    if (this.voskErrorCleanup) {
      this.voskErrorCleanup();
      this.voskErrorCleanup = null;
    }
  }
}
