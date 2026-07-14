import { Injectable, signal, computed, inject } from '@angular/core';
import {
  ElectronService,
  SdsGap,
  SdsGapReport,
  SdsScrapeReport,
  SdsMatchChemical,
  SdsEmailGapReportResult,
  SdsEmailRecipient,
  SdsSyncPdfsReport
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
  emailIncludeAttachments = signal(true);
  emailSending = signal(false);
  emailError = signal('');
  emailResult = signal<SdsEmailGapReportResult | null>(null);
  emailRecipients = signal<SdsEmailRecipient[]>([]);

  openEmailDialog(): void {
    try {
      this.emailTo.set(localStorage.getItem(SdsImportStateService.EMAIL_RECIPIENT_KEY) ?? '');
      this.emailCc.set(localStorage.getItem(SdsImportStateService.EMAIL_CC_KEY) ?? '');
    } catch { /* ignore */ }
    this.emailError.set('');
    this.emailResult.set(null);
    this.emailIncludeAttachments.set(true);
    this.emailDialogOpen.set(true);
    // Fire-and-forget — typeahead loads in the background, dialog stays usable with free-text.
    if (this.emailRecipients().length === 0) {
      this.electron.sdsGetEmailRecipients().then(res => {
        if (res.success && res.data) this.emailRecipients.set(res.data);
      }).catch(() => { /* ignore — dialog falls back to free-text only */ });
    }
  }

  /**
   * If the typed string matches a personnel name, swap it for the email address so the form
   * submits a valid To. Free-text emails pass through unchanged.
   */
  resolveRecipientNameToEmail(): void {
    const typed = this.emailTo().trim();
    if (!typed || typed.includes('@')) return;
    const match = this.emailRecipients().find(r =>
      r.name.toLowerCase() === typed.toLowerCase());
    if (match) this.emailTo.set(match.email);
  }

  closeEmailDialog(): void { this.emailDialogOpen.set(false); }

  async sendEmail(): Promise<void> {
    this.resolveRecipientNameToEmail();
    const to = this.emailTo().trim();
    if (!to) { this.emailError.set('Recipient is required'); return; }
    if (!to.includes('@')) {
      this.emailError.set(`"${to}" doesn't match a personnel name and isn't an email address.`);
      return;
    }
    const cc = this.emailCc().trim();

    this.emailSending.set(true);
    this.emailError.set('');
    this.emailResult.set(null);
    try {
      const res = await this.electron.sdsEmailGapReport({
        to,
        cc: cc || undefined,
        includeAttachments: this.emailIncludeAttachments()
      });
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

  // ─── Sync PDFs (walk-and-replace reconcile) ───────────────────────────────
  syncingPdfs = signal(false);
  syncPdfsError = signal('');
  syncPdfsReport = signal<SdsSyncPdfsReport | null>(null);
  syncPdfsIsPreview = signal(false);
  /** Cap number of chemicals to process — for a first-live-run scope check. 0/blank = no cap. */
  syncPdfsLimit = signal(0);
  syncPdfsLimitEnabled = signal(false);

  async syncPdfs(dryRun: boolean): Promise<void> {
    if (!dryRun) {
      const ok = window.confirm(
        'For each chemical listed in the eBinder, we will download its current PDF and, if it ' +
        "differs from what we have, replace this chemical's eBinder-owned attachments (local + " +
        'SharePoint) with the fresh copy.\n\n' +
        'PRESERVED — never touched by this tool:\n' +
        '  • Chemicals not on the eBinder (including your manual submissions).\n' +
        "  • Manual uploads on chemicals that ARE on the eBinder (any attachment we didn't scrape).\n" +
        '  • Chemicals whose eBinder PDF matches your current copy byte-for-byte.\n\n' +
        'Deletes propagate to every desktop via the attachment sync channel.\n\n' +
        'This runs an eBinder walk (a few minutes for the full inventory). Continue?'
      );
      if (!ok) return;
    }

    this.syncingPdfs.set(true);
    this.syncPdfsError.set('');
    this.syncPdfsReport.set(null);
    this.syncPdfsIsPreview.set(dryRun);
    this.startPolling();
    try {
      const limit = this.syncPdfsLimitEnabled() ? Math.max(0, this.syncPdfsLimit() | 0) : 0;
      const res = await this.electron.sdsSyncPdfs({
        filterLocation: this.filterLocation(),
        showWindow: this.showWindow(),
        dryRun,
        limit: limit > 0 ? limit : undefined
      });
      if (!res.success) throw new Error(res.error || 'Sync PDFs failed');
      const rep = res.data ?? null;
      this.syncPdfsReport.set(rep);
      if (!rep) {
        // Backend never accepted a single batch — usually the hub-only endpoint returned 403 from
        // the local Spring Boot (this instance isn't the hub). Check the Electron main log for the
        // transport errors to confirm; the routing helper redirects to the hub URL when
        // sync-config.properties is present.
        this.syncPdfsError.set('No batches were accepted by the backend. Check the Electron log '
          + '(look for "[SDS-Sync] transport error") — most likely this desktop is posting to '
          + 'its own Spring Boot instead of the hub, or the hub is unreachable.');
      } else if (rep.preflightBlockers.length > 0) {
        this.syncPdfsError.set('Preflight blocked: ' + rep.preflightBlockers.join('; '));
      } else if (rep.chemicalsChecked === 0) {
        this.syncPdfsError.set('Backend accepted requests but processed 0 chemicals. Preflight or '
          + 'endpoint gating may have rejected each one — see the log.');
      }
    } catch (err: any) {
      this.syncPdfsError.set(err.message || 'Sync PDFs failed');
    } finally {
      this.syncingPdfs.set(false);
      this.stopPolling();
    }
  }

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
