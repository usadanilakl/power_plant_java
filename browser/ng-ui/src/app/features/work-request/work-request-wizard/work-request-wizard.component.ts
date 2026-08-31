import { Component, DestroyRef, OnInit, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ReactiveFormComponent } from '../../../shared/forms/reactive-form/reactive-form.component';
import { WorkAreaMapSelectComponent } from '../../../shared/forms/work-area-map-select/work-area-map-select.component';
import { WorkRequest } from '../../../models/permits/work-request.model';
import { FormField } from '../../../models/inputs/form-field.model';
import { WorkRequestStateService } from '../work-request-state.service';
import { UserSetupService } from '../../../services/user-setup.service';
import { WorkAreaSeedService } from '../work-area-seed.service';
import { foldHotWorkProfile, foldWorkRequestVirtualFields } from '../work-request-virtual-fields';

/**
 * One step of the guided submission.
 *
 * <p>`fields` are names from {@link WorkRequest.toFormFields}, not new controls: every step renders
 * the SAME shared reactive form with a filtered field list. That is what keeps the wizard and the
 * full form from drifting — a validator, a `showWhen` chain or a new field is authored once on the
 * model and both surfaces get it.
 */
interface WizardStep {
  key: string;
  title: string;
  /** Plain-language framing shown above the fields. The wizard exists to be read by non-experts. */
  help: string;
  fields: string[];
  /** Null when the step may be left, otherwise the reason it may not. */
  validate: (wr: WorkRequest) => string | null;
}

const MIN_LOCATION_TEXT = 3;

/**
 * Step-by-step work request submission.
 *
 * <p>The full form asks a contractor twenty-odd questions at once, most of which only matter
 * because of an answer further up. This walks the same questions in the order they actually depend
 * on each other, and uses the earlier answers to fill in the later ones — picking an area on the
 * map seeds that area's standing hazards, its LOTO standards and its confined-space status; picking
 * a work type seeds that type's standard hazards.
 *
 * <h2>Seeding is additive and never argues with the requester</h2>
 *
 * Seeded hazards are only ever turned ON. If the requester turns one off in the hazards step, that
 * choice is remembered and re-seeding will not turn it back on — otherwise changing the area at the
 * end would silently undo their review, which is the classic way a wizard destroys the answer it
 * just asked for.
 *
 * <p>Anyone who would rather not be walked through it uses "Resubmit Existing Request", which opens
 * the full form directly.
 */
@Component({
  selector: 'app-work-request-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormComponent, WorkAreaMapSelectComponent],
  template: `
    <div class="wizard">
      <ol class="steps">
        <li *ngFor="let step of steps; let i = index"
            class="step"
            [class.done]="i < index()"
            [class.current]="i === index()"
            (click)="jumpTo(i)">
          <span class="step-num">{{ i + 1 }}</span>
          <span class="step-title">{{ step.title }}</span>
        </li>
      </ol>

      <div class="step-body" *ngIf="current() as step">
        <h3 class="step-heading">{{ step.title }}</h3>
        <p class="step-help">{{ step.help }}</p>

        <p class="step-block" *ngIf="blockReason()">{{ blockReason() }}</p>

        <!-- The map IS the first question, so it is the first thing on screen — not a control
             buried in a form under a label. The escape hatch and the plant-wide scopes are drawn
             on the map itself, so both ways of answering are visible at the moment of deciding. -->
        <ng-container *ngIf="step.key === 'location' && phase() === 'map'">
          <app-work-area-map-select
            [multiple]="true"
            [ngModel]="pickedAreas()"
            (ngModelChange)="onAreasPicked($event)"
            [scopeOptions]="scopeOptions"
            (scopeSelected)="onScopePicked($event)"
            [showSkip]="true"
            (skipRequested)="skipMap()"
          ></app-work-area-map-select>
        </ng-container>

        <div class="picked" *ngIf="step.key === 'location' && phase() === 'detail'">
          <ng-container *ngIf="pickedAreaName(); else noArea">
            <strong>{{ pickedAreaName() }}</strong>{{ areas().length > 1 ? ' and ' + (areas().length - 1) + ' more' : '' }}
            — add anything that helps us find you (optional).
          </ng-container>
          <ng-template #noArea>
            No area selected. Describe where the work is, in your own words — an operator will place
            it for you.
          </ng-template>
          <button class="nav-btn" (click)="phase.set('map')">Change</button>
        </div>

        <!-- What happens in each area. Two questions per area and nothing else: they are what
             decide how many Confined Space and Hot Work permits get issued. The hot-work detail is
             asked once, in the Work step. -->
        <div class="area-plan" *ngIf="step.key === 'location' && phase() === 'detail' && areas().length">
          <p class="area-plan-help" *ngIf="areas().length > 1">
            One Confined Space permit is issued per space, and one Hot Work permit per area where
            hot work happens — so tell us which areas need what.
          </p>
          <div class="area-row" *ngFor="let area of areas(); let i = index">
            <div class="area-name">
              <span class="primary-tag" *ngIf="i === 0">main</span>
              {{ area.name }}
            </div>
            <label class="area-toggle">
              <input type="checkbox" [checked]="area.confinedSpaceEntry"
                     (change)="setAreaFlag(i, 'confinedSpaceEntry', $any($event.target).checked)" />
              Confined space entry
            </label>
            <input class="area-space" *ngIf="area.confinedSpaceEntry"
                   [value]="area.spaceName ?? ''" placeholder="Space / vessel name"
                   (input)="setAreaSpace(i, $any($event.target).value)" />
            <label class="area-toggle">
              <input type="checkbox" [checked]="area.hotWork"
                     (change)="setAreaFlag(i, 'hotWork', $any($event.target).checked)" />
              Hot work here
            </label>
          </div>
        </div>

        <app-reactive-form
          *ngIf="!(step.key === 'location' && phase() === 'map')"
          [entity]="draft()"
          [fields]="stepFields()"
          [title]="''"
          [showAddEditOption]="false"
          [submitButtonText]="isLast() ? 'Review and submit' : 'Next'"
          (formValueChange)="onValueChange($event)"
          (formSubmit)="onNext($event)"
        ></app-reactive-form>

        <div class="nav">
          <button class="nav-btn" *ngIf="index() > 0 || phase() === 'detail'" (click)="back()">
            ← Back
          </button>
          <span class="nav-spacer"></span>
          <button class="nav-btn ghost" (click)="skipToForm.emit()">
            Skip the guide — open the full form
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .wizard { padding: 8px 0 24px; }

    .steps {
      display: flex; flex-wrap: wrap; gap: 4px;
      list-style: none; margin: 0 0 16px; padding: 0;
    }

    .step {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 14px;
      background: var(--secondary-background, #f0f2f5);
      color: var(--secondary-text, #666);
      font-size: 12px; cursor: pointer;
    }

    /* Only completed steps are clickable; a step ahead of the current one has not been validated
       yet, so jumping into it would show a half-empty form with no explanation. */
    .step.done { color: var(--primary-text, #222); }
    .step.current {
      background: var(--accent-color, #007bff); color: #fff; font-weight: 600;
    }

    .step-num {
      width: 18px; height: 18px; border-radius: 50%;
      background: rgba(0,0,0,0.12);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700;
    }
    .step.current .step-num { background: rgba(255,255,255,0.3); }

    .step-heading { margin: 0 0 4px; font-size: 18px; }
    .step-help {
      margin: 0 0 14px; font-size: 14px; line-height: 1.5;
      color: var(--secondary-text, #555);
    }

    .picked {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      margin: 0 0 12px; padding: 8px 12px; border-radius: 6px;
      background: var(--secondary-background, #f0f2f5);
      font-size: 13px; line-height: 1.5;
    }
    .picked .nav-btn { margin-left: auto; font-size: 13px; }

    .area-plan { margin: 0 0 14px; }
    .area-plan-help { margin: 0 0 8px; font-size: 13px; color: var(--secondary-text, #666); }

    .area-row {
      display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
      padding: 8px 10px; margin-bottom: 6px;
      border: 1px solid var(--border-color, #ddd); border-radius: 6px;
      font-size: 13px;
    }

    .area-name { font-weight: 600; min-width: 140px; display: flex; align-items: center; gap: 6px; }

    .primary-tag {
      font-size: 10px; text-transform: uppercase; letter-spacing: .5px;
      background: var(--accent-color, #007bff); color: #fff;
      border-radius: 8px; padding: 1px 6px;
    }

    .area-toggle { display: flex; align-items: center; gap: 5px; cursor: pointer; }

    .area-space {
      flex: 1; min-width: 160px; padding: 4px 8px;
      border: 1px solid var(--border-color, #ddd); border-radius: 4px;
      background: var(--primary-background, #fff); color: var(--primary-text, #222);
      font-size: 13px;
    }

    .step-block {
      margin: 0 0 12px; padding: 8px 12px; border-radius: 6px;
      background: #fdecea; color: #b71c1c; font-size: 13px;
    }

    .nav { display: flex; align-items: center; margin-top: 16px; }
    .nav-spacer { flex: 1; }

    .nav-btn {
      background: none; border: none; cursor: pointer;
      color: var(--accent-color, #007bff); font-size: 14px; padding: 6px 4px;
    }
    .nav-btn.ghost { color: var(--secondary-text, #777); font-size: 13px; }
    .nav-btn:hover { text-decoration: underline; }

    @media (max-width: 600px) {
      .step-title { display: none; }
      .step.current .step-title { display: inline; }
    }
  `],
})
export class WorkRequestWizardComponent implements OnInit {
  /** The requester asked for the full form instead. */
  skipToForm = output<void>();
  /** Every step passed; hand over to the full form for a final read-through and submit. */
  reviewReady = output<WorkRequest>();

  private state = inject(WorkRequestStateService);
  private userSetup = inject(UserSetupService);
  private seeds = inject(WorkAreaSeedService);
  private destroyRef = inject(DestroyRef);

  draft = signal<WorkRequest>(new WorkRequest());
  index = signal(0);
  blockReason = signal('');

  /**
   * Within the location step: 'map' shows the plant map on its own, 'detail' the free-text follow
   * up. Two phases rather than two steps — it is one question ("where?"), and growing the step
   * indicator to six for it would misrepresent how long the form is.
   */
  phase = signal<'map' | 'detail'>('map');

  /** Jobs that genuinely do not sit in one drawn area. */
  readonly scopeOptions = ['Site Wide', 'Unit 1', 'Unit 2'];

  /** Areas already picked, in pick order — what the map's multi-select is bound to. */
  pickedAreas = computed(() => (this.draft().workAreas ?? []).map(a => ({
    id: a.id as number, name: a.name, isConfinedSpace: a.confinedSpaceEntry,
  })));

  areas = computed(() => this.draft().workAreas ?? []);

  /**
   * Hazard keys the requester has explicitly turned OFF. Seeding skips these forever after, so
   * going back to change the area cannot quietly undo a decision made in the hazards step.
   */
  private declined = new Set<string>();

  readonly steps: WizardStep[] = [
    {
      key: 'location',
      title: 'Location',
      help: 'Where will the work be done?',
      fields: ['locationDetail', 'locationDescription'],
      validate: wr => {
        if (wr.workAreaId) return null;
        const text = `${(wr as any).locationDescription ?? ''} ${(wr as any).locationDetail ?? ''}`.trim();
        return text.length >= MIN_LOCATION_TEXT
          ? null
          : 'Pick an area on the map, or describe where the work is in at least '
            + `${MIN_LOCATION_TEXT} characters.`;
      },
    },
    {
      key: 'equipment',
      title: 'Equipment',
      help: 'Which equipment does this affect? Search for it by tag number or description. If you '
          + 'cannot find it, just describe it as best you can — a tag number is helpful but not '
          + 'required.',
      fields: ['affectedEquipment'],
      validate: wr => (String(wr.affectedEquipment ?? '').trim().length > 0
        ? null
        : 'Name or describe the affected equipment.'),
    },
    {
      key: 'scope',
      title: 'Work',
      help: 'Choose the type of work — that sets the hazards this kind of job normally carries — '
          + 'then describe what will actually be done. Answer the hot work questions if any part of '
          + 'the job involves heat, sparks or flame.',
      fields: ['workCategoryName', 'workScope', 'dateOfWork', 'timeOfWork', 'isLOTORequired',
               'isHotWorkRequired', 'foremanName', 'fireWatchName', 'hotWorkTypes',
               'hotWorkOtherDescription', 'hotWorkFumeLevel', 'hotWorkChromeContent'],
      validate: wr => {
        if (String(wr.workScope ?? '').trim().split(/\s+/).filter(Boolean).length < 2) {
          return 'Describe the work in at least a couple of words.';
        }
        if (wr.isHotWorkRequired === 'Yes') {
          if (!String(wr.foremanName ?? '').trim()) return 'Hot work needs a foreman name.';
          if (!String(wr.fireWatchName ?? '').trim()) return 'Hot work needs a fire watch name.';
          const types: any = (wr as any).hotWorkTypes ?? {};
          if (types.welding && !(wr as any).hotWorkFumeLevel) {
            return 'Welding needs the hot work method for the hexavalent chromium assessment.';
          }
          if (types.welding && !(wr as any).hotWorkChromeContent) {
            return 'Welding needs the base metal chrome content.';
          }
        }
        return null;
      },
    },
    {
      key: 'hazards',
      title: 'Hazards',
      help: 'These are already ticked from the area and the type of work you chose. Check them over '
          + '— add anything we have missed, and untick anything that does not apply.',
      fields: ['isConfinedSpaceEntryRequired', 'spaceToBeEntered', 'declaredHazards',
               'declaredHotWorkMeasures', 'declaredConfinedSpaceHazards'],
      validate: () => null,
    },
    {
      key: 'submitter',
      title: 'You',
      help: 'We need to know who to contact about this request.',
      fields: ['workRequestedBy', 'company'],
      validate: wr => (String(wr.workRequestedBy ?? '').trim() && String(wr.company ?? '').trim()
        ? null
        : 'Your name and company are required.'),
    },
  ];

  ngOnInit(): void {
    const existing = this.state.getSelectedWorkRequest();
    const wr = existing ?? new WorkRequest();
    const user = this.userSetup.getUserData();
    if (user) {
      if (!wr.workRequestedBy) wr.workRequestedBy = user.name;
      if (!wr.company) wr.company = user.company;
    }
    this.draft.set(wr);
  }

  /**
   * The submitter step is skipped entirely when the device already knows who this is — the PWA
   * collects name, company, email and phone during user setup, so asking again is noise.
   */
  private stepVisible(step: WizardStep): boolean {
    return step.key !== 'submitter' || !this.userSetup.isValid();
  }

  visibleSteps = computed(() => this.steps.filter(s => this.stepVisible(s)));

  current = computed<WizardStep | undefined>(() => this.visibleSteps()[this.index()]);

  isLast = computed(() => this.index() >= this.visibleSteps().length - 1);

  /**
   * Fields are re-derived from the DRAFT on every step, not cached. `toFormFields()` reads the
   * entity's current values for its initialValues, so regenerating is what carries answers forward
   * — and it is why seeded values appear already filled in when their step is reached.
   */
  stepFields = computed<FormField[]>(() => {
    const step = this.current();
    if (!step) return [];
    const all = this.draft().toFormFields() ?? [];

    if (step.key === 'location') {
      // Exactly one text field, chosen here rather than by `showWhen`.
      //
      // Both location fields are gated on `workAreaUnknown`, and that control is deliberately NOT
      // rendered any more — the map's own skip button owns that decision. But shouldShowField()
      // returns FALSE when a showWhen's controlling field is absent from the form, so leaving the
      // conditions in place would hide both fields and leave the step blank. Stripping showWhen and
      // picking the branch directly is the honest version of what the condition meant.
      const unknown = (this.draft() as any).workAreaUnknown === true;
      const wanted = unknown ? 'locationDescription' : 'locationDetail';
      return all.filter(f => f.name === wanted).map(f => ({ ...f, showWhen: undefined }));
    }

    const wanted = new Set(step.fields);
    return all.filter(f => wanted.has(f.name));
  });

  // ---------------------------------------------------------------- navigation

  /**
   * Areas were picked on the map.
   *
   * <p>The FIRST is the primary — it is what the job grouping key, the scored job match and the
   * permits map all use, and what a single-area request has always meant. Existing per-area answers
   * are preserved across re-picks so ticking a fourth area does not wipe the three answers already
   * given.
   *
   * <p>An area flagged as a confined space starts with entry ticked, because that is what its own
   * record says about it; the requester can untick it, and that choice survives the next re-pick.
   */
  onAreasPicked(picked: any): void {
    const list: any[] = Array.isArray(picked) ? picked : picked ? [picked] : [];
    const wr = this.draft();
    const existing = new Map((wr.workAreas ?? []).map(a => [a.id, a]));

    wr.workAreas = list.map((area, i) => {
      const prior = existing.get(area.id);
      return {
        id: area.id,
        name: area.name,
        primary: i === 0,
        confinedSpaceEntry: prior ? prior.confinedSpaceEntry : !!area.isConfinedSpace,
        spaceName: prior ? prior.spaceName : (area.isConfinedSpace ? area.name : null),
        hotWork: prior ? prior.hotWork : false,
      };
    });

    // The primary area still drives everything that expects exactly one.
    const primary = wr.workAreas[0] ?? null;
    (wr as any).workAreaMap = primary ? { id: primary.id, name: primary.name } : null;
    (wr as any).workAreaUnknown = !primary;
    foldWorkRequestVirtualFields(wr, { strip: false });
    this.applySeedingForAllAreas(wr);

    this.draft.set(wr);
    this.state.saveDraft(wr);
    this.blockReason.set('');
    if (primary) this.phase.set('detail');
  }

  /**
   * Seed from EVERY picked area, not just the primary. The merge is additive and honours the
   * requester's declines, so a union across areas needs no extra rules — an area is simply another
   * source of hazards that already apply there.
   */
  private applySeedingForAllAreas(wr: WorkRequest): void {
    const originalId = wr.workAreaId;
    for (const area of wr.workAreas ?? []) {
      wr.workAreaId = area.id;
      this.seeds.applyAreaSeeding(wr, this.declined);
    }
    wr.workAreaId = originalId;
  }

  setAreaFlag(index: number, flag: 'confinedSpaceEntry' | 'hotWork', on: boolean): void {
    const wr = this.draft();
    const areas = [...(wr.workAreas ?? [])];
    if (!areas[index]) return;
    areas[index] = { ...areas[index], [flag]: on };
    if (flag === 'confinedSpaceEntry' && on && !areas[index].spaceName) {
      areas[index].spaceName = areas[index].name;
    }
    wr.workAreas = areas;
    // Keep the request-level answers in step with the per-area ones, the same way the backend does.
    if (areas.some(a => a.confinedSpaceEntry)) wr.isConfinedSpaceEntryRequired = 'Yes';
    if (areas.some(a => a.hotWork)) wr.isHotWorkRequired = 'Yes';
    this.draft.set(wr);
    this.state.saveDraft(wr);
  }

  setAreaSpace(index: number, value: string): void {
    const wr = this.draft();
    const areas = [...(wr.workAreas ?? [])];
    if (!areas[index]) return;
    areas[index] = { ...areas[index], spaceName: value };
    wr.workAreas = areas;
    this.draft.set(wr);
  }

  /**
   * A plant-wide scope with no matching work area. Recorded as location text, which is exactly what
   * the requester would have typed — and the hub's resolver will place it on the permits map by
   * itself if an area of that name is created later.
   */
  onScopePicked(label: string): void {
    const wr = this.draft();
    (wr as any).workAreaMap = null;
    (wr as any).workAreaUnknown = true;
    (wr as any).locationDescription = label;
    wr.workAreas = [];
    foldWorkRequestVirtualFields(wr, { strip: false });
    this.draft.set(wr);
    this.state.saveDraft(wr);
    this.blockReason.set('');
    this.phase.set('detail');
  }

  /** They could not find it. Straight to the describe-it field. */
  skipMap(): void {
    const wr = this.draft();
    (wr as any).workAreaUnknown = true;
    (wr as any).workAreaMap = null;
    wr.workAreas = [];
    foldWorkRequestVirtualFields(wr, { strip: false });
    this.draft.set(wr);
    this.blockReason.set('');
    this.phase.set('detail');
  }

  /** True once the map phase is behind us and an area was actually chosen. */
  pickedAreaName = computed(() => this.draft().workAreaName || '');

  onValueChange(value: any): void {
    const wr = this.draft();
    this.rememberDeclinedHazards(value);
    Object.assign(wr, value);

    // Turn workAreaMap into workAreaId BEFORE anything reads it. Without this the picker's value
    // never became an area id, so step 1 could not be completed even with an area plainly selected.
    // strip:false — each step rebuilds its fields from the draft, and stripping workAreaMap here
    // would blank the picker on the next keystroke.
    foldWorkRequestVirtualFields(wr, { strip: false });
    foldHotWorkProfile(wr, { strip: false });
    foldHotWorkProfile(wr, { strip: false });
    this.seeds.applyAreaSeeding(wr, this.declined);
    this.seeds.applyWorkTypeSeeding(wr, this.declined);

    // A new object identity so downstream computeds recompute; the wizard mutates one draft
    // deliberately so a value entered in step 1 is still there in step 5.
    this.draft.set(wr);
    if (this.blockReason()) this.blockReason.set('');
    this.state.saveDraft(wr);
  }

  onNext(value: any): void {
    const wr = this.draft();
    Object.assign(wr, value);
    foldWorkRequestVirtualFields(wr, { strip: false });
    this.seeds.applyAreaSeeding(wr, this.declined);
    this.seeds.applyWorkTypeSeeding(wr, this.declined);
    const step = this.current();
    if (!step) return;

    const problem = step.validate(wr);
    if (problem) {
      this.blockReason.set(problem);
      return;
    }
    this.blockReason.set('');
    this.state.saveDraft(wr);

    if (this.isLast()) {
      this.state.selectWorkRequest(wr);
      this.reviewReady.emit(wr);
      return;
    }
    this.index.update(i => i + 1);
  }

  back(): void {
    this.blockReason.set('');
    if (this.current()?.key === 'location' && this.phase() === 'detail') {
      this.phase.set('map');
      return;
    }
    this.index.update(i => Math.max(0, i - 1));
  }

  /** Only backwards. A step ahead has not been validated, so its form would be half-empty. */
  jumpTo(i: number): void {
    if (i < this.index()) {
      this.blockReason.set('');
      this.index.set(i);
      if (this.visibleSteps()[i]?.key === 'location') this.phase.set('map');
    }
  }

  /**
   * Record hazards the requester has just turned OFF so seeding never re-ticks them.
   *
   * <p>Only removals are recorded. A hazard they turn ON needs no bookkeeping — seeding only ever
   * adds, so it can never be the thing that turns one off.
   */
  private rememberDeclinedHazards(value: any): void {
    for (const block of ['declaredHazards', 'declaredHotWorkMeasures', 'declaredConfinedSpaceHazards']) {
      const before: any = (this.draft() as any)[block] ?? {};
      const after: any = value?.[block] ?? {};
      for (const key of Object.keys(after)) {
        if (before[key] === true && after[key] === false) this.declined.add(`${block}.${key}`);
        if (after[key] === true) this.declined.delete(`${block}.${key}`);
      }
    }
  }
}
