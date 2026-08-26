import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { LotoStandardApiService } from '../loto-standard/loto-standard-api.service';
import { QrApiService, QrForbiddenError } from '../qr/qr-api.service';
import { QrDrawingHostComponent } from '../qr/qr-drawing-host.component';
import { QrMatch } from '../qr/qr.model';
import { EquipmentFinderApiService } from './equipment-finder-api.service';
import {
  FINDER_FIELDS, FilterMode, FinderFieldKey, FinderItem, FinderRequest, FinderResult,
} from './equipment-finder.model';

/**
 * Equipment Finder — find a LOTO point or a piece of equipment from what you can remember about it,
 * then open its P&amp;ID with that item highlighted.
 *
 * <p>Five independent filter boxes, each a bucket of words with its own AND/OR (AND by default), and
 * boxes always combine with AND. A typed phrase splits into words on whitespace or commas, which is
 * what makes the bucket a bucket: "455 cnd" hunts two fragments and finds 1CND455, where the phrase
 * searched whole finds nothing. Words become chips so it stays visible what is actually being
 * searched for — and so a phone keyboard cannot quietly merge two terms into one.</p>
 *
 * <p>Location and Equipment type additionally suggest known Value names as you type, without ceasing
 * to be free text; see {@code loadOptions}.</p>
 *
 * <p>Equipment appears only where no LOTO point references it — a referenced equipment row IS the LOTO
 * point's occurrence on the drawing, so listing both would show one physical thing twice. That rule
 * lives on the server; see {@code PwaEquipmentFinderService}.</p>
 *
 * <p>Opening a row reuses the scanned-label machinery wholesale: {@code QrApiService.resolveItem} for
 * the drawings and {@link QrDrawingHostComponent} for the viewer, connectors and back stack.</p>
 */
@Component({
  selector: 'app-equipment-finder-page',
  standalone: true,
  imports: [MainLayoutComponent, QrDrawingHostComponent],
  template: `
    <app-main-layout [header]="'Equipment Finder'">
      <ng-container main-content>
        <div class="ef-container">

          <div class="ef-filters">
            @for (f of fields; track f.key) {
              <div class="ef-filter">
                <div class="ef-filter-head">
                  <span class="ef-label">{{ f.label }}</span>
                  @if (terms()[f.key].length > 1) {
                    <span class="ef-modes">
                      <button class="ef-mode" [class.active]="modes()[f.key] === 'OR'"
                              (click)="setMode(f.key, 'OR')">any</button>
                      <button class="ef-mode" [class.active]="modes()[f.key] === 'AND'"
                              (click)="setMode(f.key, 'AND')">all</button>
                    </span>
                  }
                </div>

                @if (terms()[f.key].length) {
                  <div class="ef-chips">
                    @for (t of terms()[f.key]; track t) {
                      <button class="ef-chip" (click)="removeTerm(f.key, t)" [attr.aria-label]="'Remove ' + t">
                        {{ t }} <span class="ef-chip-x">✕</span>
                      </button>
                    }
                  </div>
                }

                <!--
                  No (blur) commit on purpose. Committing turns the typed word into a chip, which adds
                  a row ABOVE the buttons — and blur fires before the click that caused it, so tapping
                  Search with a half-typed word would move the button out from under the finger.
                  search() folds any uncommitted text in instead, so nothing is lost by waiting.
                -->
                <div class="ef-input-wrap">
                  <input class="ef-input" type="search" autocomplete="off" autocapitalize="none"
                         [placeholder]="f.placeholder"
                         [value]="pending()[f.key]"
                         (input)="onInput(f.key, $event)"
                         (keydown.enter)="commit(f.key)"
                         (focus)="onFocus(f.key)"
                         (blur)="onBlur(f.key)">
                  @if (f.suggest && suggestions(f.key).length) {
                    <div class="ef-suggest">
                      @for (o of suggestions(f.key); track o) {
                        <button type="button" class="ef-suggest-item"
                                (pointerdown)="pickSuggestion(f.key, o, $event)">{{ o }}</button>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <div class="ef-actions">
            <button class="ef-btn" (click)="search()" [disabled]="searching()">
              {{ searching() ? 'Searching…' : 'Search' }}
            </button>
            <button class="ef-btn ef-btn-plain" (click)="clearAll()">Clear</button>
          </div>

          @if (error()) {
            <p class="ef-msg ef-err">{{ error() }}</p>
          }
          <!-- Only the list-level notices land here; a row-level one renders on its own row instead. -->
          @if (notice() && !noticeKey()) {
            <p class="ef-msg ef-notice">{{ notice() }}</p>
          }

          @if (result(); as r) {
            @if (!r.items.length) {
              <p class="ef-msg">Nothing matched those filters.</p>
            } @else {
              <p class="ef-summary">
                {{ r.lotoPointMatches }} LOTO {{ r.lotoPointMatches === 1 ? 'point' : 'points' }}
                · {{ r.equipmentMatches }} unreferenced equipment
                @if (r.truncated) { <span class="ef-trunc"> — showing first {{ r.items.length }}</span> }
              </p>
              <div class="ef-list">
                @for (item of r.items; track item.type + item.id) {
                  <button class="ef-item" [class.opening]="openingKey() === item.type + item.id"
                          (click)="open(item)">
                    <span class="ef-item-head">
                      <span class="ef-tag">{{ item.tagNumber || '(no tag)' }}</span>
                      <span class="ef-badge" [class.equipment]="item.type === 'equipment'">
                        {{ item.type === 'lotoPoint' ? 'LOTO point' : 'Equipment' }}
                      </span>
                    </span>
                    @if (item.description) { <span class="ef-desc">{{ item.description }}</span> }
                    <span class="ef-meta">
                      {{ metaLine(item) }}
                      @if (!item.hasDrawing) { <span class="ef-nodraw"> · no drawing</span> }
                    </span>
                    <!-- Row-level outcome shown ON the row: a message at the top of a long list is
                         off-screen by the time you have scrolled down far enough to tap this one. -->
                    @if (noticeKey() === item.type + item.id) {
                      <span class="ef-row-note">{{ notice() }}</span>
                    }
                  </button>
                }
              </div>
            }
          }
        </div>
      </ng-container>
    </app-main-layout>

    @if (selected(); as m) {
      <app-qr-drawing-host [title]="m.tagNumber || 'Item'" [drawings]="m.drawings" (exit)="closeDrawing()"></app-qr-drawing-host>
    }
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .ef-container { padding: 1rem; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; }
    .ef-filters { display: flex; flex-direction: column; gap: 0.75rem; }
    .ef-filter { display: flex; flex-direction: column; gap: 0.35rem; }
    .ef-filter-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .ef-label { font-size: 0.8rem; font-weight: 700; color: var(--secondary-text, #888); text-transform: uppercase; letter-spacing: 0.03em; }
    .ef-modes { display: flex; gap: 0.25rem; }
    .ef-mode { background: transparent; border: 1px solid var(--border-color); color: var(--secondary-text, #888); border-radius: 999px; padding: 0.1rem 0.6rem; font-size: 0.72rem; font-weight: 700; font-family: inherit; cursor: pointer; }
    .ef-mode.active { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }
    .ef-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .ef-chip { display: inline-flex; align-items: center; gap: 0.3rem; background: var(--accent-color); color: #fff; border: none; border-radius: 999px; padding: 0.25rem 0.7rem; font-size: 0.8rem; font-weight: 700; font-family: inherit; cursor: pointer; }
    .ef-chip-x { opacity: 0.75; font-size: 0.7rem; }
    /* Anchor for the dropdown; the list floats so it never pushes the form around while typing. */
    .ef-input-wrap { position: relative; }
    .ef-suggest { position: absolute; top: calc(100% + 2px); left: 0; right: 0; z-index: 5; display: flex; flex-direction: column; background: var(--secondary-background, #1e1e1e); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; max-height: 15rem; overflow-y: auto; box-shadow: 0 6px 18px rgba(0,0,0,0.45); }
    .ef-suggest-item { text-align: left; background: transparent; border: none; border-bottom: 1px solid var(--border-color); color: var(--primary-text); padding: 0.55rem 0.8rem; font-family: inherit; font-size: 0.9rem; cursor: pointer; }
    .ef-suggest-item:last-child { border-bottom: none; }
    .ef-suggest-item:active { background: var(--accent-color); color: #fff; }
    .ef-input { width: 100%; box-sizing: border-box; padding: 0.6rem 0.8rem; background: var(--card-bg, #2a2a2a); color: var(--primary-text); border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; font-size: 0.95rem; }
    .ef-actions { display: flex; gap: 0.5rem; margin: 1rem 0 0.5rem; }
    .ef-btn { flex: 1; background: var(--accent-color); color: #fff; border: none; border-radius: 8px; padding: 0.7rem 1rem; font-weight: 700; font-family: inherit; font-size: 0.95rem; cursor: pointer; }
    .ef-btn[disabled] { opacity: 0.6; }
    .ef-btn-plain { flex: 0 0 auto; background: transparent; border: 1px solid var(--border-color); color: var(--secondary-text, #888); }
    .ef-msg { color: var(--primary-text); text-align: center; margin: 0.8rem 0; }
    .ef-err { color: #e74c3c; }
    .ef-notice { color: var(--secondary-text, #888); font-size: 0.85rem; }
    .ef-summary { color: var(--secondary-text, #888); font-size: 0.8rem; margin: 0.9rem 0 0.5rem; }
    .ef-trunc { color: #e0a030; }
    .ef-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .ef-item { display: flex; flex-direction: column; gap: 0.25rem; text-align: left; background: var(--card-bg, #2a2a2a); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.8rem 0.9rem; font-family: inherit; cursor: pointer; }
    .ef-item.opening { opacity: 0.55; }
    .ef-item-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .ef-tag { font-weight: 700; color: var(--primary-text); }
    .ef-badge { flex-shrink: 0; font-size: 0.68rem; font-weight: 700; color: #fff; background: var(--accent-color); border-radius: 999px; padding: 0.15rem 0.55rem; }
    .ef-badge.equipment { background: #6b7280; }
    .ef-desc { color: var(--primary-text); font-size: 0.88rem; }
    .ef-meta { color: var(--secondary-text, #888); font-size: 0.75rem; }
    .ef-nodraw { color: #e0a030; }
    .ef-row-note { color: #e0a030; font-size: 0.78rem; margin-top: 0.15rem; }
  `]
})
export class EquipmentFinderPageComponent implements OnInit {
  private api = inject(EquipmentFinderApiService);
  private qrApi = inject(QrApiService);
  private lotoApi = inject(LotoStandardApiService);

  readonly fields = FINDER_FIELDS;

  /** Value names for the boxes that have a known list — see {@link loadOptions}. */
  options = signal<Record<FinderFieldKey, string[]>>(this.byField<string[]>(() => []));
  /** Which box has focus, so only that one shows its dropdown. */
  focusedKey = signal<FinderFieldKey | null>(null);

  terms = signal<Record<FinderFieldKey, string[]>>(this.emptyTerms());
  modes = signal<Record<FinderFieldKey, FilterMode>>(this.defaultModes());
  pending = signal<Record<FinderFieldKey, string>>(this.emptyPending());

  searching = signal(false);
  error = signal<string | null>(null);
  notice = signal<string | null>(null);
  /** Set when {@link notice} belongs to one row, so it renders there instead of above the list. */
  noticeKey = signal<string | null>(null);
  result = signal<FinderResult | null>(null);

  /** The item whose drawings are open, and which row is mid-fetch (rows are one tap from a network call). */
  selected = signal<QrMatch | null>(null);
  openingKey = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadOptions();
  }

  /**
   * Fill the Location / Equipment type dropdowns from the Value lists the LOTO walkdown already
   * serves ({@code /api/pwa/secured/loto-standards/positions}) — same audience, same Values, no new
   * endpoint. Failure is silent on purpose: both boxes are free text, so a missing list costs a
   * shortcut, not the search.
   */
  private async loadOptions(): Promise<void> {
    try {
      const positions = await firstValueFrom(this.lotoApi.getPositions());
      const names = (list: { name: string }[] | undefined) =>
        (list ?? []).map(v => v.name).filter(Boolean).sort((a, b) => a.localeCompare(b));
      this.options.update(o => ({
        ...o,
        location: names(positions?.location),
        eqType: names(positions?.eqType),
      }));
    } catch {
      // No suggestions this session; typing still works.
    }
  }

  // ── Filter editing ──────────────────────────────────────────────────────────

  onInput(key: FinderFieldKey, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.pending.update(p => ({ ...p, [key]: value }));
    // A comma commits immediately; a SPACE deliberately does not. Space-to-commit would fight the
    // suggestion dropdown — "boiler bui" would chip "boiler" and drop the list mid-word — and the
    // split below catches spaces at commit time anyway.
    if (value.includes(',')) this.commit(key);
  }

  /**
   * Turn whatever is in the box into chips. Called on Enter, on a typed comma, and once more for every
   * box at the top of {@link search} — that last pass is what keeps a word the user typed but never
   * committed from being silently dropped from the query.
   */
  commit(key: FinderFieldKey): void {
    const raw = this.pending()[key];
    if (!raw || !raw.trim()) {
      if (raw) this.pending.update(p => ({ ...p, [key]: '' }));
      return;
    }
    // Split on whitespace AS WELL AS commas. This is the bucket-of-words promise: "455 cnd" has to
    // become two terms that each match a fragment of "1CND455", not one literal string that matches
    // nothing because no tag contains a space followed by "cnd".
    const existing = this.terms()[key];
    const added = raw.split(/[\s,]+/).map(t => t.trim()).filter(Boolean)
      .filter(t => !existing.some(e => e.toLowerCase() === t.toLowerCase()));
    if (added.length) this.terms.update(t => ({ ...t, [key]: [...existing, ...added] }));
    this.pending.update(p => ({ ...p, [key]: '' }));
  }

  /**
   * Add one term verbatim, without the word split — for a picked suggestion, where a multi-word Value
   * name ("Boiler Building") is a single thing the user chose, not two fragments to hunt separately.
   */
  private addTerm(key: FinderFieldKey, value: string): void {
    const existing = this.terms()[key];
    if (existing.some(e => e.toLowerCase() === value.toLowerCase())) return;
    this.terms.update(t => ({ ...t, [key]: [...existing, value] }));
  }

  // ── Suggestions (Location, Equipment type) ──────────────────────────────────

  /**
   * Known Value names matching what has been typed so far. Empty unless the box is focused AND has
   * text — the ask was a dropdown that appears as you type, not a list sitting open over the form.
   */
  suggestions(key: FinderFieldKey): string[] {
    if (this.focusedKey() !== key) return [];
    const typed = (this.pending()[key] || '').trim().toLowerCase();
    if (!typed) return [];
    const chosen = this.terms()[key].map(t => t.toLowerCase());
    return this.options()[key]
      .filter(o => o.toLowerCase().includes(typed) && !chosen.includes(o.toLowerCase()))
      .slice(0, 8);
  }

  /**
   * Take a suggestion. Bound to pointerdown, not click: a click would be preceded by blur, which
   * closes the list and cancels the tap. preventDefault keeps focus on the input so the user can
   * keep typing the next word.
   */
  pickSuggestion(key: FinderFieldKey, value: string, event: Event): void {
    event.preventDefault();
    this.addTerm(key, value);
    this.pending.update(p => ({ ...p, [key]: '' }));
  }

  onFocus(key: FinderFieldKey): void { this.focusedKey.set(key); }
  onBlur(key: FinderFieldKey): void { if (this.focusedKey() === key) this.focusedKey.set(null); }

  removeTerm(key: FinderFieldKey, term: string): void {
    this.terms.update(t => ({ ...t, [key]: t[key].filter(x => x !== term) }));
  }

  setMode(key: FinderFieldKey, mode: FilterMode): void {
    this.modes.update(m => ({ ...m, [key]: mode }));
  }

  clearAll(): void {
    this.terms.set(this.emptyTerms());
    this.pending.set(this.emptyPending());
    this.modes.set(this.defaultModes());
    this.result.set(null);
    this.error.set(null);
    this.clearNotice();
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  async search(): Promise<void> {
    for (const f of this.fields) this.commit(f.key); // fold in anything still sitting in a box
    this.error.set(null);
    this.clearNotice();

    const request = this.buildRequest();
    if (!request) {
      this.error.set('Add at least one word to search on.');
      this.result.set(null);
      return;
    }

    this.searching.set(true);
    try {
      const r = await this.api.search(request);
      this.result.set(r);
      if (!r) this.error.set('Could not reach the server. This search needs a connection.');
    } catch (e) {
      this.result.set(null);
      this.error.set(e instanceof QrForbiddenError
        ? 'This account does not have plant access, so equipment data is not available.'
        : 'Search failed. Please try again.');
    } finally {
      this.searching.set(false);
    }
  }

  /** Null when every box is empty — the server would refuse it anyway, and this says so sooner. */
  private buildRequest(): FinderRequest | null {
    const request: FinderRequest = {};
    let any = false;
    for (const f of this.fields) {
      const terms = this.terms()[f.key];
      if (!terms.length) continue;
      any = true;
      request[f.key] = { terms, mode: this.modes()[f.key] };
    }
    return any ? request : null;
  }

  // ── Opening a row ───────────────────────────────────────────────────────────

  /**
   * Fetch the tapped item's drawings and hand them to the viewer host. Resolved by type + id rather
   * than by tag: a row can be equipment whose tag also belongs to a LOTO point, and a tag lookup would
   * open the point instead of the thing that was tapped.
   */
  async open(item: FinderItem): Promise<void> {
    const key = item.type + item.id;
    this.clearNotice();
    this.openingKey.set(key);
    try {
      const match = await this.qrApi.resolveItem(item.type, item.id);
      if (!match) {
        this.rowNotice(key, 'Could not load this item. If you are offline, this needs a connection.');
        return;
      }
      if (!match.drawings?.length) {
        this.rowNotice(key, 'No drawing is linked to this item yet.');
        return;
      }
      this.selected.set(match);
    } catch (e) {
      this.rowNotice(key, e instanceof QrForbiddenError
        ? 'This account does not have plant access, so drawings are not available.'
        : 'Could not open this drawing.');
    } finally {
      this.openingKey.set(null);
    }
  }

  closeDrawing(): void { this.selected.set(null); }

  /** Attach a message to one row rather than to the list. */
  private rowNotice(key: string, message: string): void {
    this.notice.set(message);
    this.noticeKey.set(key);
  }

  private clearNotice(): void {
    this.notice.set(null);
    this.noticeKey.set(null);
  }

  metaLine(item: FinderItem): string {
    return [item.location, item.eqType, item.specificLocation].filter(Boolean).join(' · ') || '—';
  }

  // ── Initial state ───────────────────────────────────────────────────────────

  /** One entry per filter box, built from the field list so adding a sixth field needs no edits here. */
  private byField<T>(make: () => T): Record<FinderFieldKey, T> {
    const out = {} as Record<FinderFieldKey, T>;
    for (const f of FINDER_FIELDS) out[f.key] = make();
    return out;
  }

  private emptyTerms(): Record<FinderFieldKey, string[]> { return this.byField<string[]>(() => []); }
  private emptyPending(): Record<FinderFieldKey, string> { return this.byField<string>(() => ''); }
  /**
   * AND by default. Typing more words is how people narrow a search, and the case that drove this —
   * "455 cnd" to find 1CND455 — only works if both fragments must appear. "any" is one tap away when
   * the words are alternatives rather than clues about the same item.
   */
  private defaultModes(): Record<FinderFieldKey, FilterMode> { return this.byField<FilterMode>(() => 'AND'); }
}
