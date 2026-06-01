import { Injectable, signal, computed, inject } from '@angular/core';
import {
  ElectronService,
  SdsGap,
  SdsGapReport,
  SdsScrapeReport,
  SdsMatchChemical,
  SdsEmailGapReportResult
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

  // Manual-match state for "missing on eBinder" rows. Keyed by chemical DB id (one pick per row).
  matchPick = signal<Record<string, string>>({});
  matching = signal(false);
  matchError = signal('');

  // Email Report — dialog state lives here so it survives navigation.
  private static readonly EMAIL_RECIPIENT_KEY = 'sds_gap_report_email';
  private static readonly EMAIL_CC_KEY = 'sds_gap_report_email_cc';
  emailDialogOpen = signal(false);
  emailTo = signal('');
  emailCc = signal('');
  emailSending = signal(false);
  emailError = signal('');
  emailResult = signal<SdsEmailGapReportResult | null>(null);

  openEmailDialog(): void {
    try {
      this.emailTo.set(localStorage.getItem(SdsImportStateService.EMAIL_RECIPIENT_KEY) ?? '');
      this.emailCc.set(localStorage.getItem(SdsImportStateService.EMAIL_CC_KEY) ?? '');
    } catch { /* ignore */ }
    this.emailError.set('');
    this.emailResult.set(null);
    this.emailDialogOpen.set(true);
  }

  closeEmailDialog(): void { this.emailDialogOpen.set(false); }

  async sendEmail(): Promise<void> {
    const to = this.emailTo().trim();
    if (!to) { this.emailError.set('Recipient is required'); return; }
    const cc = this.emailCc().trim();

    this.emailSending.set(true);
    this.emailError.set('');
    this.emailResult.set(null);
    try {
      const res = await this.electron.sdsEmailGapReport({ to, cc: cc || undefined });
      if (!res.success || !res.data) throw new Error(res.error || 'Email failed');
      this.emailResult.set(res.data);
      if (res.data.sent) {
        try {
          localStorage.setItem(SdsImportStateService.EMAIL_RECIPIENT_KEY, to);
          if (cc) localStorage.setItem(SdsImportStateService.EMAIL_CC_KEY, cc);
          else localStorage.removeItem(SdsImportStateService.EMAIL_CC_KEY);
        } catch { /* ignore */ }
      } else {
        this.emailError.set(res.data.message || 'Email not sent');
      }
    } catch (err: any) {
      this.emailError.set(err.message || 'Email failed');
    } finally {
      this.emailSending.set(false);
    }
  }

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

  /**
   * Bind an existing DB chemical (one in missingFromEbinder) to a real eBinder Document ID. The
   * picker dropdown value is the chosen candidate's sourceId; this calls the backend's match
   * endpoint, then optimistically updates the gap report in place.
   */
  async match(row: SdsGap): Promise<void> {
    if (row.id == null) return;
    const key = String(row.id);
    const newSourceId = this.matchPick()[key];
    const gap = this.gap();
    if (!newSourceId || !gap) return;
    const candidate = gap.missingFromDb.find(c => c.sourceId === newSourceId);
    if (!candidate) { this.matchError.set('Candidate not found in current report'); return; }

    this.matching.set(true);
    this.matchError.set('');
    try {
      const combinedNames = [row.name, candidate.name].filter(Boolean).join('\n');
      const payload: SdsMatchChemical = {
        chemicalId: row.id,
        sourceItemId: newSourceId,
        names: combinedNames
      };
      const res = await this.electron.sdsMatchChemical(payload);
      if (!res.success) throw new Error(res.error || 'Match failed');

      // Optimistic update:
      //  - row leaves missingFromEbinder (now bound to a real eBinder id)
      //  - candidate leaves missingFromDb (the DB now has a chemical with that sourceId)
      //  - row gains missingPdf entry (it still has no PDF; close-gaps will fetch it)
      const updatedMissingPdf = [...gap.missingPdf];
      if (!updatedMissingPdf.some(p => p.id === row.id)) {
        updatedMissingPdf.push({
          id: row.id,
          sourceId: newSourceId,
          name: row.name,
          bookNumber: row.bookNumber,
          sectionNumber: row.sectionNumber
        });
      }
      this.gap.set({
        ...gap,
        missingFromEbinder: gap.missingFromEbinder.filter(e => e.id !== row.id),
        missingFromDb: gap.missingFromDb.filter(c => c.sourceId !== newSourceId),
        missingPdf: updatedMissingPdf
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
