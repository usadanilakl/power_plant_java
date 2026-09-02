import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { PwaContractor, ServerApiService } from '../../services/server-api.service';
import { MaximoApiService } from './maximo-api.service';
import { MaximoFormFieldDef, MaximoFormSubmission, MaximoFormTemplate, MaximoWorkOrder } from './maximo.model';

/** One rendered field, tagged with the section header that precedes it (first field of a section only). */
interface FormRow { header?: string; f: MaximoFormFieldDef; }
/** Orientation state derived from a contractor's validTo expiry. */
interface OrientationState { kind: 'expired' | 'soon' | 'ok' | 'unknown'; label: string; }

/**
 * Ammonia Offload — a new Maximo section (mobile). Each time an ammonia delivery truck offloads, the operator
 * works the plant's ammonia checklist here; on submit the completed checklist attaches (PDF + worklog line) to the
 * SINGLE standing "Ammonia Offloads" work order (resolved/created on the hub — see AmmoniaOffloadService), which
 * never closes.
 *
 * <p>Step 1 (driver safety orientation + manifest) is a real gate: before starting, the operator picks the Airgas
 * driver from the OnLocation contractor directory (or searches all contractors) and sees the orientation status
 * right away. The pick prefills the checklist's driver fields. Online-only, like the WO transfer/reschedule
 * actions — an offload happens on-site with connectivity.
 */
@Component({
  selector: 'app-maximo-ammonia-page',
  standalone: true,
  imports: [MainLayoutComponent],
  template: `
    <app-main-layout [header]="'Ammonia Offload'">
      <ng-container main-content>
        <div class="am">
          <div class="am-top">
            <button class="am-back" (click)="back()">← Maximo</button>
            @if (phase() === 'form') { <button class="am-back" (click)="phase.set('precheck')">← Driver check</button> }
          </div>

          @if (loading()) {
            <p class="am-msg">Loading…</p>
          } @else if (error()) {
            <p class="am-err">{{ error() }}</p>
            <button class="am-retry" (click)="reload()">Retry</button>
          } @else if (phase() === 'done') {
            <div class="am-done">
              <span class="am-done-i">✓</span>
              <p class="am-done-t">Ammonia offload logged</p>
              <p class="am-done-d">Checklist attached to work order <b>{{ submittedWonum() }}</b>.</p>
              <button class="am-primary" (click)="startNew()">+ New offload</button>
              <button class="am-secondary" (click)="back()">Back to Maximo</button>
            </div>
          } @else if (phase() === 'precheck') {
            <!-- Step 1: confirm the driver's safety orientation is current. -->
            <div class="am-wo">Attaches to standing WO <b>{{ wo()?.wonum || '…' }}</b></div>
            <h3 class="am-h">Step 1 — verify driver safety orientation</h3>
            <p class="am-sub">Pick the Airgas driver to confirm their orientation is current. Not listed? Search all contractors.</p>

            <input class="am-search" type="search" [value]="query()" (input)="setQuery($any($event.target).value)"
                   placeholder="Search Airgas drivers (or any contractor)…">

            @if (contractorsError()) { <p class="am-warn">⚠ Couldn't load the contractor directory — you can still start and enter the driver by hand.</p> }

            @if (selectedDriver(); as d) {
              <div class="am-picked" [class.bad]="orientation(d).kind === 'expired'">
                <div class="am-picked-top">
                  <span class="am-picked-name">{{ d.name }}</span>
                  <span class="am-badge" [class]="'b-' + orientation(d).kind">{{ orientation(d).label }}</span>
                </div>
                @if (d.company) { <div class="am-picked-org">{{ d.company }}</div> }
                <div class="am-picked-dates">Orientation: <b>{{ d.validFrom || '—' }}</b> to <b>{{ d.validTo || '—' }}</b></div>
                @if (orientation(d).kind === 'expired') {
                  <p class="am-picked-warn">Orientation is EXPIRED — the driver is not cleared. Do not offload until it is renewed.</p>
                }
                <button class="am-clear" (click)="selectDriver(null)">Change driver</button>
              </div>
            }

            <div class="am-list">
              @for (c of contractorResults(); track c.onLocationMemberId ?? c.name) {
                <button class="am-cd" [class.sel]="selectedDriver() === c" (click)="selectDriver(c)">
                  <div class="am-cd-top">
                    <span class="am-cd-name">{{ c.name }}</span>
                    <span class="am-badge" [class]="'b-' + orientation(c).kind">{{ orientation(c).label }}</span>
                  </div>
                  <div class="am-cd-org">{{ c.company || '—' }}@if (c.title) { · {{ c.title }} }</div>
                </button>
              }
              @if (!contractorResults().length) {
                <p class="am-msg">{{ query() ? 'No contractor matches that search.' : 'No Airgas contractors found — search by name, or start and enter the driver by hand.' }}</p>
              }
            </div>

            <button class="am-primary am-start" (click)="startForm()">
              {{ selectedDriver() ? 'Start offload with this driver' : 'Start offload (enter driver on the form)' }}
            </button>
          } @else {
            <!-- The checklist -->
            <div class="am-wo">Attaches to WO <b>{{ wo()?.wonum }}</b></div>
            @for (row of formRows(); track row.f.name) {
              @if (row.header) { <h4 class="am-sec">{{ row.header }}</h4> }
              @switch (row.f.type) {
                @case ('checkbox') {
                  <label class="am-check"><input type="checkbox" [checked]="!!formValues()[row.f.name]"
                    (change)="setVal(row.f.name, $any($event.target).checked)"> <span>{{ row.f.label }}{{ req(row.f) }}</span></label>
                }
                @case ('radio-group') {
                  <div class="am-field"><span>{{ row.f.label }}{{ req(row.f) }}</span>
                    <div class="am-opts">
                      @for (o of row.f.options || []; track o) {
                        <label class="am-opt"><input type="radio" [name]="row.f.name" [checked]="val(row.f.name) === o"
                          (change)="setVal(row.f.name, o)"> {{ o }}</label>
                      }
                    </div>
                  </div>
                }
                @case ('textarea') {
                  <label class="am-field">{{ row.f.label }}{{ req(row.f) }}
                    <textarea rows="2" [value]="val(row.f.name)" (input)="setVal(row.f.name, $any($event.target).value)"></textarea>
                  </label>
                }
                @case ('number') {
                  <label class="am-field">{{ row.f.label }}{{ row.f.unit ? ' (' + row.f.unit + ')' : '' }}{{ req(row.f) }}
                    <input type="number" inputmode="decimal" [value]="val(row.f.name)" (input)="setVal(row.f.name, $any($event.target).value)">
                  </label>
                }
                @case ('date') {
                  <label class="am-field">{{ row.f.label }}{{ req(row.f) }}
                    <input type="date" [value]="val(row.f.name)" (input)="setVal(row.f.name, $any($event.target).value)">
                  </label>
                }
                @default {
                  <label class="am-field">{{ row.f.label }}{{ req(row.f) }}
                    <input type="text" [value]="val(row.f.name)" (input)="setVal(row.f.name, $any($event.target).value)">
                  </label>
                }
              }
            }
            @if (bannerError()) { <p class="am-err">{{ bannerError() }}</p> }
            <button class="am-primary" [disabled]="submitting()" (click)="submit()">
              {{ submitting() ? 'Submitting…' : 'Submit & attach to work order' }}
            </button>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .am { padding: 0.85rem; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; }
    .am-top { display: flex; gap: 0.5rem; margin-bottom: 0.7rem; }
    .am-back { background: transparent; color: var(--accent-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.4rem 0.7rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .am-msg { text-align: center; color: var(--secondary-text, #888); padding: 1.5rem 1rem; }
    .am-err { color: #e74c3c; font-size: 0.9rem; margin: 0.4rem 0; }
    .am-warn { background: rgba(230,126,34,0.12); border: 1px solid #e67e22; border-radius: 9px; padding: 0.5rem 0.7rem; color: var(--primary-text); font-size: 0.82rem; margin: 0.4rem 0; }
    .am-retry { background: var(--accent-color); color: #fff; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .am-wo { font-size: 0.8rem; color: var(--secondary-text, #888); margin-bottom: 0.6rem; }
    .am-h { font-size: 1.05rem; font-weight: 800; color: var(--primary-text); margin: 0.2rem 0 0.2rem; }
    .am-sub { font-size: 0.85rem; color: var(--secondary-text, #888); margin: 0 0 0.7rem; line-height: 1.35; }
    .am-search { width: 100%; box-sizing: border-box; padding: 0.6rem 0.8rem; margin-bottom: 0.6rem; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; }
    .am-picked { border: 1px solid var(--accent-color); border-radius: 12px; padding: 0.7rem 0.85rem; margin-bottom: 0.8rem; background: var(--card-bg, var(--secondary-background)); }
    .am-picked.bad { border-color: #e74c3c; }
    .am-picked-top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .am-picked-name { font-weight: 800; color: var(--primary-text); }
    .am-picked-org { font-size: 0.85rem; color: var(--secondary-text, #888); margin-top: 0.15rem; }
    .am-picked-dates { font-size: 0.82rem; color: var(--secondary-text, #888); margin-top: 0.35rem; }
    .am-picked-warn { color: #e74c3c; font-weight: 700; font-size: 0.85rem; margin: 0.5rem 0 0; line-height: 1.35; }
    .am-clear { margin-top: 0.55rem; background: transparent; color: var(--accent-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.4rem 0.7rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .am-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.9rem; }
    .am-cd { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.65rem 0.8rem; border: 1px solid var(--border-color); border-radius: 11px; background: var(--card-bg, var(--secondary-background)); cursor: pointer; text-align: left; font-family: inherit; }
    .am-cd.sel { border-color: var(--accent-color); }
    .am-cd-top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .am-cd-name { font-weight: 700; color: var(--primary-text); }
    .am-cd-org { font-size: 0.8rem; color: var(--secondary-text, #888); }
    .am-badge { flex: none; font-size: 0.66rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; border-radius: 999px; padding: 0.15rem 0.5rem; white-space: nowrap; }
    .b-expired { background: #f8d7da; color: #a61b2b; }
    .b-soon { background: #ffe6b3; color: #b26a00; }
    .b-ok { background: #d7f2dd; color: #1c7a3a; }
    .b-unknown { background: rgba(127,127,127,0.2); color: var(--secondary-text, #888); }
    .am-primary { width: 100%; background: #27ae60; color: #fff; border: none; border-radius: 10px; padding: 0.8rem; font-size: 1rem; font-weight: 800; cursor: pointer; font-family: inherit; }
    .am-primary:disabled { opacity: 0.6; cursor: default; }
    .am-start { margin-top: 0.3rem; }
    .am-secondary { width: 100%; background: transparent; color: var(--accent-color); border: 1px solid var(--accent-color); border-radius: 10px; padding: 0.7rem; font-size: 0.92rem; font-weight: 700; cursor: pointer; font-family: inherit; margin-top: 0.5rem; }
    .am-sec { font-size: 0.9rem; font-weight: 700; color: var(--primary-text); margin: 1.1rem 0 0.5rem; padding-bottom: 0.2rem; border-bottom: 1px solid var(--border-color); }
    .am-field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.8rem; font-weight: 700; color: var(--secondary-text, #888); margin-bottom: 0.8rem; }
    .am-field input, .am-field textarea { padding: 0.55rem 0.7rem; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; font-weight: 400; box-sizing: border-box; }
    .am-check { display: flex; align-items: flex-start; gap: 0.6rem; color: var(--primary-text); font-size: 0.92rem; margin-bottom: 0.75rem; line-height: 1.35; }
    .am-check input { width: 1.2rem; height: 1.2rem; margin-top: 0.1rem; flex: none; }
    .am-opts { display: flex; flex-wrap: wrap; gap: 0.3rem 1rem; margin-top: 0.3rem; }
    .am-opt { display: flex; align-items: center; gap: 0.5rem; color: var(--primary-text); font-size: 0.95rem; font-weight: 400; }
    .am-done { text-align: center; padding: 2rem 1rem; }
    .am-done-i { display: block; width: 3rem; height: 3rem; line-height: 3rem; margin: 0 auto 0.7rem; border-radius: 50%; background: #27ae60; color: #fff; font-size: 1.7rem; }
    .am-done-t { font-size: 1.1rem; font-weight: 800; color: var(--primary-text); margin: 0 0 0.3rem; }
    .am-done-d { color: var(--secondary-text, #888); font-size: 0.9rem; margin: 0 0 1.2rem; }
  `]
})
export class MaximoAmmoniaPageComponent implements OnInit {
  private api = inject(MaximoApiService);
  private serverApi = inject(ServerApiService);
  private router = inject(Router);

  private static readonly FORM_KEY = 'AMMONIA_OFFLOAD';

  phase = signal<'precheck' | 'form' | 'done'>('precheck');
  loading = signal(true);
  error = signal<string | null>(null);
  submitting = signal(false);
  bannerError = signal<string | null>(null);
  submittedWonum = signal('');

  wo = signal<MaximoWorkOrder | null>(null);
  template = signal<MaximoFormTemplate | null>(null);
  formValues = signal<Record<string, any>>({});

  // Contractors (driver orientation check)
  private allContractors = signal<PwaContractor[]>([]);
  contractorsError = signal(false);
  query = signal('');
  selectedDriver = signal<PwaContractor | null>(null);

  /** Blank query → Airgas only (the delivery vendor); a query searches ALL contractors by name/company/email/title. */
  contractorResults = computed<PwaContractor[]>(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.allContractors();
    if (!q) return all.filter(c => (c.company || '').toLowerCase().includes('airgas'));
    return all.filter(c => [c.name, c.company, c.email, c.title].some(v => v?.toLowerCase().includes(q)));
  });

  private fields = computed<MaximoFormFieldDef[]>(() => {
    const json = this.template()?.fieldsJson;
    if (!json) return [];
    try { const a = JSON.parse(json); return Array.isArray(a) ? a : []; } catch { return []; }
  });

  /** Fields tagged with the section header that precedes them (header on the first field of each section). */
  formRows = computed<FormRow[]>(() => {
    let section: string | undefined;
    return this.fields().map(f => {
      const header = f.section && f.section !== section ? f.section : undefined;
      section = f.section;
      return { header, f };
    });
  });

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      wo: this.api.getAmmoniaWorkOrder().pipe(catchError(() => of(null))),
      template: this.api.getFormTemplate(MaximoAmmoniaPageComponent.FORM_KEY).pipe(catchError(() => of(null))),
      contractors: this.serverApi.getContractors().pipe(catchError(() => of(null))),
    }).subscribe(res => {
      this.loading.set(false);
      this.wo.set(res.wo);
      this.template.set(res.template);
      if (res.contractors) { this.allContractors.set(res.contractors.contractors ?? []); this.contractorsError.set(false); }
      else this.contractorsError.set(true);
      if (!res.wo) this.error.set('Could not reach the Ammonia Offloads work order in Maximo. Check your connection and retry.');
      else if (!res.template) this.error.set('The Ammonia Offload form template is not seeded yet. On the desktop Form Builder, tap "Seed procedure forms", then retry.');
    });
  }

  // ── Driver pre-check ────────────────────────────────────────────────────────
  setQuery(v: string): void { this.query.set(v); }
  selectDriver(c: PwaContractor | null): void { this.selectedDriver.set(c); }

  /** Expired / expiring / current, from validTo (mirrors the contractor directory badge). */
  orientation(c: PwaContractor): OrientationState {
    if (!c?.validTo) return { kind: 'unknown', label: 'No date' };
    const expiry = new Date(c.validTo).getTime();
    if (Number.isNaN(expiry)) return { kind: 'unknown', label: 'No date' };
    const days = Math.floor((expiry - Date.now()) / 86_400_000);
    if (days < 0) return { kind: 'expired', label: 'Expired' };
    if (days <= 30) return { kind: 'soon', label: `${days}d left` };
    return { kind: 'ok', label: 'Current' };
  }

  /** Move to the checklist, seeding today's date + the picked driver's details. */
  startForm(): void {
    const seed: Record<string, any> = { offload_date: this.today() };
    const d = this.selectedDriver();
    if (d) {
      seed['driver_name'] = d.name;
      if (d.company) seed['driver_company'] = d.company;
      seed['driver_orientation_current'] = this.orientation(d).kind === 'expired' ? 'No' : 'Yes';
    }
    this.formValues.set(seed);
    this.bannerError.set(null);
    this.phase.set('form');
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  req(f: MaximoFormFieldDef): string { return f.required ? ' *' : ''; }
  val(name: string): any { const v = this.formValues()[name]; return v == null ? '' : v; }
  setVal(name: string, value: any): void { this.formValues.set({ ...this.formValues(), [name]: value }); }

  submit(): void {
    if (this.submitting()) return;
    const w = this.wo();
    const t = this.template();
    if (!w || !t) { this.bannerError.set('Missing work order or form template — go back and retry.'); return; }
    for (const { f } of this.formRows()) {
      if (!f.required) continue;
      const v = this.formValues()[f.name];
      // A required checkbox (a step attestation) must be CHECKED — an unchecked/false value is not "done".
      const empty = v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0);
      if (empty) {
        this.bannerError.set(f.type === 'checkbox' ? `Check "${f.label}" to continue.` : `"${f.label}" is required.`);
        return;
      }
    }
    this.bannerError.set(null);
    this.submitting.set(true);
    const dto: MaximoFormSubmission = {
      templateFormKey: MaximoAmmoniaPageComponent.FORM_KEY,
      templateName: t.formName,
      wonum: w.wonum,
      woHref: w.href,
      siteid: w.siteid,
      // Unique per offload: the standing WO collects MANY completions of this one form, so a distinct key stops
      // them collapsing onto a single submission (which would no-op every offload after the first).
      submissionKey: `${MaximoAmmoniaPageComponent.FORM_KEY}|${w.wonum}|${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      valuesJson: JSON.stringify(this.formValues()),
      completeWo: false,   // the standing WO must never close
    };
    this.api.completeForm(dto).subscribe({
      next: () => { this.submitting.set(false); this.submittedWonum.set(w.wonum); this.phase.set('done'); },
      error: e => { this.submitting.set(false); this.bannerError.set(e?.error?.message || e?.message || 'Could not submit — check your connection and try again.'); }
    });
  }

  startNew(): void {
    this.formValues.set({});
    this.selectedDriver.set(null);
    this.query.set('');
    this.bannerError.set(null);
    this.phase.set('precheck');
  }

  back(): void { this.router.navigate(['/maximo']); }

  private today(): string { return new Date().toISOString().slice(0, 10); }
}
