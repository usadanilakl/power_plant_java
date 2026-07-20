import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject, Subscription, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  FullResyncService,
  FileComparisonResult,
  SyncHealthCheckResult,
  FailedSyncItem,
  FileSyncResult,
  IntegrityCheckResult,
  IntegrityFixResult,
  TableIssues
} from '../../services/full-resync.service';
import { DriftService } from '../../services/drift.service';

/**
 * Recovery tab (Sync Dashboard).
 *
 * Scope deliberately limited to NON-destructive, in-process recovery:
 *  - Reconcile from hub  → routes into the Drift Center (content-hash scan + accept-hub); the
 *    "close every gap without a shutdown" operation.
 *  - Files-Only sync     → re-pull file bytes without touching the database.
 *  - Data Integrity      → repair local join-table corruption + purge soft-deletes.
 *  - Failed sync items   → retry/dismiss deferred ManyToMany relationships.
 *
 * The DESTRUCTIVE full DB resync (stop app → replace H2 → restart) intentionally lives only in the
 * Electron desktop app's Sync/Updates panel — it needs the shutdown/DB-swap Electron owns, and is a
 * disaster-recovery action, not a routine one. It was removed from here to avoid a second, weaker
 * copy of that flow.
 */
@Component({
  selector: 'app-sync-resync',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sync-resync.component.html',
  styleUrls: ['./sync-resync.component.css']
})
export class SyncResyncComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  // Message banner
  message = '';
  messageType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Connection / background check (connectivity only — field-level drift lives in the Drift Center)
  syncHealthCheck: SyncHealthCheckResult | null = null;
  syncHealthCheckLoading = false;
  nextCheckCountdown = '';
  private countdownSub: Subscription | null = null;

  // Reconcile-from-hub
  reconcileScanning = false;

  // Failed sync items
  failedSyncItems: (FailedSyncItem & { retrying?: boolean; dismissing?: boolean })[] = [];
  failedSyncItemsCount = 0;
  failedItemsLoading = false;
  showFailedItems = false;
  retryingAll = false;

  // Files-only sync
  previewResult: FileComparisonResult | null = null;
  previewLoading = false;
  filesSyncLoading = false;
  filesSyncResult: FileSyncResult | null = null;
  showFilesSyncConfirm = false;
  forceFilesSync = false;

  // Data Integrity
  integrityCheckResult: IntegrityCheckResult | null = null;
  integrityFixResult: IntegrityFixResult | null = null;
  integrityLoading = false;
  integrityFixLoading = false;
  showIntegrityFixConfirm = false;
  showPurgeConfirm = false;
  integrityFixType: 'duplicates' | 'orphans' | 'constraints' | 'all' = 'all';

  constructor(
    private resyncService: FullResyncService,
    private driftService: DriftService,
    private router: Router,
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.loadSyncHealthCheck();
    this.loadFailedSyncItemsCount();

    // Refresh connection status periodically (cheap cached GET).
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadSyncHealthCheck());

    // Countdown ticker (every second) for the next scheduled background check.
    this.countdownSub = interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateCountdown());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== CONNECTION / BACKGROUND CHECK ====================

  loadSyncHealthCheck(): void {
    this.resyncService.getSyncHealthCheck().subscribe({
      next: (result) => {
        this.syncHealthCheck = result;
      },
      error: (err) => console.debug('Could not load sync health check:', err.message)
    });
  }

  forceSyncHealthCheck(): void {
    this.syncHealthCheckLoading = true;
    this.resyncService.forceSyncHealthCheck().subscribe({
      next: (result) => {
        this.syncHealthCheck = result;
        this.syncHealthCheckLoading = false;
        this.showMessage('Connection check completed', 'info');
      },
      error: (err) => {
        this.syncHealthCheckLoading = false;
        this.showMessage('Connection check failed: ' + err.message, 'error');
      }
    });
  }

  /** Connection badge reflects reachability, NOT the retired count-delta drift heuristic. */
  getSyncStatusClass(): string {
    if (!this.syncHealthCheck) return 'status-info';
    return this.syncHealthCheck.serverReachable ? 'status-ok' : 'status-error';
  }

  getSyncStatusText(): string {
    if (!this.syncHealthCheck) return 'Unknown';
    return this.syncHealthCheck.serverReachable ? 'Online' : 'Offline';
  }

  private updateCountdown(): void {
    if (!this.syncHealthCheck?.nextCheckDueAt) {
      this.nextCheckCountdown = '';
      return;
    }

    const dueAt = this.parseTimestamp(this.syncHealthCheck.nextCheckDueAt);
    if (!dueAt) {
      this.nextCheckCountdown = '';
      return;
    }

    const remainingMs = dueAt - Date.now();
    if (remainingMs <= 0) {
      this.nextCheckCountdown = 'due now';
      return;
    }

    const totalSec = Math.ceil(remainingMs / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    this.nextCheckCountdown = min > 0
      ? `${min}m ${sec.toString().padStart(2, '0')}s`
      : `${sec}s`;
  }

  /** Parse various Java Instant serialization formats into epoch millis. */
  private parseTimestamp(ts: any): number | null {
    if (!ts) return null;
    if (typeof ts === 'number') {
      return ts < 10000000000 ? ts * 1000 : ts;
    }
    if (typeof ts === 'object' && ts.epochSecond) {
      return ts.epochSecond * 1000;
    }
    if (typeof ts === 'string') {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? null : d.getTime();
    }
    return null;
  }

  // ==================== RECONCILE FROM HUB ====================

  /**
   * The non-destructive "close every gap without a shutdown" action: run a content-hash drift scan
   * across all entity types, then open the Drift Center to review and accept-hub. No DB replace,
   * no restart — only genuinely-diverged rows are touched.
   */
  reconcileFromHub(): void {
    this.reconcileScanning = true;
    this.showMessage('Scanning all entity types for drift against the hub…', 'info');
    this.driftService.scanAll().subscribe({
      next: () => {
        this.reconcileScanning = false;
        this.router.navigate(['/sync/drift']);
      },
      error: (err) => {
        this.reconcileScanning = false;
        this.showMessage('Drift scan failed: ' + (err?.message || err), 'error');
      }
    });
  }

  openDriftCenter(): void {
    this.router.navigate(['/sync/drift']);
  }

  // ==================== FILES-ONLY SYNC ====================

  loadPreview(): void {
    this.previewLoading = true;
    this.previewResult = null;

    this.resyncService.previewResync().subscribe({
      next: (result) => {
        this.previewResult = result;
        this.previewLoading = false;

        if (result.errorMessage) {
          this.showMessage(result.errorMessage, 'error');
        } else {
          this.showMessage(
            `Preview: ${result.filesToDownload.length} to download, ${result.filesToDelete.length} to delete, ${result.unchangedFiles.length} unchanged`,
            'info'
          );
        }
      },
      error: (err) => {
        this.previewLoading = false;
        this.showMessage('Failed to preview: ' + err.message, 'error');
      }
    });
  }

  confirmFilesSync(): void {
    this.forceFilesSync = false;
    this.showFilesSyncConfirm = true;
  }

  confirmForceFilesSync(): void {
    this.forceFilesSync = true;
    this.showFilesSyncConfirm = true;
  }

  cancelFilesSyncConfirm(): void {
    this.showFilesSyncConfirm = false;
    this.forceFilesSync = false;
  }

  executeFilesSync(): void {
    this.showFilesSyncConfirm = false;
    this.filesSyncLoading = true;
    this.filesSyncResult = null;
    this.showMessage('Starting files-only sync...', 'info');

    this.resyncService.executeFilesSync(this.forceFilesSync, 3).subscribe({
      next: (result) => {
        this.filesSyncLoading = false;
        this.filesSyncResult = result;
        if (result.success) {
          this.showMessage(result.message, 'success');
        } else {
          this.showMessage(result.message, 'warning');
        }
        this.loadSyncHealthCheck();
      },
      error: (err) => {
        this.filesSyncLoading = false;
        this.showMessage('Files sync failed: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  getFilesSyncConfirmMessage(): string {
    if (this.forceFilesSync) {
      return 'WARNING: Force files sync will skip deletion safety checks and may delete many files. ' +
             'This only syncs files - database is not affected. Are you sure?';
    }
    return 'Are you sure you want to sync files only? ' +
           'This will download missing files and delete extra local files. ' +
           'Database is not affected.';
  }

  // ==================== FAILED SYNC ITEMS ====================

  loadFailedSyncItemsCount(): void {
    this.resyncService.getFailedSyncItemsCount().subscribe({
      next: (response) => {
        this.failedSyncItemsCount = response.count;
      },
      error: (err) => console.debug('Could not load failed items count:', err.message)
    });
  }

  loadFailedSyncItems(): void {
    this.failedItemsLoading = true;
    this.resyncService.getFailedSyncItems().subscribe({
      next: (items) => {
        this.failedSyncItems = items;
        this.failedSyncItemsCount = items.length;
        this.failedItemsLoading = false;
      },
      error: (err) => {
        this.failedItemsLoading = false;
        this.showMessage('Failed to load failed sync items: ' + err.message, 'error');
      }
    });
  }

  toggleFailedItems(): void {
    this.showFailedItems = !this.showFailedItems;
    if (this.showFailedItems && this.failedSyncItems.length === 0) {
      this.loadFailedSyncItems();
    }
  }

  retryFailedItem(item: FailedSyncItem & { retrying?: boolean }): void {
    item.retrying = true;
    this.resyncService.retryFailedItem(item.id).subscribe({
      next: (result) => {
        item.retrying = false;
        if (result.success) {
          this.showMessage('Successfully retried relationship', 'success');
          this.failedSyncItems = this.failedSyncItems.filter(i => i.id !== item.id);
          this.failedSyncItemsCount = this.failedSyncItems.length;
        } else {
          this.showMessage('Retry failed: ' + result.message, 'warning');
        }
      },
      error: (err) => {
        item.retrying = false;
        this.showMessage('Retry failed: ' + err.message, 'error');
      }
    });
  }

  dismissFailedItem(item: FailedSyncItem & { dismissing?: boolean }): void {
    item.dismissing = true;
    this.resyncService.dismissFailedItem(item.id).subscribe({
      next: () => {
        this.failedSyncItems = this.failedSyncItems.filter(i => i.id !== item.id);
        this.failedSyncItemsCount = this.failedSyncItems.length;
        this.showMessage('Item dismissed', 'info');
      },
      error: (err) => {
        item.dismissing = false;
        this.showMessage('Failed to dismiss: ' + err.message, 'error');
      }
    });
  }

  retryAllFailedItems(): void {
    this.retryingAll = true;
    this.resyncService.retryAllFailedItems().subscribe({
      next: (result) => {
        this.retryingAll = false;
        this.showMessage(`Retried ${result.retried} items, ${result.failed} still failing`, 'info');
        this.loadFailedSyncItems();
      },
      error: (err) => {
        this.retryingAll = false;
        this.showMessage('Retry all failed: ' + err.message, 'error');
      }
    });
  }

  // ==================== DATA INTEGRITY ====================

  loadIntegrityCheck(): void {
    this.integrityLoading = true;
    this.integrityCheckResult = null;
    this.integrityFixResult = null;

    this.resyncService.checkIntegrity().subscribe({
      next: (result) => {
        this.integrityCheckResult = result;
        this.integrityLoading = false;
        if (result.hasIssues) {
          this.showMessage(
            `Found ${result.totalDuplicates} duplicates, ${result.totalOrphans} orphans, ${result.totalSoftDeleted} soft-deleted`,
            'warning'
          );
        } else {
          this.showMessage('No integrity issues found', 'success');
        }
      },
      error: (err) => {
        this.integrityLoading = false;
        this.showMessage('Integrity check failed: ' + err.message, 'error');
      }
    });
  }

  getIntegrityStatusClass(): string {
    if (!this.integrityCheckResult) return 'status-info';
    if (this.integrityCheckResult.hasIssues) return 'status-warning';
    return 'status-ok';
  }

  getIntegrityStatusText(): string {
    if (!this.integrityCheckResult) return 'Not Checked';
    if (this.integrityCheckResult.hasIssues) return 'Issues Found';
    return 'Clean';
  }

  previewIntegrityFix(): void {
    this.integrityFixLoading = true;
    this.integrityFixResult = null;

    this.resyncService.fixAll(true).subscribe({
      next: (result) => {
        this.integrityFixResult = result;
        this.integrityFixLoading = false;
        this.showMessage('Preview complete (no changes made)', 'info');
      },
      error: (err) => {
        this.integrityFixLoading = false;
        this.showMessage('Preview failed: ' + err.message, 'error');
      }
    });
  }

  confirmIntegrityFix(type: 'duplicates' | 'orphans' | 'constraints' | 'all'): void {
    this.integrityFixType = type;
    this.showIntegrityFixConfirm = true;
  }

  cancelIntegrityFixConfirm(): void {
    this.showIntegrityFixConfirm = false;
  }

  executeIntegrityFix(): void {
    this.showIntegrityFixConfirm = false;
    this.integrityFixLoading = true;
    this.integrityFixResult = null;

    let observable;
    switch (this.integrityFixType) {
      case 'duplicates':
        observable = this.resyncService.fixDuplicates(false);
        break;
      case 'orphans':
        observable = this.resyncService.fixOrphans(false);
        break;
      case 'constraints':
        observable = this.resyncService.fixConstraints(false);
        break;
      default:
        observable = this.resyncService.fixAll(false);
    }

    observable.subscribe({
      next: (result) => {
        this.integrityFixResult = result;
        this.integrityFixLoading = false;
        if (result.success) {
          this.showMessage(result.message, 'success');
          this.loadIntegrityCheck();
        } else {
          this.showMessage(result.message, 'warning');
        }
      },
      error: (err) => {
        this.integrityFixLoading = false;
        this.showMessage('Fix failed: ' + err.message, 'error');
      }
    });
  }

  confirmPurgeDeleted(): void {
    this.showPurgeConfirm = true;
  }

  cancelPurgeConfirm(): void {
    this.showPurgeConfirm = false;
  }

  executePurgeDeleted(): void {
    this.showPurgeConfirm = false;
    this.integrityFixLoading = true;

    const retentionDays = this.integrityCheckResult?.softDeleteRetentionDays || 90;
    this.resyncService.purgeDeleted(false, retentionDays).subscribe({
      next: (result) => {
        this.integrityFixResult = result;
        this.integrityFixLoading = false;
        if (result.success) {
          this.showMessage(`Purged ${result.softDeletedPurged} soft-deleted entities`, 'success');
          this.loadIntegrityCheck();
        } else {
          this.showMessage(result.message, 'warning');
        }
      },
      error: (err) => {
        this.integrityFixLoading = false;
        this.showMessage('Purge failed: ' + err.message, 'error');
      }
    });
  }

  getTableIssuesArray(): TableIssues[] {
    if (!this.integrityCheckResult?.tableIssues) return [];
    return Object.values(this.integrityCheckResult.tableIssues)
      .filter(t => t.duplicateCount > 0 || t.orphanCount > 0 || !t.hasPrimaryKey);
  }

  getSoftDeletedEntries(): Array<{ key: string, value: number }> {
    if (!this.integrityCheckResult?.softDeletedByEntity) return [];
    return Object.entries(this.integrityCheckResult.softDeletedByEntity)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({ key, value }));
  }

  // ==================== UTILITIES ====================

  private showMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.message = msg;
    this.messageType = type;

    if (this.isBrowser) {
      setTimeout(() => {
        const messageEl = this.elementRef.nativeElement.querySelector('.message');
        if (messageEl) {
          messageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 150);
    }
  }

  formatTimestamp(timestamp: any): string {
    if (!timestamp) return 'N/A';

    let date: Date;
    if (typeof timestamp === 'number') {
      date = timestamp < 10000000000 ? new Date(timestamp * 1000) : new Date(timestamp);
    } else if (typeof timestamp === 'object' && timestamp.epochSecond) {
      date = new Date(timestamp.epochSecond * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'Invalid date';
    }

    return date.toLocaleString();
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    return this.formatFileSize(bytes);
  }
}
