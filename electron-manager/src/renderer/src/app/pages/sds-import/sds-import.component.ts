import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService, SdsGapReport, SdsScrapeReport } from '../../services/electron.service';

@Component({
  selector: 'app-sds-import',
  standalone: true,
  imports: [CommonModule],
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

      <!-- Step 1: report -->
      <div class="card">
        <div class="card-title">1 · Run report</div>
        <p class="muted">Scrapes the eBinder list fresh (names + IDs, no PDFs) and compares it against the
          database. Opens a headless browser — takes up to a minute. Does not change anything.</p>
        <button class="btn btn-primary" [disabled]="loadingReport" (click)="runReport()">
          {{ loadingReport ? 'Scraping list…' : 'Run report' }}
        </button>
        @if (reportError) { <div class="error-banner">{{ reportError }}</div> }

        @if (gap) {
          <div class="stats">
            <span class="stat ok">{{ gap.activeCount }} in database</span>
            <span class="stat warn">{{ gap.missingFromDb.length }} on website, missing from DB</span>
            <span class="stat new">{{ gap.missingPdf.length }} in DB, missing PDF</span>
          </div>

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

      <!-- Step 2: close gaps -->
      @if (gap) {
        <div class="card">
          <div class="card-title">2 · Close gaps</div>
          <p class="muted">
            Scrapes the eBinder for Jackson Generation: creates the {{ gap.missingFromDb.length }} missing
            entries and downloads &amp; attaches SDS PDFs (existing PDFs are skipped). This opens a headless
            browser and can take a few minutes.
          </p>
          <button class="btn btn-primary" [disabled]="scraping" (click)="closeGaps()">
            {{ scraping ? 'Scraping eBinder…' : 'Close gaps (scrape eBinder)' }}
          </button>
          @if (scrapeError) { <div class="error-banner">{{ scrapeError }}</div> }

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
    .card { background: var(--surface, #1f2230); border: 1px solid var(--border, #333); border-radius: 10px;
      padding: 16px; margin-bottom: 16px; }
    .card-title { font-weight: 700; margin-bottom: 8px; }
    .muted { color: var(--text-secondary, #aaa); font-size: 13px; margin: 0 0 12px; }
    .stats { display: flex; gap: 10px; flex-wrap: wrap; margin: 14px 0 10px; }
    .stat { padding: 4px 10px; border-radius: 12px; font-size: 13px; font-weight: 600; }
    .stat.ok { background: rgba(34,197,94,.15); color: #4ade80; }
    .stat.new { background: rgba(59,130,246,.15); color: #60a5fa; }
    .stat.warn { background: rgba(245,158,11,.15); color: #fbbf24; }
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
    .btn:disabled { opacity: .5; cursor: not-allowed; }
  `]
})
export class SdsImportComponent {
  gap: SdsGapReport | null = null;
  loadingReport = false;
  reportError = '';

  scraping = false;
  scrapeError = '';
  scrapeReport: SdsScrapeReport | null = null;

  constructor(private electron: ElectronService) {}

  async runReport(): Promise<void> {
    this.loadingReport = true;
    this.reportError = '';
    this.scrapeReport = null;
    this.scrapeError = '';
    try {
      const res = await this.electron.sdsGapReport();
      if (!res.success || !res.data) throw new Error(res.error || 'Gap report failed');
      this.gap = res.data;
    } catch (err: any) {
      this.reportError = err.message || 'Gap report failed';
    } finally {
      this.loadingReport = false;
    }
  }

  async closeGaps(): Promise<void> {
    this.scraping = true;
    this.scrapeError = '';
    this.scrapeReport = null;
    try {
      const res = await this.electron.sdsScrapeRun();
      if (!res.success) throw new Error(res.error || 'Scrape failed');
      this.scrapeReport = res.data?.lastReport ?? null;
      if (!this.scrapeReport && res.data?.error) this.scrapeError = res.data.error;
    } catch (err: any) {
      this.scrapeError = err.message || 'Scrape failed';
    } finally {
      this.scraping = false;
    }
  }
}
