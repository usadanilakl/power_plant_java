import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, interval, EMPTY } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import {
  SyncTestService,
  TestResult,
  TestMetrics,
  TestRun,
  TestTypes
} from '../../services/sync-test.service';
@Component({
  selector: 'app-sync-testing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sync-testing.component.html',
  styleUrls: ['./sync-testing.component.css']
})
export class SyncTestingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  // Metrics
  metrics: TestMetrics | null = null;
  entityCounts: { [key: string]: number } = {};
  testTypes: TestTypes | null = null;

  // Test history
  testHistory: TestRun[] = [];

  // Last result
  lastResult: TestResult | null = null;

  // UI state
  loading = false;
  autoRefresh = true;
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';

  // Form inputs
  bulkCount = 1000;
  selectedTestType = 'BULK_CREATE';
  mixedCreates = 100;
  mixedUpdates = 50;
  mixedDeletes = 25;
  revertChanges = true;

  constructor(
    private syncTestService: SyncTestService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadInitialData();
      this.startAutoRefresh();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.loadMetrics();
    this.loadHistory();
    this.loadEntityCounts();
    this.loadTestTypes();
  }

  private startAutoRefresh(): void {
    if (!this.isBrowser) return;

    interval(5000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          if (this.autoRefresh && !this.loading) {
            return this.syncTestService.getMetrics();
          }
          return EMPTY;
        })
      )
      .subscribe({
        next: (metrics) => {
          if (metrics) this.metrics = metrics;
        }
      });
  }

  loadMetrics(): void {
    this.syncTestService.getMetrics().subscribe({
      next: (metrics) => this.metrics = metrics,
      error: (err) => this.showMessage('Failed to load metrics: ' + err.message, 'error')
    });
  }

  loadHistory(): void {
    this.syncTestService.getHistory().subscribe({
      next: (history) => this.testHistory = history.reverse(),
      error: (err) => this.showMessage('Failed to load history: ' + err.message, 'error')
    });
  }

  loadEntityCounts(): void {
    this.syncTestService.getEntityCounts().subscribe({
      next: (counts) => this.entityCounts = counts,
      error: (err) => console.error('Failed to load entity counts:', err)
    });
  }

  loadTestTypes(): void {
    this.syncTestService.getTestTypes().subscribe({
      next: (types) => this.testTypes = types,
      error: (err) => console.error('Failed to load test types:', err)
    });
  }

  // ==================== TEST ACTIONS ====================

  generateTestData(): void {
    this.loading = true;
    this.showMessage(`Generating ${this.bulkCount} ${this.selectedTestType} changes...`, 'info');

    this.syncTestService.generateTestData(this.bulkCount, this.selectedTestType).subscribe({
      next: (result) => this.handleResult(result),
      error: (err) => this.handleError(err)
    });
  }

  generateMixedChanges(): void {
    this.loading = true;
    const total = this.mixedCreates + this.mixedUpdates + this.mixedDeletes;
    this.showMessage(`Generating ${total} mixed changes...`, 'info');

    this.syncTestService.generateMixedChanges(
      this.mixedCreates,
      this.mixedUpdates,
      this.mixedDeletes
    ).subscribe({
      next: (result) => this.handleResult(result),
      error: (err) => this.handleError(err)
    });
  }

  triggerSync(): void {
    this.loading = true;
    this.showMessage('Triggering sync...', 'info');

    this.syncTestService.triggerSync().subscribe({
      next: (result) => this.handleResult(result),
      error: (err) => this.handleError(err)
    });
  }

  runFullCycle(): void {
    this.loading = true;
    this.showMessage(`Running full cycle with ${this.bulkCount} changes...`, 'info');

    this.syncTestService.runFullCycle(this.bulkCount, this.selectedTestType).subscribe({
      next: (result) => this.handleResult(result),
      error: (err) => this.handleError(err)
    });
  }

  testEquipment(): void {
    this.loading = true;
    this.showMessage(`Testing Equipment sync (revert=${this.revertChanges})...`, 'info');

    this.syncTestService.testEquipment(this.revertChanges).subscribe({
      next: (result) => this.handleResult(result),
      error: (err) => this.handleError(err)
    });
  }

  testLotoPoints(): void {
    this.loading = true;
    this.showMessage(`Testing LotoPoint sync (revert=${this.revertChanges})...`, 'info');

    this.syncTestService.testLotoPoints(this.revertChanges).subscribe({
      next: (result) => this.handleResult(result),
      error: (err) => this.handleError(err)
    });
  }

  testFileObjects(): void {
    this.loading = true;
    this.showMessage(`Testing FileObject sync (revert=${this.revertChanges})...`, 'info');

    this.syncTestService.testFileObjects(this.revertChanges).subscribe({
      next: (result) => this.handleResult(result),
      error: (err) => this.handleError(err)
    });
  }

  testAllEntities(): void {
    this.loading = true;
    this.showMessage(`Testing all entities (revert=${this.revertChanges})...`, 'info');

    this.syncTestService.testAllEntities(this.revertChanges).subscribe({
      next: (result) => this.handleResult(result),
      error: (err) => this.handleError(err)
    });
  }

  clearTestData(): void {
    this.loading = true;
    this.showMessage('Clearing all test data...', 'info');

    this.syncTestService.clearAllTestData().subscribe({
      next: (result) => this.handleResult(result),
      error: (err) => this.handleError(err)
    });
  }

  // ==================== HELPERS ====================

  private handleResult(result: TestResult): void {
    this.loading = false;
    this.lastResult = result;
    this.showMessage(result.message, result.success ? 'success' : 'error');
    this.loadMetrics();
    this.loadHistory();
  }

  private handleError(err: any): void {
    this.loading = false;
    this.showMessage('Error: ' + (err.message || err), 'error');
  }

  private showMessage(msg: string, type: 'success' | 'error' | 'info'): void {
    this.message = msg;
    this.messageType = type;
  }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }

  formatRate(rate: number): string {
    return rate.toFixed(2);
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  getStatusClass(success: boolean): string {
    return success ? 'status-success' : 'status-error';
  }
}
