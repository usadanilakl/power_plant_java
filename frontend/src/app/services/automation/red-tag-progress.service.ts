import { Injectable, inject, DestroyRef, NgZone, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type StepStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
export type SessionStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';

export interface AutomationStep {
  index: number;
  id: string;
  name: string;
  category: string;
  status: StepStatus;
  errorMessage: string | null;
  startTimeMs: number;
  endTimeMs: number;
  permitType: string | null;
  permitId: number | null;
}

export interface AutomationSessionState {
  sessionId: string;
  packageId: number;
  packageName: string;
  steps: AutomationStep[];
  currentStepIndex: number;
  status: SessionStatus;
  startTimeMs: number;
  lastUpdateMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class RedTagProgressService {
  private ngZone = inject(NgZone);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);

  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000;

  connectionState = signal<'connected' | 'disconnected' | 'connecting'>('disconnected');
  session = signal<AutomationSessionState | null>(null);

  currentStep = computed(() => {
    const s = this.session();
    if (!s || s.currentStepIndex < 0) return null;
    return s.steps[s.currentStepIndex] ?? null;
  });

  awaitingConfirmation = signal(false);

  isRunning = computed(() => this.session()?.status === 'RUNNING');
  isPaused = computed(() => this.session()?.status === 'PAUSED');
  isFailed = computed(() => this.session()?.status === 'FAILED');
  isCompleted = computed(() => this.session()?.status === 'COMPLETED');
  isIdle = computed(() => !this.session() || this.session()?.status === 'IDLE');

  progressPercent = computed(() => {
    const s = this.session();
    if (!s || s.steps.length === 0) return 0;
    const done = s.steps.filter(st => st.status === 'SUCCESS' || st.status === 'SKIPPED').length;
    return Math.round((done / s.steps.length) * 100);
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.disconnect());
  }

  connect(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.eventSource) return;

    this.connectionState.set('connecting');
    const url = `${environment.baseApiUrl}/api/red-tag-progress/stream`;

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.ngZone.run(() => {
          this.connectionState.set('connected');
          this.reconnectAttempts = 0;
        });
      };

      this.eventSource.addEventListener('connected', () => {
        this.ngZone.run(() => {
          // Fetch current state on connect (in case we reconnected mid-build)
          this.fetchCurrentState();
        });
      });

      this.eventSource.addEventListener('session_started', (event) => {
        this.ngZone.run(() => {
          this.session.set(JSON.parse(event.data));
        });
      });

      this.eventSource.addEventListener('session_resumed', (event) => {
        this.ngZone.run(() => {
          this.awaitingConfirmation.set(false);
          this.session.set(JSON.parse(event.data));
        });
      });

      this.eventSource.addEventListener('session_paused', (event) => {
        this.ngZone.run(() => {
          this.awaitingConfirmation.set(false);
          this.session.set(JSON.parse(event.data));
        });
      });

      this.eventSource.addEventListener('awaiting_confirmation', (event) => {
        this.ngZone.run(() => {
          this.awaitingConfirmation.set(true);
          this.session.set(JSON.parse(event.data));
        });
      });

      this.eventSource.addEventListener('session_complete', (event) => {
        this.ngZone.run(() => {
          this.session.set(JSON.parse(event.data));
        });
      });

      this.eventSource.addEventListener('session_failed', (event) => {
        this.ngZone.run(() => {
          this.session.set(JSON.parse(event.data));
        });
      });

      this.eventSource.addEventListener('step_update', (event) => {
        this.ngZone.run(() => {
          const step: AutomationStep = JSON.parse(event.data);
          const current = this.session();
          if (!current) return;
          // Update the specific step in place
          const updatedSteps = [...current.steps];
          updatedSteps[step.index] = step;
          this.session.set({ ...current, steps: updatedSteps, currentStepIndex: step.index });
        });
      });

      this.eventSource.onerror = () => {
        this.ngZone.run(() => {
          this.connectionState.set('disconnected');
          this.handleReconnect();
        });
      };
    } catch (error) {
      this.connectionState.set('disconnected');
      this.handleReconnect();
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.connectionState.set('disconnected');
    }
  }

  private handleReconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      setTimeout(() => this.connect(), Math.min(delay, 30000));
    }
  }

  private fetchCurrentState(): void {
    this.http.get<any>(`${environment.apiUrl}/daily-permit-packages/automation/status`).subscribe({
      next: (response) => {
        if (response?.responseData) {
          this.session.set(response.responseData);
        }
      }
    });
  }
}
