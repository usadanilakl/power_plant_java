import { Component, DestroyRef, OnInit, computed, inject, output, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators } from '@angular/forms';

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
      <!--
        One bar for the whole wizard.

        There used to be five bands of chrome before the first question: the page's own sticky
        header (Back + Resubmit), the step chips, the step heading, and the help paragraph. On a
        phone that was most of the first screen. This row does all three jobs at once - where you
        are, how to go back, and everything that is not the next question.
      -->
      <header class="bar">
        <button type="button" class="bar-icon" (click)="back()" [attr.aria-label]="backLabel()"
                [title]="backLabel()">&#8592;</button>

        <div class="bar-progress">
          <div class="bar-text">
            <span class="bar-step">Step {{ stepNumber() }} of {{ stepCount() }}</span>
            <span class="bar-sep">&middot;</span>
            <span class="bar-title">{{ current()?.title }}</span>
          </div>
          <div class="bar-track" role="progressbar" [attr.aria-valuenow]="stepNumber()"
               aria-valuemin="1" [attr.aria-valuemax]="stepCount()">
            <span class="bar-fill" [style.width.%]="progress()"></span>
          </div>
        </div>

        <!-- Everything that is not the next question lives behind here, so each step has exactly
             one obvious primary action. "Skip the guide" used to compete with Next on every step. -->
        <div class="bar-more">
          <button type="button" class="bar-icon" (click)="menuOpen.set(!menuOpen())"
                  aria-haspopup="menu" [attr.aria-expanded]="menuOpen()"
                  aria-label="More options" title="More options">&#8942;</button>
          @if (menuOpen()) {
            <div class="menu-scrim" (click)="menuOpen.set(false)"></div>
            <div class="menu" role="menu">
              <button type="button" role="menuitem" (click)="chooseFullForm()">
                Open the full form
              </button>
              <button type="button" role="menuitem" (click)="chooseResubmit()">
                Resubmit a previous request
              </button>
              <button type="button" role="menuitem" class="danger" (click)="chooseExit()">
                Leave this request
              </button>
            </div>
          }
        </div>
      </header>

      <div class="step-body" *ngIf="current() as step">
        <p class="step-help" *ngIf="!onMap()">{{ step.help }}</p>

        <p class="step-block" *ngIf="blockReason()">{{ blockReason() }}</p>

        <!-- The map IS the first question, so it is the first thing on screen - not a control
             buried in a form under a label. The escape hatch and the plant-wide scopes are drawn
             on the map itself, so both ways of answering are visible at the moment of deciding. -->
        <ng-container *ngIf="step.key === 'location' && phase() === 'map'">
          <app-work-area-map-select
            [multiple]="true"
            [autoOpen]="true"
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
            &mdash; add anything that helps us find you (optional).
          </ng-container>
          <ng-template #noArea>
            No area selected. Describe where the work is, in your own words &mdash; an operator will
            place it for you.
          </ng-template>
          <button type="button" class="link-btn" (click)="phase.set('map')">Change</button>
        </div>

        <!-- What happens in each area. Two questions per area and nothing else: they are what
             decide how many Confined Space and Hot Work permits get issued. The hot-work detail is
             asked once, in the Work step. -->
        <div class="area-plan" *ngIf="step.key === 'location' && phase() === 'detail' && areas().length">
          <p class="area-plan-help" *ngIf="areas().length > 1">
            One Confined Space permit is issued per space, and one Hot Work permit per area where
            hot work happens &mdash; so tell us which areas need what.
          </p>
          <div class="area-row" *ngFor="let area of areas(); let i = index">
            <div class="area-name">
              <span class="primary-tag" *ngIf="i === 0">main</span>
              {{ area.name }}
            </div>
            <!-- Dropping an area used to mean going back to the map and hunting for it. -->
            <button type="button" class="area-remove" (click)="removeAreaAt(i)"
                    [attr.aria-label]="'Remove ' + area.name" title="Remove this area">&times;</button>
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

        <!-- showSubmitButton=false: the action bar below drives submission by calling this form's
             own onSubmit(), so the wizard gets one button in one place while the form keeps its
             validation, its markAllAsTouched and its scroll-to-first-error. -->
        <app-reactive-form
          *ngIf="!(step.key === 'location' && phase() === 'map')"
          [entity]="draft()"
          [fields]="stepFields()"
          [title]="''"
          [showAddEditOption]="false"
          [showSubmitButton]="false"
          (formValueChange)="onValueChange($event)"
          (formSubmit)="onNext($event)"
        ></app-reactive-form>
      </div>

      <!-- One action, always in the same place. Next used to sit inside the form on most steps and
           under the map on the first one, so the thing to press moved between steps. -->
      <div class="action-bar">
        <span class="action-note">{{ actionNote() }}</span>
        <button type="button" class="action-primary"
                [disabled]="primaryDisabled()" (click)="primary()">
          {{ primaryLabel() }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .wizard {
      display: flex; flex-direction: column;
      min-height: 100%;
    }

    /* ---------------------------------------------------------------- the one bar */

    .bar {
      position: sticky; top: 0; z-index: 5;
      display: flex; align-items: center; gap: 10px;
      padding: 6px 4px 8px;
      background: var(--primary-background, #fff);
      border-bottom: 1px solid var(--border-color, #e6e6e6);
    }

    .bar-icon {
      flex: 0 0 auto;
      width: 36px; height: 36px; border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      border: none; background: none; cursor: pointer;
      color: var(--primary-text, #222); font-size: 20px; line-height: 1;
    }
    .bar-icon:hover { background: var(--secondary-background, #f0f2f5); }

    .bar-progress { flex: 1; min-width: 0; }

    .bar-text {
      display: flex; align-items: baseline; gap: 5px;
      font-size: 12px; color: var(--secondary-text, #666);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .bar-title { font-weight: 600; color: var(--primary-text, #222); }

    .bar-track {
      margin-top: 5px; height: 3px; border-radius: 2px;
      background: var(--secondary-background, #e9ecef); overflow: hidden;
    }
    .bar-fill {
      display: block; height: 100%; border-radius: 2px;
      background: var(--accent-color, #007bff);
      transition: width .25s ease;
    }

    .bar-more { position: relative; flex: 0 0 auto; }

    /* Catches the next tap anywhere so the menu closes without a document listener. */
    .menu-scrim { position: fixed; inset: 0; z-index: 9; }

    .menu {
      position: absolute; top: 100%; right: 0; z-index: 10;
      min-width: 220px; padding: 4px;
      background: var(--primary-background, #fff);
      border: 1px solid var(--border-color, #ddd); border-radius: 8px;
      box-shadow: 0 6px 20px rgba(0,0,0,.16);
    }
    .menu button {
      display: block; width: 100%; padding: 9px 12px;
      border: none; background: none; cursor: pointer;
      text-align: left; font-size: 14px; border-radius: 5px;
      color: var(--primary-text, #222);
    }
    .menu button:hover { background: var(--secondary-background, #f0f2f5); }
    .menu button.danger { color: #b71c1c; }

    /* ---------------------------------------------------------------- step body */

    .step-body { flex: 1; padding: 14px 0 4px; }

    .step-help {
      margin: 0 0 14px; font-size: 13px; line-height: 1.5;
      color: var(--secondary-text, #666);
    }

    .step-block {
      margin: 0 0 12px; padding: 8px 12px; border-radius: 6px;
      background: #fdecea; color: #b71c1c; font-size: 13px;
    }

    .picked {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      margin: 0 0 12px; padding: 8px 12px; border-radius: 6px;
      background: var(--secondary-background, #f0f2f5);
      font-size: 13px; line-height: 1.5;
    }

    .link-btn {
      margin-left: auto; background: none; border: none; cursor: pointer;
      color: var(--accent-color, #007bff); font-size: 13px; padding: 4px;
    }
    .link-btn:hover { text-decoration: underline; }

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

    .area-remove {
      order: 99; margin-left: auto;
      width: 26px; height: 26px; border-radius: 50%;
      border: none; background: none; cursor: pointer;
      color: var(--secondary-text, #777); font-size: 18px; line-height: 1;
    }
    .area-remove:hover { background: #fdecea; color: #b71c1c; }

    .area-space {
      flex: 1; min-width: 160px; padding: 4px 8px;
      border: 1px solid var(--border-color, #ddd); border-radius: 4px;
      background: var(--primary-background, #fff); color: var(--primary-text, #222);
      font-size: 13px;
    }

    /* ---------------------------------------------------------------- action bar */

    /* Sticky rather than fixed: it pins to the bottom of the scrolling content area while there is
       more below, and the flex column above pushes it to the bottom when the step is short. Fixed
       would have to guess at this page's scroll container. */
    .action-bar {
      position: sticky; bottom: 0; z-index: 4;
      display: flex; align-items: center; gap: 12px;
      margin-top: 12px; padding: 10px 4px calc(10px + env(safe-area-inset-bottom, 0px));
      background: var(--primary-background, #fff);
      border-top: 1px solid var(--border-color, #e6e6e6);
    }

    .action-note {
      flex: 1; min-width: 0;
      font-size: 12px; line-height: 1.4; color: var(--secondary-text, #666);
    }

    .action-primary {
      flex: 0 0 auto; padding: 11px 24px; border: none; border-radius: 6px;
      background: var(--accent-color, #007bff); color: #fff;
      font-size: 15px; font-weight: 600; cursor: pointer;
    }
    .action-primary:disabled { opacity: .45; cursor: not-allowed; }

    @media (max-width: 600px) {
      .action-primary { flex: 1; padding: 13px 20px; }
      /* On a phone the note competes with the button for the same row; the button wins. */
      .action-note:empty { display: none; }
    }
  `],
})
export class WorkRequestWizardComponent implements OnInit {
  /** The requester asked for the full form instead. */
  skipToForm = output<void>();
  /** Every step passed; hand over to the full form for a final read-through and submit. */
  reviewReady = output<WorkRequest>();
  /** Back from the very first step, or "Leave this request" — the host owns where that goes. */
  exitRequested = output<void>();
  /** "Resubmit a previous request" — the host owns the picker popup. */
  resubmitRequested = output<void>();

  /**
   * The step's form, so the action bar can submit it.
   *
   * <p>Calling the form's own `onSubmit()` rather than rebuilding the value here is what keeps the
   * single action bar honest: the form still decides validity, still marks everything touched and
   * still scrolls to the first error, exactly as it did when the button lived inside it.
   */
  private formRef = viewChild(ReactiveFormComponent);

  /** The overflow menu behind the bar's "more" button. */
  menuOpen = signal(false);

  private state = inject(WorkRequestStateService);
  private userSetup = inject(UserSetupService);
  private seeds = inject(WorkAreaSeedService);
  private destroyRef = inject(DestroyRef);

  /**
   * Work-category options for the scope step's dropdown. Read from the same
   * {@code pwa_work_categories} localStorage cache that WorkRequestFormComponent writes
   * on every successful hub / Supabase fetch — so the wizard has options the moment
   * the full form has, without duplicating the load pipeline. The model itself ships
   * with an empty {@code options: []} because it has no access to hub / cache; every
   * host is expected to inject its own list, and the wizard silently rendering an
   * empty select was the previous version of that expectation.
   */
  private workCategoryOptions = signal<{ value: string; label: string }[]>(this.readCachedCategoryOptions());
  private readCachedCategoryOptions(): { value: string; label: string }[] {
    try {
      const raw = localStorage.getItem('pwa_work_categories');
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ value?: string; label?: string; name?: string }>;
        // The cache is written both as [{value,label}] (form component) and could arrive as
        // [{id,name}] on cold start before the form runs — tolerate both.
        if (Array.isArray(parsed)) {
          const mapped = parsed
            .map(o => ({ value: o.value ?? o.name ?? '', label: o.label ?? o.name ?? '' }))
            .filter(o => o.value);
          if (mapped.length) return mapped;
        }
      }
    } catch { /* fall through to defaults */ }
    // Cold-start fallback: same 12-entry set the full form ships with, so a first-time
    // wizard visitor never sees an empty dropdown. Hub-served categories overwrite this
    // as soon as the full form runs once (its subscribe writes the cache).
    return ['Mechanical', 'Electrical', 'Insulation', 'Inspection', 'Rigging', 'Cleaning',
            'Energized', 'I&C', 'Welding / Hot Work', 'Civil', 'Operations', 'Scaffolding']
      .map(name => ({ value: name, label: name }));
  }

  /**
   * The one draft, mutated in place — with identity equality DISABLED.
   *
   * <p>Every handler here mutates the same WorkRequest and calls `draft.set(wr)`. A signal compares
   * with === by default, so setting it to the object it already holds is a no-op: nothing
   * recomputed, and the Continue button stayed disabled no matter how many areas were tapped.
   *
   * <p>Mutating one draft is deliberate — it is what carries an answer from step 1 through to step
   * 5 — so the honest fix is to tell the signal that identity is not a useful comparison here,
   * rather than cloning a work request on every keystroke.
   */
  draft = signal<WorkRequest>(new WorkRequest(), { equal: () => false });
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
      help: 'Tap the area on the map where the work will be done. Tap more than one if the job '
          + 'covers several. If you cannot find it, use "I cannot find it" on the map and describe '
          + 'the spot instead.',
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
      validate: wr => {
        // Either answer will do: a tag number off the picker, or a description typed into the
        // fallback. Reading the helper control directly, because the fold that merges the two runs
        // in onNext just before this.
        const picked = String(wr.affectedEquipment ?? '').trim();
        const typed = String((wr as any).affectedEquipmentText ?? '').trim();
        return picked || typed ? null : 'Name or describe the affected equipment.';
      },
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
    // Refresh / re-entry: if the request already carries picked areas or a plant-wide
    // scope description, don't slam the map back over the top — jump past the map into
    // the follow-up 'detail' sub-phase. And when EVERY earlier step is already valid,
    // advance the index to the first step that still needs an answer, so a returning
    // user lands on the question they left off on rather than starting from step 1.
    const hasArea = (wr.workAreas?.length ?? 0) > 0 || wr.workAreaId != null;
    const scopedText = String((wr as any).locationDescription ?? '').trim().length > 0;
    if (hasArea || (wr.workAreaUnknown && scopedText)) {
      this.phase.set('detail');
      const first = this.firstIncompleteStepIndex(wr);
      if (first > 0) this.index.set(first);
    }
  }

  /**
   * First step whose {@code validate()} rejects the current draft — where the user
   * should be dropped on re-entry so they don't retrace steps they already answered.
   * Returns 0 if step 1 itself is incomplete (the normal cold-start case).
   */
  private firstIncompleteStepIndex(wr: WorkRequest): number {
    const visible = this.visibleSteps();
    for (let i = 0; i < visible.length; i++) {
      if (visible[i].validate(wr) != null) return i;
    }
    return Math.max(0, visible.length - 1);
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

  // ---------------------------------------------------------------- the bar

  stepNumber = computed(() => this.index() + 1);
  stepCount = computed(() => this.visibleSteps().length);
  progress = computed(() => (this.stepNumber() / Math.max(1, this.stepCount())) * 100);

  /** True while the location step is still showing the map rather than the follow-up text. */
  onMap = computed(() => this.current()?.key === 'location' && this.phase() === 'map');

  backLabel = computed(() => (this.index() === 0 && this.onMap()
    ? 'Leave this request'
    : 'Back'));

  // ---------------------------------------------------------------- the action bar

  primaryLabel = computed(() => {
    if (this.onMap()) return 'Continue';
    return this.isLast() ? 'Review and submit' : 'Next';
  });

  /**
   * Only the map gates its own button — every other step lets the press through and answers with a
   * reason. A disabled Next that will not say why is the worst version of a wizard.
   */
  primaryDisabled = computed(() => this.onMap() && !this.areas().length);

  actionNote = computed(() => {
    if (!this.onMap()) return '';
    const n = this.areas().length;
    return n
      ? `${n} area${n === 1 ? '' : 's'} selected — tap more if the work covers them.`
      : 'Pick at least one area to continue.';
  });

  primary(): void {
    if (this.onMap()) {
      this.phase.set('detail');
      return;
    }
    this.formRef()?.onSubmit();
  }

  // ---------------------------------------------------------------- overflow menu

  chooseFullForm(): void { this.menuOpen.set(false); this.skipToForm.emit(); }
  chooseResubmit(): void { this.menuOpen.set(false); this.resubmitRequested.emit(); }
  chooseExit(): void { this.menuOpen.set(false); this.exitRequested.emit(); }

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
      // One text field, always present. Which one depends on whether an area was picked — detail
      // to add to it, or a description instead of it — but there is always somewhere to write down
      // the thing the map could not express ("north side, behind the guard").
      const unknown = (this.draft() as any).workAreaUnknown === true;
      const wanted = unknown ? 'locationDescription' : 'locationDetail';
      return all.filter(f => f.name === wanted)
        .map(f => this.withoutRequired({ ...f, showWhen: undefined }));
    }

    const wanted = new Set(step.fields);
    const cats = this.workCategoryOptions();
    const base = all.filter(f => wanted.has(f.name)).map(f => {
      const withoutReq = this.withoutRequired(f);
      // Inject the loaded work-category list into the model's empty-options placeholder.
      // Without this the wizard's Main Work Scope dropdown was permanently empty — the
      // model can't reach the cache and the wizard skipped the full form's loader.
      if (withoutReq.name === 'workCategoryName' && cats.length) {
        return { ...withoutReq, options: cats };
      }
      return withoutReq;
    });

    // The escape hatch this step's help text has always promised. `affectedEquipmentText` is a
    // helper control, folded into `affectedEquipment` only when the picker found nothing, so a
    // typed description reaches the server through the field that already exists — no new column,
    // no schema change.
    if (step.key === 'equipment') {
      base.push({
        name: 'affectedEquipmentText',
        label: 'Or describe it in your own words',
        type: 'text',
        initialValue: (this.draft() as any).affectedEquipmentText ?? '',
      } as FormField);
    }

    return base;
  });

  /**
   * Drop `Validators.required` from a field.
   *
   * <p>The wizard states its own minimum per step, and the model's own `required` flags are a
   * SECOND gate that disagrees with it — the work-type dropdown is required on the full form, so the
   * step refused to advance even though the stated minimum is a couple of words of work scope. Two
   * gates means the one the requester was told about is not the one stopping them.
   *
   * <p>Only `required` is removed; anything else a field validates (a pattern, a range) still
   * applies, because those describe the value rather than whether an answer is owed.
   */
  private withoutRequired(field: FormField): FormField {
    const validators = (field as any).validators as any[] | undefined;
    if (!validators?.length) return field;
    const kept = validators.filter(v => v !== Validators.required);
    return kept.length === validators.length ? field : { ...field, validators: kept } as FormField;
  }

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

    // Hand the whole list to the fold as the ARRAY form and let it own the rebuild. The per-area
    // merge used to live here, which is why the review form — which folds the same request through
    // the same function — could change the area without `workAreas` ever following.
    (wr as any).workAreaMap = list
      .filter(area => area && typeof area.id === 'number')
      .map(area => ({ id: area.id, name: area.name, isConfinedSpace: !!area.isConfinedSpace }));
    (wr as any).workAreaUnknown = (wr as any).workAreaMap.length === 0;
    foldWorkRequestVirtualFields(wr, { strip: false });
    this.applySeedingForAllAreas(wr);
    this.recordSeeded(wr);

    this.draft.set(wr);
    this.state.saveDraft(wr);
    this.blockReason.set('');
    // Deliberately staying on the map. Advancing on the first pick made a second area impossible to
    // select — the screen moved on before the requester could tap it. They leave with Continue.
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

  /**
   * Drop one area from the request.
   *
   * <p>Goes through `workAreaMap` + the fold rather than writing `workAreas` directly, so the map
   * picker, the scalars and the list can never disagree about what is selected.
   */
  removeAreaAt(index: number): void {
    const wr = this.draft();
    const remaining = (wr.workAreas ?? []).filter((_, i) => i !== index);

    (wr as any).workAreaMap = remaining.map(a => ({ id: a.id, name: a.name }));
    (wr as any).workAreaUnknown = remaining.length === 0;
    foldWorkRequestVirtualFields(wr, { strip: false });
    this.reseedHazards(wr);

    this.draft.set(wr);
    this.state.saveDraft(wr);
  }

  /**
   * Rebuild the seeded hazards from scratch for the areas that remain.
   *
   * <p>Re-running the seeders is NOT enough: `WorkAreaSeedService.merge` only ever turns a hazard
   * ON, by design, so a hazard contributed by an area that has just been removed would stay ticked
   * for ever — the requester would be declaring hazards for a part of the plant they are no longer
   * working in. So the three declared blocks are cleared first and rebuilt.
   *
   * <p>Clearing is safe because the requester's own decisions are not stored in those blocks alone:
   * every hazard they explicitly UNticked is in `declined`, which the seeders honour, and it is
   * re-applied here so a rebuild cannot resurrect something they turned off. Hazards they ticked
   * themselves that no area or work type contributes are re-applied from the snapshot taken below.
   */
  private reseedHazards(wr: WorkRequest): void {
    const blocks = ['declaredHazards', 'declaredHotWorkMeasures', 'declaredConfinedSpaceHazards'] as const;

    // Anything ticked that seeding did NOT put there is the requester's own answer; keep it.
    const manual: Record<string, string[]> = {};
    for (const block of blocks) {
      const current: any = (wr as any)[block] ?? {};
      manual[block] = Object.keys(current).filter(
        key => current[key] === true && !this.seeded.has(`${block}.${key}`));
      (wr as any)[block] = {};
    }

    this.seeded.clear();
    this.applySeedingForAllAreas(wr);
    this.seeds.applyWorkTypeSeeding(wr, this.declined);
    this.recordSeeded(wr);

    for (const block of blocks) {
      const target: any = (wr as any)[block] ?? ((wr as any)[block] = {});
      for (const key of manual[block]) {
        if (!this.declined.has(`${block}.${key}`)) target[key] = true;
      }
    }
  }

  /**
   * Hazard keys the SEEDERS turned on, so {@link reseedHazards} can tell a seeded tick from one the
   * requester made themselves. Without the distinction a rebuild would either keep hazards from a
   * removed area or silently discard the requester's own additions.
   */
  private seeded = new Set<string>();

  private recordSeeded(wr: WorkRequest): void {
    for (const block of ['declaredHazards', 'declaredHotWorkMeasures', 'declaredConfinedSpaceHazards']) {
      const current: any = (wr as any)[block] ?? {};
      for (const key of Object.keys(current)) {
        if (current[key] === true) this.seeded.add(`${block}.${key}`);
      }
    }
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
    // onValueChange folds hot work but this did not, and the form's valueChanges is debounced a
    // full second — so a quick tap on Next advanced with the hot-work answers still unfolded.
    foldHotWorkProfile(wr, { strip: false });
    this.seeds.applyAreaSeeding(wr, this.declined);
    this.seeds.applyWorkTypeSeeding(wr, this.declined);

    // Publish BEFORE validating. The draft signal has identity equality disabled, so set() is what
    // bumps its version; without it areas(), pickedAreas() and pickedAreaName() went on serving
    // pre-fold values while blockReason (a separate signal) re-rendered — which is how the screen
    // came to list the chosen areas directly above a message saying no area had been picked.
    this.draft.set(wr);

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

  /**
   * The only Back in the wizard.
   *
   * <p>There were three before — the page's own Back, this one, and the browser's — with different
   * behaviour, so "go back" meant three different things depending on which one was nearest. This
   * walks one step at a time and hands off to the host at the start, which is what the page header's
   * Back used to do.
   */
  back(): void {
    this.blockReason.set('');
    if (this.current()?.key === 'location' && this.phase() === 'detail') {
      this.phase.set('map');
      return;
    }
    if (this.index() === 0) {
      this.exitRequested.emit();
      return;
    }
    this.index.update(i => i - 1);
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
