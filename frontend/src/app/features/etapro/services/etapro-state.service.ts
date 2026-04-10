import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, filter } from 'rxjs/operators';
import { EtaProApiService, LiveStatus } from './etapro-api.service';
import { EtaProPointDto } from '../../../models/etapro/etapro-point.model';
import { EtaProReadingDto } from '../../../models/etapro/etapro-reading.model';
import { EtaProScrapeJobDto } from '../../../models/etapro/etapro-scrape-job.model';

/**
 * Centralized state for the EtaPro feature:
 *
 * <ul>
 *   <li>Master point list (for all pickers)</li>
 *   <li>Live subscription status + latest readings (polled)</li>
 *   <li>History jobs list + currently loaded job + its readings</li>
 *   <li>Active tab (LIVE / HISTORY / POINTS)</li>
 * </ul>
 */
@Injectable({ providedIn: 'root' })
export class EtaProStateService {

  private apiService = inject(EtaProApiService);
  private destroyRef = inject(DestroyRef);

  // ── Points ────────────────────────────────────────────────
  private allPointsSubject = new BehaviorSubject<EtaProPointDto[]>([]);
  allPoints$ = this.allPointsSubject.asObservable();
  allPoints = toSignal(this.allPoints$, { initialValue: [] as EtaProPointDto[] });

  selectedPoint = signal<EtaProPointDto | null>(null);
  isPointFormOpen = signal(false);

  // ── Live ──────────────────────────────────────────────────
  liveStatus = signal<LiveStatus>({ active: false });
  liveReadings = signal<EtaProReadingDto[]>([]);
  private livePollSub: Subscription | null = null;

  // ── History ───────────────────────────────────────────────
  recentJobs = signal<EtaProScrapeJobDto[]>([]);
  loadedJob = signal<EtaProScrapeJobDto | null>(null);
  loadedJobReadings = signal<EtaProReadingDto[]>([]);
  activeJobPollSub: Subscription | null = null;

  // ── UI ────────────────────────────────────────────────────
  activeTab = signal<'live' | 'history' | 'points'>('live');

  // Trend popup (still used in History viewer)
  isTrendOpen = signal(false);
  trendPointIds = signal<string[]>([]);

  constructor() {
    this.apiService.pointUpdated$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(updated => {
      const current = this.allPointsSubject.value;
      const idx = current.findIndex(p => p.id === updated.id);
      if (idx >= 0) {
        current[idx] = updated;
        this.allPointsSubject.next([...current]);
      } else {
        this.allPointsSubject.next([updated, ...current]);
      }
    });

    this.apiService.pointDeleted$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(id => {
      const current = this.allPointsSubject.value;
      this.allPointsSubject.next(current.filter(p => p.id !== id));
    });
  }

  // ── Points ────────────────────────────────────────────────

  loadPoints(): void {
    this.apiService.getPoints().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        const points = (res.responseData || []).map((p: any) => EtaProPointDto.fromJson(p));
        this.allPointsSubject.next(points);
      },
      error: err => console.warn('[EtaPro] Failed to load points:', err.message)
    });
  }

  openNewPointForm(): void {
    this.selectedPoint.set(new EtaProPointDto({ active: true }));
    this.isPointFormOpen.set(true);
  }

  editPoint(point: EtaProPointDto): void {
    this.selectedPoint.set(point);
    this.isPointFormOpen.set(true);
  }

  savePoint(dto: EtaProPointDto): void {
    this.apiService.savePoint(dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.responseData) this.isPointFormOpen.set(false);
    });
  }

  deletePoint(id: number): void {
    this.apiService.deletePoint(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  // ── Live ──────────────────────────────────────────────────

  startLive(pointIds: string[]): void {
    this.apiService.startLive(pointIds).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.responseData) this.liveStatus.set(res.responseData);
      this.startLivePolling();
    });
  }

  stopLive(): void {
    this.apiService.stopLive().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.responseData) this.liveStatus.set(res.responseData);
    });
    this.stopLivePolling();
  }

  startLivePolling(pollMs: number = 3000): void {
    this.stopLivePolling();

    this.livePollSub = interval(pollMs).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(() => this.apiService.getLiveStatus())
    ).subscribe(res => {
      if (res.responseData) this.liveStatus.set(res.responseData);
    });

    // Separate poll for readings
    interval(pollMs).pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(() => this.liveStatus().active),
      switchMap(() => this.apiService.getLatestReadings())
    ).subscribe(res => {
      const readings = (res.responseData || []).map((r: any) => EtaProReadingDto.fromJson(r));
      const subscribed = new Set(this.liveStatus().pointIds || []);
      this.liveReadings.set(readings.filter(r => r.pointId && subscribed.has(r.pointId)));
    });
  }

  stopLivePolling(): void {
    this.livePollSub?.unsubscribe();
    this.livePollSub = null;
  }

  refreshLiveStatus(): void {
    this.apiService.getLiveStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.responseData) this.liveStatus.set(res.responseData);
    });
  }

  // ── History jobs ──────────────────────────────────────────

  loadRecentJobs(): void {
    this.apiService.listJobs(1, 20).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      const jobs = (res.responseData?.content || []).map((j: any) => EtaProScrapeJobDto.fromJson(j));
      this.recentJobs.set(jobs);
    });
  }

  submitHistoryJob(pointIds: string[], rangeStart: string, rangeEnd: string): void {
    this.apiService.submitHistoryJob(pointIds, rangeStart, rangeEnd).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.loadRecentJobs(),
      error: err => alert('Failed to submit job: ' + (err?.error?.message || err.message))
    });
  }

  cancelJob(id: number): void {
    this.apiService.cancelJob(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadRecentJobs();
    });
  }

  loadJobReadings(job: EtaProScrapeJobDto): void {
    this.loadedJob.set(job);
    this.loadedJobReadings.set([]);

    if (!job.rangeStart || !job.rangeEnd || !job.pointIds.length) return;

    // Fetch readings for each point in the job and merge
    let pending = job.pointIds.length;
    const all: EtaProReadingDto[] = [];

    for (const pointId of job.pointIds) {
      this.apiService.getReadings(pointId, job.rangeStart, job.rangeEnd).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: res => {
          const readings = (res.responseData || []).map((r: any) => EtaProReadingDto.fromJson(r));
          all.push(...readings);
          pending--;
          if (pending === 0) {
            // Sort by time for consistent display
            all.sort((a, b) => (a.readingTime || '').localeCompare(b.readingTime || ''));
            this.loadedJobReadings.set(all);
          }
        },
        error: () => {
          pending--;
          if (pending === 0) this.loadedJobReadings.set(all);
        }
      });
    }
  }

  startActiveJobPolling(pollMs: number = 2000): void {
    this.stopActiveJobPolling();

    this.activeJobPollSub = interval(pollMs).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(() => this.apiService.listJobs(1, 20))
    ).subscribe(res => {
      const jobs = (res.responseData?.content || []).map((j: any) => EtaProScrapeJobDto.fromJson(j));
      this.recentJobs.set(jobs);

      // Stop polling if no jobs are PENDING or RUNNING
      const hasActive = jobs.some(j => j.status === 'PENDING' || j.status === 'RUNNING');
      if (!hasActive) this.stopActiveJobPolling();
    });
  }

  stopActiveJobPolling(): void {
    this.activeJobPollSub?.unsubscribe();
    this.activeJobPollSub = null;
  }

  // ── Trend popup ───────────────────────────────────────────

  openTrend(pointIds: string[]): void {
    if (!pointIds.length) return;
    this.trendPointIds.set(pointIds);
    this.isTrendOpen.set(true);
  }

  closeTrend(): void {
    this.isTrendOpen.set(false);
    this.trendPointIds.set([]);
  }
}
