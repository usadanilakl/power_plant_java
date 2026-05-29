import { Injectable } from '@angular/core';
import { SdsChemicalDto } from '../../../../models/sds/sds-chemical.model';

/**
 * Generates printable HTML for SDS documents and opens a print window.
 * Client-side (desktop only) — no backend dependency; reused by the intake wizard.
 *
 * - Title sheet: one chemical — all names + all locations + Book/Section in the top-right corner.
 * - Master index: every filed chemical, one row per name, alphabetical (Chemical | Book | Section | Location).
 */
@Injectable({ providedIn: 'root' })
export class RfSdsPrintService {

  /** Print the title sheet that gets filed at the chemical's section in the book. */
  printTitleSheet(c: SdsChemicalDto): void {
    const names = splitLines(c.names);
    const primary = names[0] || '(unnamed chemical)';
    const aliases = names.slice(1);
    const locations = splitLines(c.locations);

    const aliasHtml = aliases.length
      ? aliases.map(a => `<div class="alias">${esc(a)}</div>`).join('')
      : '';
    const locHtml = locations.length
      ? locations.map(l => `<div class="loc">${esc(l)}</div>`).join('')
      : '<div class="loc muted">— no locations recorded —</div>';

    const addr = (c.bookNumber != null || c.sectionNumber != null)
      ? `Book ${c.bookNumber ?? '—'}<br>Section ${c.sectionNumber ?? '—'}`
      : 'Not yet filed';

    const processed = c.processedByName
      ? `Processed by ${esc(c.processedByName)}${c.processedAt ? ' · ' + esc(formatDate(c.processedAt)) : ''}`
      : '';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SDS Title Sheet</title>
<style>
  @page { size: letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; }
  .addr { position: fixed; top: 0.4in; right: 0.4in; text-align: center; font-size: 20px;
    font-weight: bold; border: 3px solid #000; padding: 8px 14px; line-height: 1.3; }
  .names { margin-top: 2.2in; text-align: center; padding: 0 0.3in; }
  .primary { font-size: 46px; font-weight: 800; line-height: 1.1; word-wrap: break-word; }
  .alias { font-size: 22px; color: #333; margin-top: 8px; }
  .section-title { margin: 0.9in 0 0; padding-bottom: 4px; font-size: 15px; font-weight: bold;
    text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #000; }
  .loc { font-size: 22px; margin-top: 10px; }
  .muted { color: #888; font-style: italic; font-size: 16px; }
  .footer { position: fixed; bottom: 0.4in; left: 0.4in; font-size: 11px; color: #555; }
</style></head><body>
  <div class="addr">${addr}</div>
  <div class="names">
    <div class="primary">${esc(primary)}</div>
    ${aliasHtml}
  </div>
  <div class="section-title">Storage Locations</div>
  ${locHtml}
  <div class="footer">${processed}</div>
  <script>window.onload=function(){window.print();};</script>
</body></html>`;

    openPrintWindow(html);
  }

  /**
   * Print the master alphabetical index. One row per name; a chemical's aliases each appear,
   * all pointing to its single Book/Section. Excludes Removed and not-yet-filed chemicals.
   */
  printMasterIndex(chemicals: SdsChemicalDto[]): void {
    type Row = { name: string; book: number | null; section: number | null; locations: string };
    const rows: Row[] = [];
    for (const c of chemicals) {
      if (c.statusName === 'Removed') continue;
      if (c.bookNumber == null && c.sectionNumber == null) continue; // not yet filed
      const locations = splitLines(c.locations).join(', ');
      for (const name of splitLines(c.names)) {
        rows.push({ name, book: c.bookNumber, section: c.sectionNumber, locations });
      }
    }
    rows.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    const body = rows.length
      ? rows.map(r => `<tr>
          <td>${esc(r.name)}</td>
          <td class="num">${r.book ?? ''}</td>
          <td class="num">${r.section ?? ''}</td>
          <td>${esc(r.locations)}</td>
        </tr>`).join('')
      : '<tr><td colspan="4" class="empty">No filed chemicals yet.</td></tr>';

    const printed = new Date().toLocaleDateString();
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SDS Index</title>
<style>
  @page { size: letter; margin: 0.5in; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; margin: 0; }
  h1 { text-align: center; font-size: 18px; margin: 0 0 4px; }
  .meta { text-align: center; font-size: 10px; color: #555; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #000; padding: 3px 6px; text-align: left; vertical-align: top; }
  th { background: #e8e8e8; }
  td.num { text-align: center; width: 56px; }
  td.empty { text-align: center; font-style: italic; color: #888; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
</style></head><body>
  <h1>SDS INDEX</h1>
  <div class="meta">${rows.length} entries · printed ${printed}</div>
  <table>
    <thead><tr><th>Chemical Name</th><th>Book</th><th>Section</th><th>Location</th></tr></thead>
    <tbody>${body}</tbody>
  </table>
  <script>window.onload=function(){window.print();};</script>
</body></html>`;

    openPrintWindow(html);
  }
}

function splitLines(text: string | null | undefined): string[] {
  return (text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function esc(s: string | null | undefined): string {
  return (s || '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string
  ));
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
}

function openPrintWindow(html: string): void {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Could not open the print window. Please allow pop-ups for this site.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
