import { Component, DestroyRef, EventEmitter, inject, Input, OnChanges, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { SyncAuditApiService } from '../services/sync-audit-api.service';
import { SyncAuditComparison, FieldChangeEntry, FieldDiffEntry } from '../services/sync-audit.models';
import { EntitySyncCheckService } from '../../../services/sync/entity-sync-check.service';

@Component({
  selector: 'app-sync-audit-comparison-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sync-audit-comparison-dialog.component.html',
  styleUrl: './sync-audit-comparison-dialog.component.css',
})
export class SyncAuditComparisonDialogComponent implements OnChanges {
  @Input() entityType = '';
  @Input() entityId = 0;
  @Output() close = new EventEmitter<void>();
  @Output() resolved = new EventEmitter<void>();

  private destroyRef = inject(DestroyRef);
  private api = inject(SyncAuditApiService);
  private syncCheck = inject(EntitySyncCheckService);

  loading = signal(true);
  resolving = signal(false);
  error = signal('');
  resolveMessage = signal('');
  comparison = signal<SyncAuditComparison | null>(null);

  // Computed from comparison
  diffs = signal<FieldDiffEntry[]>([]);
  allFields = signal<string[]>([]);
  localChanges = signal<FieldChangeEntry[]>([]);
  serverChanges = signal<FieldChangeEntry[]>([]);

  ngOnChanges() {
    if (this.entityType && this.entityId) {
      this.loadComparison();
    }
  }

  private loadComparison() {
    this.loading.set(true);
    this.error.set('');
    this.resolveMessage.set('');

    this.api.getComparison(this.entityType, this.entityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          const data = res.responseData;
          this.comparison.set(data);
          this.diffs.set(data?.diffs ?? []);
          this.localChanges.set(data?.localChanges ?? []);
          this.serverChanges.set(data?.serverChanges ?? []);

          const fields = new Set<string>();
          if (data?.localEntity) Object.keys(data.localEntity).forEach(f => fields.add(f));
          if (data?.serverEntity) Object.keys(data.serverEntity).forEach(f => fields.add(f));
          this.allFields.set(Array.from(fields).sort());

          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load comparison data');
          this.loading.set(false);
        }
      });
  }

  acceptLocal() {
    this.resolving.set(true);
    this.resolveMessage.set('');
    this.syncCheck.executePush(this.entityType, this.entityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.resolveMessage.set(`Pushed to server (${res?.entitiesPushed ?? 1} entities, ${res?.changesSent ?? 0} changes)`);
          this.resolving.set(false);
          this.resolved.emit();
        },
        error: () => {
          this.error.set('Failed to push to server');
          this.resolving.set(false);
        }
      });
  }

  acceptServer() {
    this.resolving.set(true);
    this.resolveMessage.set('');
    this.syncCheck.executePull(this.entityType, this.entityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.resolveMessage.set(`Pulled from server (${res?.entitiesPulled ?? 1} entities, ${res?.changesApplied ?? 0} changes)`);
          this.resolving.set(false);
          this.resolved.emit();
        },
        error: () => {
          this.error.set('Failed to pull from server');
          this.resolving.set(false);
        }
      });
  }

  isDiffField(fieldName: string): boolean {
    return this.diffs().some(d => d.fieldName === fieldName);
  }

  truncate(value: string | null | undefined, maxLen = 80): string {
    if (value == null) return '(null)';
    return value.length > maxLen ? value.substring(0, maxLen) + '...' : value;
  }

  formatTimestamp(ts: string): string {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch {
      return ts;
    }
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.close.emit();
    }
  }
}
