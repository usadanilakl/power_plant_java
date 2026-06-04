import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SdsGap } from '../../services/electron.service';
import { SdsImportStateService } from '../../services/sds-import-state.service';

@Component({
  selector: 'app-sds-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">SDS Import &amp; Gap Closing</h1>
      </div>

      <p class="intro">
        Seed the inventory first from <strong>Admin → SDS</strong> (loads the book ↔ eBinder match into
        the database + SharePoint, metadata only). Then run the report here to see what's still missing,
        and close the gaps by scraping the eBinder for the missing entries and the SDS PDFs.
      </p>

      <!-- Scrape options -->
      <div class="card opts">
        <label class="opt">
          <input type="checkbox" [(ngModel)]="filterLocation">
          <span>Filter to Jackson Generation</span>
          <small>Uncheck to scrape <em>all sites</em> (~5000 chemicals across the company).</small>
        </label>
        <label class="opt">
          <input type="checkbox" [(ngModel)]="showWindow">
          <span>Show browser window (debug)</span>
          <small>Opens the headless eBinder window so you can watch the scrape — useful when the
            location filter or PDF capture misbehaves.</small>
        </label>
      </div>

      <!-- Live progress banner — visible whenever a scrape/upload is running. -->
      @if (progressText) {
        <div class="info-banner progress-banner">{{ progressText }}</div>
      }

      <!-- Step 1: report -->
      <div class="card">
        <div class="card-title">1 · Run report</div>
        <p class="muted">Scrapes the eBinder list fresh (names + IDs, no PDFs) and compares it against the
          database. Opens a headless browser — takes up to a minute. Does not change anything.</p>
        <div class="actions">
          <button class="btn btn-primary" [disabled]="loadingReport" (click)="runReport()">
            {{ loadingReport ? 'Scraping list…' : 'Run report' }}
          </button>
          @if (loadingReport) {
            <button class="btn btn-stop" (click)="stop()">Stop</button>
          }
        </div>
        @if (reportError) { <div class="error-banner">{{ reportError }}</div> }

        @if (gap) {
          <div class="stats">
            <span class="stat ok">{{ gap.activeCount }} in database</span>
            <span class="stat warn">{{ gap.missingFromDb.length }} on website, missing from DB</span>
            <span class="stat new">{{ gap.missingPdf.length }} in DB, missing PDF</span>
            @if (gap.missingFromEbinder.length) {
              <span class="stat unmatched">{{ gap.missingFromEbinder.length }} missing from eBinder</span>
            }
          </div>

          <div class="actions" style="margin-top: 8px;">
            <button class="btn" (click)="openEmailDialog()"
                    title="Email this report to someone. PDFs for every 'Missing on eBinder' chemical are attached so the recipient can upload them to the eBinder.">
              Email Report
            </button>
          </div>

          @if (gap.missingFromEbinder.length) {
            <details class="list" open>
              <summary>Missing on eBinder, present in app ({{ gap.missingFromEbinder.length }})</summary>
              <p class="hint">Chemicals in the database whose source id isn't in the live eBinder —
                either book-only seed entries (synthetic <code>BOOK-{{ '{book}-{section}' }}</code> ids)
                or chemicals removed from the eBinder. Pick an eBinder candidate from the
                "missing from DB" list, then click <strong>Match</strong>. Close gaps will then
                download its PDF.</p>
              <table class="match-table">
                <thead>
                  <tr><th>App chemical</th><th>Address</th><th>Current source id</th><th>eBinder candidate</th><th></th></tr>
                </thead>
                <tbody>
                  @for (row of gap.missingFromEbinder; track row.id) {
                    <tr>
                      <td>{{ row.name }}</td>
                      <td class="mono">B{{ row.bookNumber }}/S{{ row.sectionNumber }}</td>
                      <td class="mono">{{ row.sourceId }}</td>
                      <td>
                        <select [(ngModel)]="matchPick[row.id!]" class="match-select">
                          <option [ngValue]="''">— choose eBinder item —</option>
                          @for (c of gap.missingFromDb; track c.sourceId) {
                            <option [ngValue]="c.sourceId">{{ c.name || '(unnamed)' }} · #{{ c.sourceId }}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <button class="btn btn-primary btn-small"
                                [disabled]="!matchPick[row.id!] || matching"
                                (click)="match(row)">
                          Match
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              @if (matchError) { <div class="error-banner">{{ matchError }}</div> }
            </details>
          }

          <div class="cols">
            <details class="list">
              <summary>Full chemicals missing from the database ({{ gap.missingFromDb.length }})</summary>
              <ul>@for (m of gap.missingFromDb; track m.sourceId) {
                <li>{{ m.name || '(unnamed)' }} <span class="mono">#{{ m.sourceId }}</span></li>
              }</ul>
            </details>

            <details class="list">
              <summary>Present chemicals missing their PDF ({{ gap.missingPdf.length }})</summary>
              <ul>@for (m of gap.missingPdf; track $index) {
                <li>{{ m.name }}
                  @if (m.bookNumber != null) { <span class="addr">B{{ m.bookNumber }}/S{{ m.sectionNumber }}</span> }
                </li>
              }</ul>
            </details>
          </div>
        }
      </div>

      <!-- Email Report dialog -->
      @if (emailDialogOpen) {
        <div class="modal-backdrop" (click)="closeEmailDialog()"></div>
        <div class="modal-card">
          <div class="modal-title">Email gap report</div>
          <p class="muted">
            Sends the report HTML. Every "missing on eBinder" chemical's local PDFs are attached
            so the recipient can upload them to the eBinder. Attachments are split across multiple
            emails if needed to stay under the size cap.
          </p>
          <label class="modal-label">To</label>
          <input class="modal-input" type="text" list="sds-email-recipients"
                 [ngModel]="emailTo" (ngModelChange)="emailTo = $event"
                 placeholder="Type a name or email…"
                 [disabled]="emailSending" />
          <datalist id="sds-email-recipients">
            @for (r of emailRecipients; track r.email) {
              <option [value]="r.name">{{ r.email }}</option>
            }
          </datalist>
          @if (emailRecipients.length > 0) {
            <div class="hint">Pick from {{ emailRecipients.length }} personnel, or type any email address.</div>
          }
          <label class="modal-label">CC (optional)</label>
          <input class="modal-input" type="text"
                 [ngModel]="emailCc" (ngModelChange)="emailCc = $event"
                 placeholder="comma-separated"
                 [disabled]="emailSending" />
          @if (emailError) { <div class="error-banner">{{ emailError }}</div> }
          @if (emailResult && emailResult.sent) {
            <div class="info-banner">
              {{ emailResult.message }}
              @if (emailResult.partsSent > 1) {
                <div class="hint">Sent in {{ emailResult.partsSent }} parts.</div>
              }
              @if (emailResult.attachmentsSkipped > 0) {
                <div class="hint">{{ emailResult.attachmentsSkipped }} file(s) too large to email — listed in the report body.</div>
              }
            </div>
          }
          <div class="modal-actions">
            <button class="btn" (click)="closeEmailDialog()" [disabled]="emailSending">
              {{ emailResult?.sent ? 'Close' : 'Cancel' }}
            </button>
            <button class="btn btn-primary" (click)="sendEmail()" [disabled]="emailSending || !emailTo.trim()">
              {{ emailSending ? 'Sending…' : 'Send' }}
            </button>
          </div>
        </div>
      }

      <!-- Step 2: close gaps -->
      @if (gap) {
        <div class="card">
          <div class="card-title">2 · Close gaps</div>
          <p class="muted">
            Scrapes the eBinder for Jackson Generation: creates the {{ gap.missingFromDb.length }} missing
            entries and downloads &amp; attaches SDS PDFs (existing PDFs are skipped). This opens a headless
            browser and can take a few minutes.
          </p>
          <div class="actions">
            <button class="btn btn-primary" [disabled]="scraping" (click)="closeGaps()">
              {{ scraping ? 'Scraping eBinder…' : 'Close gaps (scrape eBinder)' }}
            </button>
            <button class="btn btn-warn" [disabled]="scraping" (click)="reloadAllPdfs()" title="Delete all local SDS PDFs and re-download them from the eBinder. Useful after a capture bug or to refresh stale files. SharePoint attachments are not removed.">
              {{ scraping ? '…' : 'Reload all PDFs' }}
            </button>
            @if (scraping) {
              <button class="btn btn-stop" (click)="stop()">Stop</button>
            }
          </div>
          @if (scrapeError) { <div class="error-banner">{{ scrapeError }}</div> }
          @if (reloadInfo) { <div class="info-banner">{{ reloadInfo }}</div> }

          @if (scrapeReport) {
            <div class="final">
              <div>Created: {{ scrapeReport.created }} · Updated: {{ scrapeReport.updated }}
                · PDFs attached: {{ scrapeReport.pdfsAttached }}</div>
              <div>Scraped {{ scrapeReport.sourceCount }} from the eBinder
                · Revised: {{ scrapeReport.revisedChemicals.length }}
                · Missing from source: {{ scrapeReport.missingFromSource.length }}</div>
              <div class="hint">Re-run the report above to confirm the gaps are closed.</div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .intro { color: var(--text-secondary, #aaa); max-width: 800px; margin: 0 0 16px; line-height: 1.5; }
    .opts { display: flex; gap: 24px; flex-wrap: wrap; padding: 12px 16px; }
    .opt { display: flex; align-items: flex-start; gap: 8px; cursor: pointer; max-width: 360px; }
    .opt input { margin-top: 3px; accent-color: #3b82f6; }
    .opt span { font-weight: 600; }
    .opt small { display: block; color: var(--text-secondary, #888); font-size: 12px; margin-top: 2px; }
    .opt > div { display: flex; flex-direction: column; }
    .card { background: var(--surface, #1f2230); border: 1px solid var(--border, #333); border-radius: 10px;
      padding: 16px; margin-bottom: 16px; }
    .card-title { font-weight: 700; margin-bottom: 8px; }
    .muted { color: var(--text-secondary, #aaa); font-size: 13px; margin: 0 0 12px; }
    .stats { display: flex; gap: 10px; flex-wrap: wrap; margin: 14px 0 10px; }
    .stat { padding: 4px 10px; border-radius: 12px; font-size: 13px; font-weight: 600; }
    .stat.ok { background: rgba(34,197,94,.15); color: #4ade80; }
    .stat.new { background: rgba(59,130,246,.15); color: #60a5fa; }
    .stat.warn { background: rgba(245,158,11,.15); color: #fbbf24; }
    .stat.unmatched { background: rgba(168,85,247,.18); color: #c084fc; }
    .hint { color: var(--text-secondary, #888); font-size: 12px; margin: 6px 0 10px; }
    .match-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .match-table th, .match-table td { padding: 6px 8px; border-bottom: 1px solid var(--border, #2a2a2a); text-align: left; vertical-align: middle; }
    .match-table th { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--text-secondary, #888); }
    .match-select { width: 100%; min-width: 260px; padding: 4px 6px; background: var(--surface-2, #2a2d3a); color: inherit; border: 1px solid var(--border, #333); border-radius: 4px; }
    .btn-small { padding: 4px 12px; font-size: 12px; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 760px) { .cols { grid-template-columns: 1fr; } }
    .list { font-size: 13px; border: 1px solid var(--border, #333); border-radius: 6px; padding: 8px 10px; }
    .list summary { cursor: pointer; font-weight: 600; }
    .list ul { margin: 8px 0 0; padding-left: 18px; max-height: 320px; overflow: auto; color: var(--text-secondary, #ccc); }
    .list li { margin-bottom: 3px; }
    .mono { font-family: monospace; font-size: 12px; color: var(--text-secondary, #aaa); }
    .addr { font-family: monospace; font-size: 11px; color: #60a5fa; margin-left: 6px; }
    .error-banner { background: rgba(239,68,68,.12); color: #f87171; padding: 8px 12px; border-radius: 6px; margin-top: 10px; font-size: 13px; }
    .final { margin-top: 12px; font-size: 13px; color: var(--text-secondary, #ccc); display: flex; flex-direction: column; gap: 4px; }
    .hint { color: var(--text-secondary, #888); font-style: italic; }
    .btn { padding: 8px 18px; border-radius: 6px; border: 1px solid var(--border, #333); cursor: pointer;
      background: var(--surface-2, #2a2d3a); color: inherit; font-size: 14px; }
    .btn-primary { background: #3b82f6; border-color: #3b82f6; color: #fff; }
    .btn-stop { background: #dc2626; border-color: #dc2626; color: #fff; }
    .btn-stop:hover { background: #b91c1c; border-color: #b91c1c; }
    .btn-warn { background: #d97706; border-color: #d97706; color: #fff; }
    .btn-warn:hover:not(:disabled) { background: #b45309; border-color: #b45309; }
    .info-banner { background: rgba(59,130,246,.12); color: #93c5fd; padding: 8px 12px; border-radius: 6px; margin-top: 10px; font-size: 13px; }
    .progress-banner { margin: 0 0 12px; font-weight: 600; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .actions { display: flex; gap: 8px; align-items: center; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 99; }
    .modal-card { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: var(--surface, #1f2230); border: 1px solid var(--border, #333); border-radius: 10px;
      padding: 20px; width: min(480px, 92vw); z-index: 100; box-shadow: 0 12px 40px rgba(0,0,0,.5); }
    .modal-title { font-weight: 700; font-size: 16px; margin-bottom: 8px; }
    .modal-label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .04em;
      color: var(--text-secondary, #aaa); margin: 10px 0 4px; }
    .modal-input { width: 100%; padding: 8px 10px; background: var(--surface-2, #2a2d3a); color: inherit;
      border: 1px solid var(--border, #333); border-radius: 6px; font-size: 14px; box-sizing: border-box; }
    .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
  `]
})
export class SdsImportComponent {
  // All state lives in SdsImportStateService so it survives router navigation. The component is
  // a thin shim — getters/setters proxy to the service signals (so the existing template binds
  // without changes), and action methods just call the service.
  private state = inject(SdsImportStateService);

  get filterLocation() { return this.state.filterLocation(); }
  set filterLocation(v: boolean) { this.state.filterLocation.set(v); }
  get showWindow() { return this.state.showWindow(); }
  set showWindow(v: boolean) { this.state.showWindow.set(v); }

  get gap() { return this.state.gap(); }
  get loadingReport() { return this.state.loadingReport(); }
  get reportError() { return this.state.reportError(); }
  get scraping() { return this.state.scraping(); }
  get scrapeError() { return this.state.scrapeError(); }
  get scrapeReport() { return this.state.scrapeReport(); }
  get reloadInfo() { return this.state.reloadInfo(); }
  get matching() { return this.state.matching(); }
  get matchError() { return this.state.matchError(); }
  get progressText() { return this.state.progressText(); }

  get emailDialogOpen() { return this.state.emailDialogOpen(); }
  get emailTo() { return this.state.emailTo(); }
  set emailTo(v: string) { this.state.emailTo.set(v); }
  get emailCc() { return this.state.emailCc(); }
  set emailCc(v: string) { this.state.emailCc.set(v); }
  get emailSending() { return this.state.emailSending(); }
  get emailError() { return this.state.emailError(); }
  get emailResult() { return this.state.emailResult(); }
  get emailRecipients() { return this.state.emailRecipients(); }

  openEmailDialog() { return this.state.openEmailDialog(); }
  closeEmailDialog() { return this.state.closeEmailDialog(); }
  sendEmail() { return this.state.sendEmail(); }

  // matchPick is ephemeral UI state for the per-row dropdowns — the service holds it as a signal
  // but we expose the underlying Record for direct ngModel two-way binding via index access. Any
  // mutation will be picked up on the next read because we re-set the signal in the proxy setter.
  get matchPick(): Record<string, string> {
    // Return a proxy so writes like `matchPick[k] = v` re-set the signal so change detection runs.
    const current = this.state.matchPick();
    return new Proxy(current, {
      set: (_target, prop, value) => {
        const next = { ...this.state.matchPick(), [prop as string]: value };
        this.state.matchPick.set(next);
        return true;
      }
    });
  }

  runReport() { return this.state.runReport(); }
  closeGaps() { return this.state.closeGaps(); }
  reloadAllPdfs() { return this.state.reloadAllPdfs(); }
  stop() { return this.state.stop(); }
  match(row: SdsGap) { return this.state.match(row); }
}
