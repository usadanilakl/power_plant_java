import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DriftService, ThreeWayFieldDiff, ThreeWayFieldEntry } from '../../../services/drift.service';

/**
 * Focused, form-shaped LOCAL vs HUB side-by-side for a SINGLE entity — the drift-resolution surface the
 * per-row drift dot should open, instead of dumping the user into the whole-type Drift Center.
 *
 * <p>Reuses the proven data + actions: the fields come from {@link DriftService#fieldDiff} (which resolves
 * relationship ids to human labels via the backend SyncLabelService, so a LotoStandard reads
 * "01-VCND100, +3 more" not a bare id array), and each accept goes through
 * {@link DriftService#acceptField} — a single field write that never clobbers a concurrent edit to another
 * field of the same row. Whole-row "use hub / keep local" reuse the dependency-aware pull / push.
 *
 * <p>Route: {@code /sync/compare?type={entityType}&id={entityId}}.
 */
@Component({
  selector: 'app-side-by-side-compare',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="sbs">
      <header class="sbs-head">
        <div class="sbs-title">
          <a class="back" routerLink="/sync/drift" [queryParams]="{ type: entityType() }" title="Back to Drift Center">←</a>
          <div>
            <h2>Compare · Local vs Hub</h2>
            <div class="sub">{{ entityType() || '—' }} <span class="idpill">#{{ entityId() || '—' }}</span></div>
          </div>
        </div>
        <div class="sbs-actions">
          <button class="btn ghost" (click)="reload()" [disabled]="loading()">↻ Refresh</button>
        </div>
      </header>

      @if (loading()) {
        <div class="state">Loading comparison…</div>
      } @else if (!diff()) {
        <div class="state warn">Could not load the hub's version — the hub may be unreachable. Try Refresh.</div>
      } @else if (diffCount() === 0) {
        <div class="state ok">✓ Every field matches the hub. Nothing to resolve.</div>
      } @else {
        <div class="bar">
          <div class="count"><strong>{{ diffCount() }}</strong> field{{ diffCount() === 1 ? '' : 's' }} differ from the hub</div>
          <label class="toggle">
            <input type="checkbox" [checked]="diffsOnly()" (change)="diffsOnly.set($any($event.target).checked)" />
            Differences only
          </label>
          <div class="spacer"></div>
          <button class="btn hub" (click)="useAllHub()" [disabled]="anyBusy()">Use hub for all fields</button>
          <button class="btn local" (click)="keepAllLocal()" [disabled]="anyBusy()">Keep local for all fields</button>
        </div>

        @if (note()) { <div class="note">{{ note() }}</div> }

        <div class="grid">
          <div class="grow head">
            <div class="c-field">Field</div>
            <div class="c-val">Local (this desktop)</div>
            <div class="c-act"></div>
            <div class="c-val">Hub</div>
            @if (diff()?.spBacked) { <div class="c-sp">SharePoint</div> }
          </div>

          @for (f of rows(); track f.fieldName) {
            <div class="grow" [class.diff]="!f.localHubMatch">
              <div class="c-field">
                <span class="fname">{{ pretty(f.fieldName) }}</span>
                @if (f.refType) { <span class="reftag" [title]="'Relationship → ' + f.refType">↳ {{ f.refType }}</span> }
              </div>

              <div class="c-val" [class.on]="!f.localHubMatch">
                <div class="v">{{ drift.valueText(f, 'local') }}</div>
                @if (drift.valueRaw(f, 'local')) { <div class="raw">{{ drift.valueRaw(f, 'local') }}</div> }
              </div>

              <div class="c-act">
                @if (!f.localHubMatch) {
                  <button class="mini hub" (click)="useHub(f)" [disabled]="anyBusy()" title="Overwrite the local field with the hub's value">Use hub →</button>
                  <button class="mini local" (click)="useLocal(f)" [disabled]="anyBusy()" title="Push the local field's value up to the hub">← Keep local</button>
                } @else {
                  <span class="match" title="Local and hub agree">=</span>
                }
              </div>

              <div class="c-val" [class.on]="!f.localHubMatch">
                <div class="v">{{ drift.valueText(f, 'hub') }}</div>
                @if (drift.valueRaw(f, 'hub')) { <div class="raw">{{ drift.valueRaw(f, 'hub') }}</div> }
              </div>

              @if (diff()?.spBacked) {
                <div class="c-sp">{{ f.spMapped ? drift.valueText(f, 'sp') : '' }}</div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .sbs { padding:16px 18px; max-width:1200px; margin:0 auto; color:#222; }
    .sbs-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:14px; }
    .sbs-title { display:flex; gap:12px; align-items:flex-start; }
    .back { text-decoration:none; font-size:22px; line-height:1; color:#555; padding:2px 8px; border-radius:6px; }
    .back:hover { background:#eee; color:#111; }
    h2 { margin:0; font-size:18px; }
    .sub { color:#666; font-size:13px; margin-top:2px; }
    .idpill { background:#eef1f4; border-radius:10px; padding:0 8px; font-family:monospace; }
    .btn { border:1px solid #cfd6dd; background:#fff; border-radius:7px; padding:6px 12px; font-size:13px; cursor:pointer; }
    .btn:hover:not(:disabled) { background:#f4f7fa; }
    .btn:disabled { opacity:.5; cursor:default; }
    .btn.hub { border-color:#c47b1e; color:#a5610f; }
    .btn.local { border-color:#2874a6; color:#1f618d; }
    .btn.ghost { color:#555; }
    .state { padding:22px; text-align:center; border:1px dashed #d5dbe1; border-radius:10px; color:#555; }
    .state.ok { border-color:#8bc99a; background:#f2fbf4; color:#256b34; }
    .state.warn { border-color:#e2b07a; background:#fdf6ec; color:#8a5a12; }
    .bar { display:flex; align-items:center; gap:16px; margin-bottom:10px; flex-wrap:wrap; }
    .bar .count { font-size:14px; }
    .bar .count strong { color:#c0392b; }
    .toggle { font-size:13px; color:#444; display:flex; align-items:center; gap:6px; cursor:pointer; }
    .spacer { flex:1; }
    .note { background:#eef6ff; border:1px solid #bcdcff; color:#1c5a99; border-radius:7px; padding:7px 12px; font-size:13px; margin-bottom:10px; }
    .grid { border:1px solid #e2e7ec; border-radius:10px; overflow:hidden; }
    .grow { display:grid; grid-template-columns: 190px 1fr 180px 1fr; align-items:stretch; border-top:1px solid #eef1f4; }
    .grow.head { background:#f6f8fa; font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:#7a8794; border-top:none; }
    .grow.head .c-val, .grow.head .c-field, .grow.head .c-sp { padding:8px 12px; }
    .grow.diff { background:#fffdf6; }
    .c-field { padding:10px 12px; border-right:1px solid #eef1f4; }
    .fname { font-weight:600; font-size:13px; word-break:break-word; }
    .reftag { display:block; font-size:11px; color:#8a6d3b; margin-top:2px; }
    .c-val { padding:10px 12px; font-size:13px; border-right:1px solid #eef1f4; }
    .c-val.on { background:#fff8ec; }
    .c-val .v { word-break:break-word; white-space:pre-wrap; }
    .c-val .raw { font-family:monospace; font-size:11px; color:#8b97a3; margin-top:3px; word-break:break-all; }
    .c-act { display:flex; flex-direction:column; gap:5px; align-items:stretch; justify-content:center; padding:8px 10px; border-right:1px solid #eef1f4; }
    .mini { border:1px solid #cfd6dd; background:#fff; border-radius:6px; padding:4px 8px; font-size:12px; cursor:pointer; white-space:nowrap; }
    .mini:hover:not(:disabled) { background:#f4f7fa; }
    .mini:disabled { opacity:.5; cursor:default; }
    .mini.hub { border-color:#e0b877; color:#9a6212; }
    .mini.local { border-color:#8fbedd; color:#1f618d; }
    .match { text-align:center; color:#9aa7b2; font-weight:700; }
    .c-sp { padding:10px 12px; font-size:12px; color:#555; }
    /* When SP column present, widen the grid to 5 columns. */
    .grid:has(.c-sp) .grow { grid-template-columns: 175px 1fr 170px 1fr 150px; }
  `],
})
export class SideBySideCompareComponent {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  readonly drift = inject(DriftService);

  readonly entityType = signal('');
  readonly entityId = signal(0);
  readonly diff = signal<ThreeWayFieldDiff | null>(null);
  readonly loading = signal(false);
  readonly diffsOnly = signal(true);
  readonly busyField = signal<string | null>(null);
  readonly rowBusy = signal(false);
  readonly note = signal('');

  /** Fields to render — all, or just those that differ from the hub. */
  readonly rows = computed<ThreeWayFieldEntry[]>(() => {
    const d = this.diff();
    if (!d) return [];
    const fs = d.fields ?? [];
    return this.diffsOnly() ? fs.filter(f => !f.localHubMatch) : fs;
  });

  /** Count of fields that differ from the hub (independent of the diffs-only toggle). */
  readonly diffCount = computed(() => (this.diff()?.fields ?? []).filter(f => !f.localHubMatch).length);

  /** Any accept in flight — per-field OR whole-row. Gates BOTH sets of buttons so a per-field accept and a
   *  whole-row accept can't run concurrently against the same entity (their results would race). */
  readonly anyBusy = computed(() => this.rowBusy() || this.busyField() !== null);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(pm => {
      const type = pm.get('type') ?? '';
      const id = Number(pm.get('id')) || 0;
      const switched = type !== this.entityType() || id !== this.entityId();
      this.entityType.set(type);
      this.entityId.set(id);
      // Switching to a different entity must not carry over the previous row's note/busy flags (the component
      // instance is reused across queryParams-only navigations).
      if (switched) { this.note.set(''); this.busyField.set(null); this.rowBusy.set(false); }
      this.reload();
    });
  }

  /** True while the given (type,id) still matches the currently-shown entity — so a resolve callback that
   *  returns AFTER the user navigated to a different row doesn't overwrite the new row's state. */
  private stillCurrent(type: string, id: number): boolean {
    return this.entityType() === type && this.entityId() === id;
  }

  reload(): void {
    const t = this.entityType(); const id = this.entityId();
    if (!t || !id) { this.diff.set(null); return; }
    this.loading.set(true);
    this.drift.fieldDiff(t, id).subscribe(d => {
      if (!this.stillCurrent(t, id)) return; // a newer navigation superseded this request
      this.diff.set(d); this.loading.set(false);
    });
  }

  useHub(f: ThreeWayFieldEntry): void { this.acceptField(f, 'hub'); }
  useLocal(f: ThreeWayFieldEntry): void { this.acceptField(f, 'local'); }

  private acceptField(f: ThreeWayFieldEntry, source: 'hub' | 'local'): void {
    const t = this.entityType(); const id = this.entityId();
    if (!t || !id) return;
    this.busyField.set(f.fieldName);
    this.note.set('');
    this.drift.acceptField(t, id, f.fieldName, source).subscribe(res => {
      if (!this.stillCurrent(t, id)) return; // user navigated away — don't touch the new row's state
      this.busyField.set(null);
      const applied = res?.applied ?? res?.sent ?? 0;
      this.note.set(source === 'hub'
        ? (applied > 0 ? `Accepted the hub's value for "${this.pretty(f.fieldName)}".`
                       : `Hub value for "${this.pretty(f.fieldName)}" did not apply — still flagged.`)
        : (applied > 0 ? `Pushed the local value for "${this.pretty(f.fieldName)}" — reconciles once the hub applies it.`
                       : `Hub did not accept "${this.pretty(f.fieldName)}" — still flagged.`));
      this.reload();
    });
  }

  useAllHub(): void {
    const t = this.entityType(); const id = this.entityId();
    if (!t || !id) return;
    if (!confirm(`Overwrite EVERY differing field of this ${t} with the hub's version?`)) return;
    this.rowBusy.set(true); this.note.set('');
    this.drift.acceptHub(t, id).subscribe(() => {
      if (!this.stillCurrent(t, id)) return;
      this.rowBusy.set(false); this.note.set(`Pulled the hub's version of this ${t}.`); this.reload();
    });
  }

  keepAllLocal(): void {
    const t = this.entityType(); const id = this.entityId();
    if (!t || !id) return;
    if (!confirm(`Push this desktop's whole ${t} up to the hub, overwriting the hub's version?`)) return;
    this.rowBusy.set(true); this.note.set('');
    this.drift.keepLocal(t, id).subscribe(() => {
      if (!this.stillCurrent(t, id)) return;
      this.rowBusy.set(false); this.note.set(`Pushed the local ${t} to the hub.`); this.reload();
    });
  }

  /** camelCase field name → readable label ("isoPos" → "Iso Pos"). */
  pretty(field: string): string {
    return field
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/^./, c => c.toUpperCase());
  }
}
