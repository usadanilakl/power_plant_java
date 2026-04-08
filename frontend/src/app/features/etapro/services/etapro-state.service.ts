import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, filter } from 'rxjs/operators';
import { EtaProApiService, ScrapeStatus } from './etapro-api.service';
import { EtaProPointDto } from '../../../models/etapro/etapro-point.model';
import { EtaProReadingDto } from '../../../models/etapro/etapro-reading.model';

@Injectable({ providedIn: 'root' })
export class EtaProStateService {

  private apiService = inject(EtaProApiService);
  private destroyRef = inject(DestroyRef);

  // ── Points state ──────────────────────────────────────────
  private allPointsSubject = new BehaviorSubject<EtaProPointDto[]>([]);
  allPoints$ = this.allPointsSubject.asObservable();

  selectedPoint = signal<EtaProPointDto | null>(null);
  isPointFormOpen = signal(false);

  // ── Readings state ────────────────────────────────────────
  private latestReadingsSubject = new BehaviorSubject<EtaProReadingDto[]>([]);
  latestReadings$ = this.latestReadingsSubject.asObservable();
  latestReadings = toSignal(this.latestReadings$, { initialValue: [] as EtaProReadingDto[] });

  // ── Scraper state ─────────────────────────────────────────
  scrapeStatus = signal<ScrapeStatus>({ processRunning: false, scrapeInProgress: false, lastStatus: 'idle' });
  isPollingActive = signal(false);

  // ── Active tab ────────────────────────────────────────────
  activeTab = signal<'dashboard' | 'points' | 'readings'>('dashboard');

  // ── Trend window state ────────────────────────────────────
  isTrendOpen = signal(false);
  trendPointIds = signal<string[]>([]);

  openTrend(pointIds: string[]): void {
    if (!pointIds.length) return;
    this.trendPointIds.set(pointIds);
    this.isTrendOpen.set(true);
  }

  closeTrend(): void {
    this.isTrendOpen.set(false);
    this.trendPointIds.set([]);
  }

  constructor() {
    // React to point CRUD events
    this.apiService.pointUpdated$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(updated => {
      const current = this.allPointsSubject.value;
      const index = current.findIndex(p => p.id === updated.id);
      if (index >= 0) {
        current[index] = updated;
        this.allPointsSubject.next([...current]);
      } else {
        this.allPointsSubject.next([updated, ...current]);
      }
    });

    this.apiService.pointDeleted$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(id => {
      const current = this.allPointsSubject.value;
      this.allPointsSubject.next(current.filter(p => p.id !== id));
    });
  }

  // ── Points ────────────────────────────────────────────────

  loadPoints(): void {
    this.apiService.getPoints().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
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
    this.apiService.savePoint(dto).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      if (res.responseData) {
        this.isPointFormOpen.set(false);
      }
    });
  }

  deletePoint(id: number): void {
    this.apiService.deletePoint(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  // ── Dashboard polling ─────────────────────────────────────

  startPolling(intervalMs: number = 5000): void {
    if (this.isPollingActive()) return;
    this.isPollingActive.set(true);

    // Poll latest readings
    interval(intervalMs).pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(() => this.isPollingActive()),
      switchMap(() => this.apiService.getLatestReadings())
    ).subscribe({
      next: res => {
        const readings = (res.responseData || []).map((r: any) => EtaProReadingDto.fromJson(r));
        this.latestReadingsSubject.next(readings);
      },
      error: err => console.warn('[EtaPro] Polling error:', err.message)
    });

    // Poll scrape status
    interval(intervalMs).pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(() => this.isPollingActive()),
      switchMap(() => this.apiService.getScrapeStatus())
    ).subscribe({
      next: res => {
        if (res.responseData) this.scrapeStatus.set(res.responseData);
      },
      error: err => console.warn('[EtaPro] Status polling error:', err.message)
    });
  }

  stopPolling(): void {
    this.isPollingActive.set(false);
  }

  refreshLatestReadings(): void {
    this.apiService.getLatestReadings().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      const readings = (res.responseData || []).map((r: any) => EtaProReadingDto.fromJson(r));
      this.latestReadingsSubject.next(readings);
    });
  }

  refreshStatus(): void {
    this.apiService.getScrapeStatus().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      if (res.responseData) this.scrapeStatus.set(res.responseData);
    });
  }
}
