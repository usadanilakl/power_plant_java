import { Injectable, signal, computed, inject } from '@angular/core';
import {
  ElectronService,
  SdsGapReport,
  SdsScrapeReport,
  SdsUnmatchedBookEntry,
  SdsMatchItem
} from './electron.service';

/**
 * Persistent state for the SDS Import page. Lives in the root injector so it survives router
 * navigation — running scrapes keep going, and when the user returns to the page they see the
 * latest progress + final report. Component delegates all state and side effects to this service.
 */
@Injectable({ providedIn: 'root' })
export class SdsImportStateService {
  private electron = inject(ElectronService);

  // Persisted toggles
  filterLocation = signal(true);
  showWindow = signal(false);

  // Report state
  gap = signal<SdsGapReport | null>(null);
  loadingReport = signal(false);
  reportError = signal('');

  // Scrape state
  scraping = signal(false);
  scrapeError = signal('');
  scrapeReport = signal<SdsScrapeReport | null>(null);
  reloadInfo = signal('');

  // Live progress (polled from manager while scraping/loadingReport)
  progressRow = signal(0);
  progressTotal = signal(0);
  progressPhase = signal<'list' | 'pdfs' | 'upload' | 'idle'>('idle');
  progressText = computed(() => {
    const r = this.progressRow();
    const t = this.progressTotal();
    const p = this.progressPhase();
    if (p === 'idle' || t === 0) return '';
    const label = p === 'list' ? 'Scraping list' : p === 'pdfs' ? 'Downloading PDFs' : p === 'upload' ? 'Uploading to server' : '';
    return `${label}: ${r} / ${t}`;
  });
  private pollHandle: any = null;

  // Manual-match state (per-row dropdown picks, keyed by name|book|section)
  matchPick = signal<Record<string, string>>({});
  matching = signal(false);
  matchError = signal('');

  private opts() {
    return { filterLocation: this.filterLocation(), showWindow: this.showWindow() };
  }

  // ─── Polling ────────────────────────────────────────────────────────────
  private startPolling(): void {
    if (this.pollHandle) return;
    this.pollHandle = setInterval(async () => {
      const res = await this.electron.sdsScrapeGetStatus();
      const s = res?.data;
      if (!s) return;
      this.progressRow.set(s.progressRow ?? 0);
      this.progressTotal.set(s.progressTotal ?? 0);
      this.progressPhase.set((s.progressPhase as any) ?? 'idle');
      if (!s.isScraping) this.stopPolling();
    }, 1000);
  }
  private stopPolling(): void {
    if (this.pollHandle) { clearInterval(this.pollHandle); this.pollHandle = null; }
  }

  // ─── Actions ────────────────────────────────────────────────────────────

  async runReport(): Promise<void> {
    this.loadingReport.set(true);
    this.reportError.set('');
    this.scrapeReport.set(null);
    this.scrapeError.set('');
    this.startPolling();
    try {
      const res = await this.electron.sdsGapReport(this.opts());
      if (!res.success || !res.data) throw new Error(res.error || 'Gap report failed');
      this.gap.set(res.data);
    } catch (err: any) {
      this.reportError.set(err.message || 'Gap report failed');
    } finally {
      this.loadingReport.set(false);
      this.stopPolling();
    }
  }

  async closeGaps(): Promise<void> {
    this.scraping.set(true);
    this.scrapeError.set('');
    this.scrapeReport.set(null);
    this.startPolling();
    try {
      const res = await this.electron.sdsScrapeRun(this.opts());
      if (!res.success) throw new Error(res.error || 'Scrape failed');
      this.scrapeReport.set(res.data?.lastReport ?? null);
      if (!this.scrapeReport() && res.data?.error) this.scrapeError.set(res.data.error);
    } catch (err: any) {
      this.scrapeError.set(err.message || 'Scrape failed');
    } finally {
      this.scraping.set(false);
      this.stopPolling();
    }
  }

  async reloadAllPdfs(): Promise<void> {
    const ok = window.confirm(
      'Delete every local SDS PDF and re-download them from the eBinder?\n\n' +
      'Use this after a capture bug or to refresh stale files. ' +
      'SharePoint attachments are NOT removed — remove the old ones manually if you want a clean SharePoint.'
    );
    if (!ok) return;

    this.scraping.set(true);
    this.scrapeError.set('');
    this.scrapeReport.set(null);
    this.reloadInfo.set('');
    this.startPolling();
    try {
      const cleared = await this.electron.sdsClearPdfs();
      if (!cleared.success) throw new Error(cleared.error || 'Clear PDFs failed');
      this.reloadInfo.set(`Cleared ${cleared.data ?? 0} local PDFs. Scraping the eBinder to re-download…`);

      const res = await this.electron.sdsScrapeRun(this.opts());
      if (!res.success) throw new Error(res.error || 'Scrape failed');
      this.scrapeReport.set(res.data?.lastReport ?? null);
      const rep = this.scrapeReport();
      if (!rep && res.data?.error) this.scrapeError.set(res.data.error);
      else this.reloadInfo.set(`Cleared ${cleared.data ?? 0} local PDFs and re-attached ${rep?.pdfsAttached ?? 0}.`);
    } catch (err: any) {
      this.scrapeError.set(err.message || 'Reload failed');
    } finally {
      this.scraping.set(false);
      this.stopPolling();
    }
  }

  async stop(): Promise<void> { await this.electron.sdsScrapeAbort(); }

  async match(u: SdsUnmatchedBookEntry): Promise<void> {
    const key = `${u.name}|${u.bookNumber}|${u.sectionNumber}`;
    const sourceId = this.matchPick()[key];
    const gap = this.gap();
    if (!sourceId || !gap || u.bookNumber == null || u.sectionNumber == null) return;
    const candidate = gap.missingFromDb.find(c => c.sourceId === sourceId);
    if (!candidate) { this.matchError.set('Candidate not found in current report'); return; }

    this.matching.set(true);
    this.matchError.set('');
    try {
      const combinedNames = [u.name, candidate.name].filter(Boolean).join('\n');
      const item: SdsMatchItem = {
        sourceItemId: sourceId,
        names: combinedNames,
        bookNumber: u.bookNumber,
        sectionNumber: u.sectionNumber
      };
      const res = await this.electron.sdsMatchUnmatched(item);
      if (!res.success) throw new Error(res.error || 'Match failed');

      // Optimistically update local gap state.
      this.gap.set({
        ...gap,
        unmatchedBookEntries: gap.unmatchedBookEntries.filter(
          e => `${e.name}|${e.bookNumber}|${e.sectionNumber}` !== key
        ),
        missingFromDb: gap.missingFromDb.filter(c => c.sourceId !== sourceId),
        activeCount: gap.activeCount + 1
      });
      const picks = { ...this.matchPick() };
      delete picks[key];
      this.matchPick.set(picks);
    } catch (err: any) {
      this.matchError.set(err.message || 'Match failed');
    } finally {
      this.matching.set(false);
    }
  }
}
