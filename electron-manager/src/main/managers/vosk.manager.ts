/**
 * VoskManager — Offline speech recognition using Vosk in the Electron main process.
 *
 * Audio flow:
 *   Renderer: getUserMedia → AudioWorklet (pcm-processor.js) → PCM16 chunks via IPC
 *   Main:     VoskManager.feedAudio() → Vosk recognizer → partial/final results via callback → IPC broadcast
 *
 * Requires:
 *   - `vosk` npm package (native N-API addon)
 *   - Vosk model extracted at <workingDir>/vosk-model/ (~50MB for vosk-model-small-en-us-0.15)
 */

import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export interface VoskResult {
  transcript: string;
  isFinal: boolean;
}

export interface VoskStatus {
  available: boolean;
  listening: boolean;
  modelPath: string;
}

export class VoskManager {
  private onResult: (result: VoskResult) => void;
  private onError: (error: string) => void;

  private vosk: any = null;
  private model: any = null;
  private recognizer: any = null;
  private listening = false;
  private modelPath: string;

  constructor(onResult: (result: VoskResult) => void, onError: (error: string) => void) {
    this.onResult = onResult;
    this.onError = onError;
    this.modelPath = this.resolveModelPath();
    this.init();
  }

  /**
   * Resolve Vosk model path.
   * Packaged: resources/vosk-model/ (bundled via extraResources)
   * Dev: electron-manager/vosk-model/ (source tree)
   */
  private resolveModelPath(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'vosk-model');
    }
    // Dev: __dirname is dist/main/main/ → up 3 → electron-manager/vosk-model
    return path.resolve(__dirname, '..', '..', '..', 'vosk-model');
  }

  private init(): void {
    try {
      this.vosk = require('vosk');
      this.vosk.setLogLevel(-1); // suppress verbose logging
    } catch (err: any) {
      console.warn('[Vosk] Native module not available:', err.message);
      this.vosk = null;
    }
  }

  /**
   * Start the recognizer. Loads the model if not already loaded.
   */
  public start(): { success: boolean; error?: string } {
    if (this.listening) {
      return { success: true };
    }

    if (!this.vosk) {
      return { success: false, error: 'Vosk native module not available' };
    }

    if (!fs.existsSync(this.modelPath)) {
      return { success: false, error: `Vosk model not found at ${this.modelPath}` };
    }

    try {
      // Load model (heavy operation, ~1-2s for small model)
      if (!this.model) {
        console.log('[Vosk] Loading model from', this.modelPath);
        this.model = new this.vosk.Model(this.modelPath);
        console.log('[Vosk] Model loaded');
      }

      // Create recognizer at 16kHz sample rate
      this.recognizer = new this.vosk.Recognizer({ model: this.model, sampleRate: 16000 });
      this.listening = true;
      console.log('[Vosk] Recognizer started');
      return { success: true };
    } catch (err: any) {
      console.error('[Vosk] Failed to start:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Feed a PCM16 audio chunk to the recognizer.
   * Called rapidly from renderer via one-way IPC (ipcMain.on, not handle).
   */
  public feedAudio(buffer: Buffer): void {
    if (!this.recognizer || !this.listening) return;

    try {
      const endOfSpeech = this.recognizer.acceptWaveform(buffer);

      if (endOfSpeech) {
        // Final result for this utterance
        const result = JSON.parse(this.recognizer.result());
        if (result.text) {
          this.onResult({ transcript: result.text, isFinal: true });
        }
      } else {
        // Partial result (interim transcript)
        const partial = JSON.parse(this.recognizer.partialResult());
        if (partial.partial) {
          this.onResult({ transcript: partial.partial, isFinal: false });
        }
      }
    } catch (err: any) {
      console.error('[Vosk] Error processing audio:', err.message);
      this.onError(err.message);
    }
  }

  /**
   * Stop the recognizer and return the final transcript.
   */
  public stop(): { transcript: string } {
    let transcript = '';

    if (this.recognizer && this.listening) {
      try {
        const finalResult = JSON.parse(this.recognizer.finalResult());
        transcript = finalResult.text || '';
        if (transcript) {
          this.onResult({ transcript, isFinal: true });
        }
      } catch (err: any) {
        console.error('[Vosk] Error getting final result:', err.message);
      }

      this.recognizer.free();
      this.recognizer = null;
    }

    this.listening = false;
    console.log('[Vosk] Recognizer stopped');
    return { transcript };
  }

  /**
   * Get the current status of the Vosk engine.
   */
  public getStatus(): VoskStatus {
    return {
      available: this.vosk !== null && fs.existsSync(this.modelPath),
      listening: this.listening,
      modelPath: this.modelPath
    };
  }

  /**
   * Free all resources (model + recognizer).
   */
  public cleanup(): void {
    if (this.recognizer) {
      try { this.recognizer.free(); } catch { /* ignore */ }
      this.recognizer = null;
    }
    if (this.model) {
      try { this.model.free(); } catch { /* ignore */ }
      this.model = null;
    }
    this.listening = false;
    console.log('[Vosk] Cleaned up');
  }
}
