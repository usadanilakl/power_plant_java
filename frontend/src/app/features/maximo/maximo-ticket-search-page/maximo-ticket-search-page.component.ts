import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoDetailDialogComponent } from '../maximo-detail-dialog/maximo-detail-dialog.component';
import { MaximoServiceRequest, MaximoTicketAsset, MaximoWorkOrder } from '../../../models/maximo/maximo.models';

/**
 * Find WOs / SRs by equipment tag. Queries the locally-synced ticket→asset index (built by the hub from
 * Maximo SR/WO text — see MaximoTicketIndexService), so a tag typed into a description resolves to its
 * tickets even when the ticket's assetnum/location were left top-level. Rows open the shared Maximo detail
 * dialog. A collapsible "Manage index" panel triggers the hub backfill/incremental.
 */
@Component({
  selector: 'app-maximo-ticket-search-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, MaximoDetailDialogComponent],
  templateUrl: './maximo-ticket-search-page.component.html',
  styleUrl: './maximo-ticket-search-page.component.css'
})
export class MaximoTicketSearchPageComponent {
  private api = inject(MaximoApiService);

  tag = '';
  limit = 50;
  results = signal<MaximoTicketAsset[]>([]);
  loading = signal(false);
  searched = signal(false);
  error = signal<string | null>(null);

  // Manage-index panel (hub operations)
  showManage = signal(false);
  backfillYears = 5;
  running = signal(false);
  info = signal<string | null>(null);
  lastSummary = signal<Record<string, any> | null>(null);
  summaryEntries = computed(() => Object.entries(this.lastSummary() ?? {}));

  // Detail dialogs
  selectedWo = signal<MaximoWorkOrder | null>(null);
  selectedSr = signal<MaximoServiceRequest | null>(null);

  async search() {
    if (!this.tag.trim()) return;
    this.loading.set(true); this.error.set(null);
    try {
      this.results.set(await firstValueFrom(this.api.searchTicketIndex(this.tag.trim(), this.limit)));
      this.searched.set(true);
    } catch (e: any) {
      this.results.set([]);          // don't leave the previous search's rows under a new error
      this.error.set(this.msg(e));
    } finally {
      this.loading.set(false);
    }
  }

  async runBackfill(dryRun: boolean) {
    await this.runIndexOp(() => this.api.backfillTicketIndex(this.backfillYears, dryRun),
      `Backfill (${this.backfillYears}yr${dryRun ? ', dry run' : ''})`);
  }

  async runIncremental(dryRun: boolean) {
    await this.runIndexOp(() => this.api.incrementalTicketIndex(dryRun), `Incremental${dryRun ? ' (dry run)' : ''}`);
  }

  private async runIndexOp(op: () => Observable<Record<string, any>>, label: string) {
    if (this.running()) return;
    this.running.set(true); this.error.set(null); this.info.set(null); this.lastSummary.set(null);
    try {
      const summary = await firstValueFrom(op());
      this.lastSummary.set(summary);
      this.info.set(`${label} complete.`);
    } catch (e: any) {
      this.error.set(this.msg(e));
    } finally {
      this.running.set(false);
    }
  }

  /** Open the underlying Maximo record: hydrate the WO or SR by href, then show the shared dialog. */
  async open(row: MaximoTicketAsset) {
    if (!row.href) return;
    this.error.set(null);
    try {
      if (row.ticketType === 'WO') {
        const wo = await firstValueFrom(this.api.getWorkOrder(row.href));
        if (!wo) { this.error.set(`Couldn't open ${row.ticketId} — Maximo returned no work order (it may have been deleted).`); return; }
        this.selectedSr.set(null);
        this.selectedWo.set(wo);
      } else {
        const sr = await firstValueFrom(this.api.getServiceRequest(row.href));
        if (!sr) { this.error.set(`Couldn't open ${row.ticketId} — Maximo returned no service request (it may have been deleted).`); return; }
        this.selectedWo.set(null);
        this.selectedSr.set(sr);
      }
    } catch (e: any) {
      this.error.set(this.msg(e));
    }
  }

  closeDialogs() { this.selectedWo.set(null); this.selectedSr.set(null); }

  confidenceClass(c: string): string { return 'conf conf-' + (c || 'NONE').toLowerCase(); }

  private msg(e: any): string { return e?.error?.message ?? e?.message ?? String(e); }
}
