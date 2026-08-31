import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { take } from 'rxjs/operators';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { EquipmentDataService } from '../../services/equipment-data.service';
import { LotoPermitApiService } from '../loto-permit/loto-permit-api.service';
import { GlobalMessageService } from '../../services/global-message.service';
import { QrScannerService } from '../../shared/qr-scanner/qr-scanner.service';
import { QrScannerComponent } from '../../shared/qr-scanner/qr-scanner.component';
import { LotoStandardApiService } from './loto-standard-api.service';
import { LotoPointRef, LotoValueRef, PositionOptions } from './loto-standard.model';

/**
 * Create OR edit a LOTO Point from the PWA.
 *
 * <p>Two entry paths:
 * <ul>
 *   <li><b>New</b> — /loto-points/new. Walker types a tag, we look it up on the hub. If matches exist,
 *       show them so the walker can pick one up instead of duplicating; otherwise proceed to the field form.</li>
 *   <li><b>Edit</b> — /loto-points/:id/edit. Skip the tag search step and land straight on the form pre-filled.</li>
 * </ul>
 *
 * <p>An optional {@code ?addToStandard=<id>} query param wires the saved point onto that standard
 * as part of the same request (server side). Used by the standard-detail "add point" flow.
 */
@Component({
  selector: 'app-loto-point-create',
  standalone: true,
  imports: [MainLayoutComponent, QrScannerComponent],
  template: `
    <app-main-layout [header]="editingId() ? 'Edit LOTO point' : 'New LOTO point'">
      <ng-container main-content>
        <div class="p-container">
          <button class="p-back" (click)="back()">← Back</button>

          @if (loading()) {
            <p class="p-msg">Loading…</p>
          } @else if (!phase() || phase() === 'tag') {
            <!-- Step 1: tag lookup -->
            <h1 class="p-title">Tag number</h1>
            <p class="p-hint">Type the tag on the physical device — the whole hub is checked as you type, so a point that already exists turns up before you make a second one.</p>
            @if (areaId() && areaLocationIds().length) {
              <p class="p-hint">Location will be set from the area you picked.</p>
            }
            <label class="p-field">Tag
              <input class="p-input" type="text" [value]="tag()" (input)="onTagInput($any($event.target).value)"
                     placeholder="e.g. 89G-1/Q9" autofocus>
            </label>
            <button class="p-btn-scan" [disabled]="checkingTag()" (click)="scanTag()">
              📷 Scan tag QR
            </button>
            @if (lookupError()) { <p class="p-msg p-error">{{ lookupError() }}</p> }
            @if (lookupMatches().length > 0) {
              <div class="p-matches">
                <h2 class="p-h2">Already on hub</h2>
                <p class="p-hint">Tap one to open it, or Continue to create a new point with this tag anyway.</p>
                @for (m of lookupMatches(); track m.id) {
                  <button class="p-match-row" (click)="openExisting(m.id)">
                    <span class="p-match-tag">{{ m.tagNumber }}</span>
                    <span class="p-match-desc">{{ m.description || '(no description)' }}</span>
                    <span class="p-match-loc">{{ m.location?.name || m.specificLocation || '—' }}</span>
                  </button>
                }
              </div>
            }
            <div class="p-actions">
              <button class="p-btn-primary" [disabled]="!tag().trim() || checkingTag()" (click)="checkTag()">
                {{ checkingTag() ? 'Checking…' : 'Check tag' }}
              </button>
              @if (lookupDone() && lookupMatches().length === 0) {
                <p class="p-ok">✓ Tag is free — continue to the form.</p>
              }
              @if (lookupDone()) {
                <button class="p-btn-primary" (click)="phase.set('form')">Continue → fill fields</button>
              }
            </div>
          } @else {
            <!-- Step 2: field form -->
            <h1 class="p-title">{{ editingId() ? 'Edit fields' : 'New point details' }}</h1>
            <p class="p-hint">Tag: <b>{{ form().tagNumber || '—' }}</b></p>

            <label class="p-field">Tag number
              <input class="p-input" type="text" [value]="form().tagNumber ?? ''"
                     (input)="patchForm({ tagNumber: $any($event.target).value })">
            </label>
            <label class="p-field">Description
              <input class="p-input" type="text" [value]="form().description ?? ''"
                     (input)="patchForm({ description: $any($event.target).value })">
            </label>
            <label class="p-field">Isolation position
              <select class="p-input" [value]="form().isoPos?.id ?? ''"
                      (change)="patchValueRef('isoPos', positions().isoPos, $any($event.target).value)">
                <option value="">—</option>
                @for (o of positions().isoPos; track o.id) {
                  <option [value]="o.id" [selected]="o.id === form().isoPos?.id">{{ o.name }}</option>
                }
              </select>
            </label>
            <label class="p-field">Restored position
              <select class="p-input" [value]="form().normPos?.id ?? ''"
                      (change)="patchValueRef('normPos', positions().normPos, $any($event.target).value)">
                <option value="">—</option>
                @for (o of positions().normPos; track o.id) {
                  <option [value]="o.id" [selected]="o.id === form().normPos?.id">{{ o.name }}</option>
                }
              </select>
            </label>
            <label class="p-field">Location
              <select class="p-input" [value]="form().location?.id ?? ''"
                      (change)="patchValueRef('location', positions().location, $any($event.target).value)">
                <option value="">—</option>
                <!-- The chosen area's Location Values float to the top; the full list stays reachable
                     below it, because an area boundary is not always where the point lives. -->
                @for (o of orderedLocations(); track o.id) {
                  <option [value]="o.id" [selected]="o.id === form().location?.id">{{ isAreaLocation(o.id) ? '★ ' : '' }}{{ o.name }}</option>
                }
              </select>
            </label>
            <label class="p-field">Specific location
              <input class="p-input" type="text" [value]="form().specificLocation ?? ''"
                     (input)="patchForm({ specificLocation: $any($event.target).value })"
                     placeholder="on-site landmark">
            </label>
            <label class="p-field">System
              <input class="p-input" type="text" [value]="form().system ?? ''"
                     (input)="patchForm({ system: $any($event.target).value })"
                     placeholder="e.g. Feedwater">
            </label>
            <label class="p-field">Zero energy method
              <input class="p-input" type="text" [value]="form().zeroEnergyMethod ?? ''"
                     (input)="patchForm({ zeroEnergyMethod: $any($event.target).value })">
            </label>

            <div class="p-flags">
              <div class="p-flag-row">
                <span class="p-flag-label">Metal tag present (labeled)</span>
                <span class="p-flag-btns">
                  <button class="p-yn pass" [class.active]="form().isLabeled === true"
                          (click)="patchForm({ isLabeled: form().isLabeled === true ? null : true })">Yes</button>
                  <button class="p-yn fail" [class.active]="form().isLabeled === false"
                          (click)="patchForm({ isLabeled: form().isLabeled === false ? null : false })">No</button>
                </span>
              </div>
              <div class="p-flag-row">
                <span class="p-flag-label">Equipment lockable</span>
                <span class="p-flag-btns">
                  <button class="p-yn pass" [class.active]="form().isLockable === true"
                          (click)="patchForm({ isLockable: form().isLockable === true ? null : true })">Yes</button>
                  <button class="p-yn fail" [class.active]="form().isLockable === false"
                          (click)="patchForm({ isLockable: form().isLockable === false ? null : false })">No</button>
                </span>
              </div>
            </div>

            @if (submitError()) { <p class="p-msg p-error">{{ submitError() }}</p> }

            <div class="p-actions p-sticky">
              @if (!editingId()) {
                <button class="p-btn-secondary" (click)="phase.set('tag')">← Back to tag</button>
              }
              <button class="p-btn-primary" [disabled]="submitting() || !isFormValid()" (click)="submit()">
                {{ submitting() ? 'Saving…' : (editingId() ? 'Save changes' : addToStandardId() ? 'Save + add to standard' : 'Save point') }}
              </button>
            </div>
          }
        </div>
        <!-- QR scanner overlay — service manages visibility; only rendered when isScannerVisible(). -->
        <app-qr-scanner />
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .p-container { padding: 1rem; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; padding-bottom: 5rem; }
    .p-back { background: none; border: none; color: var(--accent-color); font-size: 0.9rem; padding: 0.2rem 0; cursor: pointer; }
    .p-msg { text-align: center; color: var(--secondary-text); padding: 1rem; }
    .p-error { color: var(--danger-text); }
    .p-ok { color: var(--success-solid); font-weight: 600; font-size: 0.85rem; margin: 0.5rem 0; }
    .p-title { font-size: 1.3rem; font-weight: 700; color: var(--primary-text); margin: 0.5rem 0 0.3rem; }
    .p-hint { color: var(--secondary-text); font-size: 0.85rem; margin: 0 0 0.75rem; }
    .p-h2 { font-size: 1rem; font-weight: 700; color: var(--primary-text); margin: 1rem 0 0.5rem; }
    .p-field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.6rem; font-size: 0.78rem; color: var(--secondary-text); text-transform: uppercase; letter-spacing: 0.02em; }
    .p-input { padding: 0.55rem 0.7rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--secondary-background); color: var(--primary-text); font: inherit; font-size: 0.95rem; }
    .p-input:focus { outline: none; border-color: var(--accent-color); }
    .p-matches { border: 1px solid var(--warning-border); border-radius: 10px; padding: 0.6rem; background: var(--warning-bg); margin-top: 0.75rem; }
    .p-matches .p-h2 { color: var(--warning-text); margin-top: 0; }
    .p-match-row { display: grid; grid-template-columns: minmax(4rem, auto) 1fr minmax(4rem, 8rem); gap: 0.5rem; align-items: center; padding: 0.55rem 0.7rem; margin-top: 0.35rem; background: var(--card-bg, var(--secondary-background)); border: 1px solid var(--border-color); border-radius: 8px; text-align: left; cursor: pointer; font: inherit; min-height: 44px; width: 100%; color: var(--primary-text); }
    .p-match-tag { font-weight: 700; }
    .p-match-desc { color: var(--primary-text); font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .p-match-loc { color: var(--secondary-text); font-size: 0.78rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .p-actions { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
    .p-actions.p-sticky { position: sticky; bottom: 0; padding: 0.75rem 0 calc(0.75rem + env(safe-area-inset-bottom, 0px)); background: var(--primary-background); border-top: 1px solid var(--border-color); }
    .p-btn-primary { min-height: 52px; background: var(--success-solid); color: var(--on-solid); border: none; border-radius: 10px; padding: 0.9rem; font: inherit; font-size: 1rem; font-weight: 700; cursor: pointer; }
    .p-btn-primary:disabled { opacity: 0.5; cursor: default; }
    .p-btn-secondary { min-height: 44px; background: transparent; border: 1px solid var(--border-color); color: var(--primary-text); border-radius: 10px; padding: 0.6rem; font: inherit; cursor: pointer; }
    .p-btn-scan { min-height: 48px; margin: 0.5rem 0; background: var(--accent-color); color: var(--on-solid); border: none; border-radius: 10px; padding: 0.7rem; font: inherit; font-size: 0.95rem; font-weight: 700; cursor: pointer; }
    .p-btn-scan:disabled { opacity: 0.5; cursor: default; }
    .p-flags { border: 1px solid var(--border-color); border-radius: 10px; padding: 0.5rem 0.75rem; margin: 0.5rem 0; }
    .p-flag-row { display: flex; align-items: center; justify-content: space-between; padding: 0.4rem 0; }
    .p-flag-label { color: var(--primary-text); font-size: 0.9rem; }
    .p-flag-btns { display: flex; gap: 0.35rem; }
    .p-yn { min-height: 40px; min-width: 56px; border: 1px solid var(--border-color); background: transparent; color: var(--secondary-text); border-radius: 8px; padding: 0.25rem 0.6rem; font: inherit; font-weight: 700; cursor: pointer; }
    .p-yn.pass.active { background: var(--success-solid); border-color: var(--success-solid); color: var(--on-solid); }
    .p-yn.fail.active { background: var(--danger-solid); border-color: var(--danger-solid); color: var(--on-solid); }
  `],
})
export class LotoPointCreateComponent implements OnInit {
  private api = inject(LotoStandardApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(GlobalMessageService);
  private qr = inject(QrScannerService);
  private equipmentData = inject(EquipmentDataService);
  private permitApi = inject(LotoPermitApiService);

  editingId = signal<number | null>(null);
  addToStandardId = signal<number | null>(null);
  /** Permit counterpart of addToStandardId — the point is created, then attached to this permit. */
  addToLotoId = signal<number | null>(null);
  /**
   * Work area chosen before landing here (from the map attach flow). It does not constrain anything;
   * it just puts that area's Location Values at the top of the Location dropdown — and picks one
   * outright when the area maps to exactly one — so the walker is not hunting a long list in the field.
   */
  areaId = signal<number | null>(null);
  areaLocationIds = signal<number[]>([]);
  phase = signal<'tag' | 'form'>('tag');
  loading = signal(false);

  tag = signal('');
  checkingTag = signal(false);
  lookupDone = signal(false);
  lookupError = signal<string | null>(null);
  lookupMatches = signal<LotoPointRef[]>([]);

  positions = signal<PositionOptions>({ isoPos: [], normPos: [], location: [], eqType: [] });
  form = signal<Omit<Partial<LotoPointRef>, 'id'> & { id?: number | null }>({ id: null });
  submitting = signal(false);
  submitError = signal<string | null>(null);
  private tagDebounce: ReturnType<typeof setTimeout> | null = null;

  /** Location options with the pre-chosen area's Values first — order only, nothing is hidden. */
  orderedLocations = computed(() => {
    const all = this.positions().location;
    const ids = this.areaLocationIds();
    if (!ids.length) return all;
    return [...all].sort((a, b) => Number(ids.includes(b.id)) - Number(ids.includes(a.id)));
  });

  isFormValid = computed(() => !!(this.form().tagNumber ?? '').trim() && !!(this.form().description ?? '').trim());

  ngOnInit(): void {
    // /loto-points/:id/edit → land on the form pre-filled.
    const idParam = this.route.snapshot.paramMap.get('id');
    const editId = idParam ? Number(idParam) : null;
    if (editId) this.editingId.set(editId);

    const addId = this.route.snapshot.queryParamMap.get('addToStandard');
    this.addToStandardId.set(addId ? Number(addId) : null);
    const addLoto = this.route.snapshot.queryParamMap.get('addToLoto');
    this.addToLotoId.set(addLoto ? Number(addLoto) : null);
    const area = this.route.snapshot.queryParamMap.get('areaId');
    this.areaId.set(area ? Number(area) : null);
    if (this.areaId()) {
      const locs = this.equipmentData.getLocationsForWorkArea(this.areaId()!);
      this.areaLocationIds.set(locs.map(l => l.id));
    }

    this.loading.set(true);
    forkJoin({
      pos: this.api.getPositions().pipe(catchError(() => of(null))),
    }).subscribe(({ pos }) => {
      if (pos) this.positions.set(pos);
      this.loading.set(false);
      this.applyAreaLocation();
    });

    if (editId) {
      // Skip the tag lookup step and hydrate the form via the standards/{id} pathway? The
      // simplest source: look up by id via findByTag isn't right. We don't have a "get one
      // point" PWA endpoint yet — piggyback on the walkdown-pile with no filter would be
      // heavy. As a pragmatic shortcut, the caller passes the point object via history state.
      const state = (history.state ?? {}) as { point?: LotoPointRef };
      if (state.point) {
        this.form.set({ ...state.point } as any);
        this.tag.set(state.point.tagNumber ?? '');
        this.phase.set('form');
      } else {
        // Fallback: open the tag step with the id noted; the walker can re-enter details.
        this.phase.set('form');
      }
    }
  }

  /**
   * Open the QR scanner. On success, extract the tag (either raw text OR JSON like
   * {"tagNumber":"…"} — both are common encoding conventions in the field) and kick off the
   * existence check. Result: walker can point-scan-check without typing.
   */
  scanTag(): void {
    this.qr.openScanner().pipe(take(1)).subscribe(raw => {
      if (!raw) return;
      let extracted = raw.trim();
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && typeof parsed.tagNumber === 'string') {
          extracted = parsed.tagNumber.trim();
        }
      } catch { /* not JSON — use raw string as-is */ }
      if (!extracted) { this.messageService.showError('Scanned QR was empty.'); return; }
      this.tag.set(extracted);
      // Auto-run the lookup so the walker doesn't need a second tap after scanning.
      this.checkTag();
    });
  }

  /**
   * Type-ahead existence check. The point of asking for the tag first is to catch a duplicate before
   * one is created, and that only works if it happens without being asked for — a walker who has to
   * tap "Check tag" simply will not, and the plant ends up with two rows for one valve.
   *
   * <p>Debounced, and it searches the WHOLE hub, not the chosen area: a duplicate filed under the
   * wrong location is exactly the kind this needs to find. The result never blocks — it warns, and
   * offers the existing point as a thing to attach instead.</p>
   */
  onTagInput(value: string): void {
    this.tag.set(value);
    this.lookupDone.set(false);
    this.lookupMatches.set([]);
    if (this.tagDebounce) clearTimeout(this.tagDebounce);
    if (!value.trim()) return;
    this.tagDebounce = setTimeout(() => this.checkTag(), 450);
  }

  /** Which Location Values belong to the pre-chosen area — shown first in the dropdown. */
  isAreaLocation(id: number): boolean { return this.areaLocationIds().includes(id); }

  /**
   * Apply the pre-chosen area to the form's Location. Only auto-selects when the area maps to exactly
   * one Location Value; with several there is nothing to infer, so they are merely surfaced first.
   */
  private applyAreaLocation(): void {
    const ids = this.areaLocationIds();
    if (ids.length !== 1 || this.form().location) return;
    const match = this.positions().location.find(o => o.id === ids[0]);
    if (match) this.form.set({ ...this.form(), location: match });
  }

  checkTag(): void {
    const t = this.tag().trim();
    if (!t) return;
    this.checkingTag.set(true);
    this.lookupError.set(null);
    this.lookupDone.set(false);
    this.api.findPointsByTag(t).subscribe({
      next: (matches) => {
        this.checkingTag.set(false);
        this.lookupMatches.set(matches);
        this.lookupDone.set(true);
        this.form.set({ ...this.form(), tagNumber: t });
      },
      error: (err) => {
        this.checkingTag.set(false);
        this.lookupError.set(err?.error?.message ?? err?.message ?? 'Lookup failed');
      },
    });
  }

  openExisting(id: number): void {
    // If we came from add-to-standard, hand off: attach that point to the standard and go back.
    const addTo = this.addToStandardId();
    if (addTo) {
      this.api.addPointToStandard(addTo, id).subscribe({
        next: () => { this.messageService.showSuccess('Existing point added to standard.'); this.router.navigate(['/loto-standards', addTo]); },
        error: (err) => this.messageService.showError(err?.error?.message ?? err?.message ?? 'Failed to add point'),
      });
    } else {
      this.router.navigate(['/loto-standards']); // fallback: return to the standards list (no point-detail route on PWA yet)
    }
  }

  patchForm(patch: Partial<LotoPointRef>): void {
    this.form.set({ ...this.form(), ...patch });
  }
  patchValueRef(field: 'isoPos' | 'normPos' | 'location', pool: LotoValueRef[], v: string): void {
    const id = v ? Number(v) : null;
    const ref = id != null ? pool.find(o => o.id === id) ?? null : null;
    this.form.set({ ...this.form(), [field]: ref });
  }

  submit(): void {
    if (!this.isFormValid() || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    const body = { ...this.form(), id: this.editingId() ?? this.form().id ?? null };
    this.api.savePoint(body, this.addToStandardId()).subscribe({
      next: (saved) => {
        this.submitting.set(false);
        const isNew = !this.editingId();
        this.messageService.showSuccess(isNew ? 'LOTO point created.' : 'LOTO point saved.');
        // Go back to whichever context the walker came from.
        if (this.addToLotoId() && saved?.id) {
          // savePoint's addToStandardId param has no permit twin, so the attach is a second call.
          this.permitApi.addPoint(this.addToLotoId()!, saved.id).subscribe({
            next: () => this.router.navigate(['/loto', this.addToLotoId()]),
            error: (err) => this.submitError.set(
              'Point created, but adding it to the permit failed: ' + (err?.error?.message ?? err?.message ?? 'unknown')),
          });
        } else if (this.addToStandardId()) {
          this.router.navigate(['/loto-standards', this.addToStandardId()]);
        } else {
          history.length > 1 ? history.back() : this.router.navigate(['/loto-standards']);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err?.error?.message ?? err?.message ?? 'Save failed');
      },
    });
  }

  back(): void { history.length > 1 ? history.back() : this.router.navigate(['/loto-standards']); }
}
