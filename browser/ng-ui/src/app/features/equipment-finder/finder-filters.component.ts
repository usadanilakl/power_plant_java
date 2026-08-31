import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LotoStandardApiService } from '../loto-standard/loto-standard-api.service';
import { FINDER_FIELDS, FilterMode, FinderFieldKey, FinderRequest } from './equipment-finder.model';

/**
 * The five-field filter form: word buckets with per-box AND/OR, plus type-ahead Value suggestions on
 * Location and Equipment type.
 *
 * <p>Extracted from the Finder page so the LOTO add-points picker can offer the same search without a
 * second copy of the chip handling, the word-splitting rule and the suggestion race fix — three things
 * that took several rounds to get right and would drift apart the moment they existed twice.</p>
 *
 * <p>Owns the filter state and nothing else: it emits a built {@link FinderRequest} and lets the host
 * decide what a search means. The host also owns the result list, because the Finder opens a drawing
 * from a row while the picker selects rows in bulk.</p>
 */
@Component({
  selector: 'app-finder-filters',
  standalone: true,
  template: `
    <div class="ff">
      @for (f of fields; track f.key) {
        <div class="ff-filter">
          <div class="ff-head">
            <span class="ff-label">{{ f.label }}</span>
            @if (terms()[f.key].length > 1) {
              <span class="ff-modes">
                <button type="button" class="ff-mode" [class.active]="modes()[f.key] === 'OR'"
                        (click)="setMode(f.key, 'OR')">any</button>
                <button type="button" class="ff-mode" [class.active]="modes()[f.key] === 'AND'"
                        (click)="setMode(f.key, 'AND')">all</button>
              </span>
            }
          </div>

          @if (terms()[f.key].length) {
            <div class="ff-chips">
              @for (t of terms()[f.key]; track t) {
                <button type="button" class="ff-chip" (click)="removeTerm(f.key, t)"
                        [attr.aria-label]="'Remove ' + t">{{ t }} <span class="ff-chip-x">✕</span></button>
              }
            </div>
          }

          <!--
            No (blur) commit on purpose. Committing turns the typed word into a chip, which adds a row
            ABOVE the buttons — and blur fires before the click that caused it, so tapping Search with
            a half-typed word would move the button out from under the finger. runSearch() folds any
            uncommitted text in instead, so nothing is lost by waiting.
          -->
          <div class="ff-input-wrap">
            <input class="ff-input" type="search" autocomplete="off" autocapitalize="none"
                   [placeholder]="f.placeholder"
                   [value]="pending()[f.key]"
                   (input)="onInput(f.key, $event)"
                   (keydown.enter)="commit(f.key)"
                   (focus)="onFocus(f.key)"
                   (blur)="onBlur(f.key)">
            @if (f.suggest && suggestions(f.key).length) {
              <div class="ff-suggest">
                @for (o of suggestions(f.key); track o) {
                  <button type="button" class="ff-suggest-item"
                          (pointerdown)="pickSuggestion(f.key, o, $event)">{{ o }}</button>
                }
              </div>
            }
          </div>
        </div>
      }

      <div class="ff-actions">
        <button type="button" class="ff-btn" (click)="runSearch()" [disabled]="searching()">
          {{ searching() ? 'Searching…' : 'Search' }}
        </button>
        <button type="button" class="ff-btn ff-btn-plain" (click)="clearAll()">Clear</button>
      </div>

      @if (hint()) { <p class="ff-hint">{{ hint() }}</p> }
    </div>
  `,
  styles: [`
    .ff { display: flex; flex-direction: column; gap: 0.75rem; }
    .ff-filter { display: flex; flex-direction: column; gap: 0.35rem; }
    .ff-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .ff-label { font-size: 0.8rem; font-weight: 700; color: var(--secondary-text, #888); text-transform: uppercase; letter-spacing: 0.03em; }
    .ff-modes { display: flex; gap: 0.25rem; }
    .ff-mode { background: transparent; border: 1px solid var(--border-color); color: var(--secondary-text, #888); border-radius: 999px; padding: 0.1rem 0.6rem; font-size: 0.72rem; font-weight: 700; font-family: inherit; cursor: pointer; }
    .ff-mode.active { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }
    .ff-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .ff-chip { display: inline-flex; align-items: center; gap: 0.3rem; background: var(--accent-color); color: #fff; border: none; border-radius: 999px; padding: 0.25rem 0.7rem; font-size: 0.8rem; font-weight: 700; font-family: inherit; cursor: pointer; }
    .ff-chip-x { opacity: 0.75; font-size: 0.7rem; }
    /* Anchor for the dropdown; the list floats so it never pushes the form around while typing. */
    .ff-input-wrap { position: relative; }
    .ff-input { width: 100%; box-sizing: border-box; padding: 0.6rem 0.8rem; background: var(--card-bg, #2a2a2a); color: var(--primary-text); border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; font-size: 0.95rem; }
    .ff-suggest { position: absolute; top: calc(100% + 2px); left: 0; right: 0; z-index: 5; display: flex; flex-direction: column; background: var(--secondary-background, #1e1e1e); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; max-height: 15rem; overflow-y: auto; box-shadow: 0 6px 18px rgba(0,0,0,0.45); }
    .ff-suggest-item { text-align: left; background: transparent; border: none; border-bottom: 1px solid var(--border-color); color: var(--primary-text); padding: 0.55rem 0.8rem; font-family: inherit; font-size: 0.9rem; cursor: pointer; }
    .ff-suggest-item:last-child { border-bottom: none; }
    .ff-suggest-item:active { background: var(--accent-color); color: #fff; }
    .ff-actions { display: flex; gap: 0.5rem; margin-top: 0.25rem; }
    .ff-btn { flex: 1; background: var(--accent-color); color: #fff; border: none; border-radius: 8px; padding: 0.7rem 1rem; font-weight: 700; font-family: inherit; font-size: 0.95rem; cursor: pointer; }
    .ff-btn[disabled] { opacity: 0.6; }
    .ff-btn-plain { flex: 0 0 auto; background: transparent; border: 1px solid var(--border-color); color: var(--secondary-text, #888); }
    .ff-hint { margin: 0; text-align: center; font-size: 0.85rem; color: #e74c3c; }
  `],
})
export class FinderFiltersComponent implements OnInit {
  /** Host-driven, so the Search button reflects a request the host is actually running. */
  searching = input(false);
  /** Restrict results to LOTO points — set by hosts that can only act on a point. */
  lotoPointsOnly = input(false);

  /** A non-empty request. An empty form never reaches the host; it gets an inline hint instead. */
  searchRequested = output<FinderRequest>();
  /** The form was cleared — hosts drop their results so a stale list cannot outlive its filters. */
  cleared = output<void>();

  private lotoApi = inject(LotoStandardApiService);

  readonly fields = FINDER_FIELDS;

  options = signal<Record<FinderFieldKey, string[]>>(this.byField<string[]>(() => []));
  focusedKey = signal<FinderFieldKey | null>(null);
  terms = signal<Record<FinderFieldKey, string[]>>(this.emptyTerms());
  modes = signal<Record<FinderFieldKey, FilterMode>>(this.defaultModes());
  pending = signal<Record<FinderFieldKey, string>>(this.emptyPending());
  hint = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadOptions();
  }

  /**
   * Fill the Location / Equipment type dropdowns from the Value lists the LOTO walkdown already serves
   * ({@code /api/pwa/secured/loto-standards/positions}) — same audience, same Values, no new endpoint.
   * Failure is silent: both boxes are free text, so a missing list costs a shortcut, not the search.
   */
  private async loadOptions(): Promise<void> {
    try {
      const positions = await firstValueFrom(this.lotoApi.getPositions());
      const names = (list: { name: string }[] | undefined) =>
        (list ?? []).map(v => v.name).filter(Boolean).sort((a, b) => a.localeCompare(b));
      this.options.update(o => ({ ...o, location: names(positions?.location), eqType: names(positions?.eqType) }));
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
   * box at the top of {@link runSearch} — that last pass keeps a word the user typed but never
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
   * text — a dropdown that appears as you type, not a list sitting open over the form.
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
   * closes the list and cancels the tap. preventDefault keeps focus on the input so the user can keep
   * typing the next word.
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
    this.hint.set(null);
    this.cleared.emit();
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  runSearch(): void {
    for (const f of this.fields) this.commit(f.key); // fold in anything still sitting in a box
    this.hint.set(null);
    const request = this.buildRequest();
    if (!request) {
      this.hint.set('Add at least one word to search on.');
      return;
    }
    this.searchRequested.emit(request);
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
    if (!any) return null;
    if (this.lotoPointsOnly()) request.lotoPointsOnly = true;
    return request;
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
