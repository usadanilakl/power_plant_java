import {
  Injectable, inject, signal, computed, DestroyRef, NgZone, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { AutomationSessionState, AutomationStep } from './red-tag-progress.service';

/** Optional step-range constraint for {@link RedTagAutomationService.buildLoto} / buildSafeWork. */
export interface BuildOpts {
  /** First step index to execute (0-based); earlier steps are marked SKIPPED. */
  fromStep?: number;
  /** Last step index to execute; later steps are marked SKIPPED. Equal to fromStep = single step. */
  toStep?: number;
}

/**
 * Front-end client for the rebuilt Red Tag LOTO automation
 * (backend package sevice/automation/redtag, endpoints /ng/red-tag-automation/*).
 *
 * Combines the build trigger, the session controls, and the live SSE progress
 * stream behind one signal-based service. Kept separate from the legacy
 * RedTagProgressService / RedTagControlService so the old daily-package flow is
 * untouched.
 */
@Injectable({ providedIn: 'root' })
export class RedTagAutomationService {

  private http = inject(HttpClient);
  private ngZone = inject(NgZone);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  private readonly baseUrl = `${environment.apiUrl}/red-tag-automation`;

  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  /** Live automation session, updated from the SSE stream. */
  readonly session = signal<AutomationSessionState | null>(null);
  readonly connectionState = signal<'connected' | 'connecting' | 'disconnected'>('disconnected');
  readonly awaitingConfirmation = signal(false);

  readonly currentStep = computed<AutomationStep | null>(() => {
    const s = this.session();
    if (!s || s.currentStepIndex < 0) return null;
    return s.steps[s.currentStepIndex] ?? null;
  });
  readonly isRunning = computed(() => this.session()?.status === 'RUNNING');
  readonly isPaused = computed(() => this.session()?.status === 'PAUSED');
  readonly isFailed = computed(() => this.session()?.status === 'FAILED');
  readonly isCompleted = computed(() => this.session()?.status === 'COMPLETED');
  readonly progressPercent = computed(() => {
    const s = this.session();
    if (!s || s.steps.length === 0) return 0;
    const done = s.steps.filter(st => st.status === 'SUCCESS' || st.status === 'SKIPPED').length;
    return Math.round((done / s.steps.length) * 100);
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.disconnect());
  }

  // --- build trigger + controls -------------------------------------------

  /** Starts a LOTO build. {@code opts.fromStep}/{@code opts.toStep} limit which steps run. */
  buildLoto(lotoId: number, opts: BuildOpts = {}): Observable<SpringApiResponse<AutomationSessionState>> {
    this.connect();
    return this.http.post<SpringApiResponse<AutomationSessionState>>(
      this.buildUrl('loto', lotoId, opts), {});
  }

  /** Starts a Safe Work build. {@code opts.fromStep}/{@code opts.toStep} limit which steps run. */
  buildSafeWork(safeWorkId: number, opts: BuildOpts = {}): Observable<SpringApiResponse<AutomationSessionState>> {
    this.connect();
    return this.http.post<SpringApiResponse<AutomationSessionState>>(
      this.buildUrl('safe-work', safeWorkId, opts), {});
  }

  /**
   * Re-runs the current build starting at {@code stepIndex} (or only that one
   * step when {@code single} is true). Reads {@code permitType} / {@code permitId}
   * from the live session to route to the right endpoint.
   */
  restartFromStep(stepIndex: number, single: boolean = false): Observable<unknown> {
    const s = this.session();
    if (!s) return EMPTY;
    const step = s.steps[stepIndex];
    if (!step?.permitType || step.permitId == null) return EMPTY;
    const opts: BuildOpts = { fromStep: stepIndex };
    if (single) opts.toStep = stepIndex;
    if (step.permitType === 'Loto') return this.buildLoto(step.permitId, opts);
    if (step.permitType === 'SafeWork') return this.buildSafeWork(step.permitId, opts);
    return EMPTY;
  }

  private buildUrl(kind: 'loto' | 'safe-work', id: number, opts: BuildOpts): string {
    const params: string[] = [];
    if (opts.fromStep != null) params.push(`fromStep=${opts.fromStep}`);
    if (opts.toStep != null) params.push(`toStep=${opts.toStep}`);
    return `${this.baseUrl}/${kind}/${id}/build` + (params.length ? '?' + params.join('&') : '');
  }

  pause(): Observable<SpringApiResponse<AutomationSessionState>> {
    return this.http.post<SpringApiResponse<AutomationSessionState>>(`${this.baseUrl}/pause`, {});
  }

  resume(): Observable<SpringApiResponse<AutomationSessionState>> {
    return this.http.post<SpringApiResponse<AutomationSessionState>>(`${this.baseUrl}/resume`, {});
  }

  stop(): Observable<SpringApiResponse<AutomationSessionState>> {
    return this.http.post<SpringApiResponse<AutomationSessionState>>(`${this.baseUrl}/stop`, {});
  }

  retryStep(): Observable<SpringApiResponse<AutomationSessionState>> {
    return this.http.post<SpringApiResponse<AutomationSessionState>>(`${this.baseUrl}/retry-step`, {});
  }

  skipStep(): Observable<SpringApiResponse<AutomationSessionState>> {
    return this.http.post<SpringApiResponse<AutomationSessionState>>(`${this.baseUrl}/skip-step`, {});
  }

  setManualConfirmation(enabled: boolean): Observable<SpringApiResponse<boolean>> {
    return this.http.post<SpringApiResponse<boolean>>(
      `${this.baseUrl}/manual-confirmation?enabled=${enabled}`, {});
  }

  // --- SSE progress stream -------------------------------------------------

  connect(): void {
    if (!isPlatformBrowser(this.platformId) || this.eventSource) return;
    this.connectionState.set('connecting');
    try {
      const es = new EventSource(`${this.baseUrl}/stream`);
      this.eventSource = es;

      es.onopen = () => this.ngZone.run(() => {
        this.connectionState.set('connected');
        this.reconnectAttempts = 0;
      });

      const sessionEvents = ['session_started', 'session_resumed', 'session_paused',
        'session_complete', 'session_failed', 'awaiting_confirmation'];
      for (const name of sessionEvents) {
        es.addEventListener(name, (e) => this.ngZone.run(() => {
          this.awaitingConfirmation.set(name === 'awaiting_confirmation');
          this.session.set(JSON.parse((e as MessageEvent).data));
        }));
      }

      es.addEventListener('step_update', (e) => this.ngZone.run(() => {
        const step: AutomationStep = JSON.parse((e as MessageEvent).data);
        const current = this.session();
        if (!current) return;
        const steps = [...current.steps];
        steps[step.index] = step;
        this.session.set({ ...current, steps, currentStepIndex: step.index });
      }));

      es.onerror = () => this.ngZone.run(() => {
        this.connectionState.set('disconnected');
        this.handleReconnect();
      });
    } catch {
      this.connectionState.set('disconnected');
      this.handleReconnect();
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.connectionState.set('disconnected');
  }

  private handleReconnect(): void {
    this.disconnect();
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
      setTimeout(() => this.connect(), delay);
    }
  }
}
