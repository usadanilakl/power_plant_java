import { Component, Input, computed, Signal, signal, inject, DestroyRef, effect, output, Output, EventEmitter } from '@angular/core';
import { WorkRequestDisplayComponent } from "../../work-request/work-request-display/work-request-display.component";
import { SafeWorkFormComponent } from "../../safe-work/safe-work-form/safe-work-form.component";
import { WorkRequestAreaDto, WorkRequestDto } from '../../../../models/permits/work-request.model';
import { WorkRequestService } from '../../../../services/permits/work-request.service';
import { CurrentWorkRequestService } from '../../../../services/current-items-services/current-work-requests.service';
import { WorkAreaMapPickerComponent } from '../../work-area/components/work-area-map-picker/work-area-map-picker.component';
import { WorkAreaDto } from '../../../../models/permits/work-area.model';
import { WorkAreaApiService } from '../../work-area/services/work-area-api.service';
import { SafeWorkDto } from '../../../../models/permits/safe-work.model';
import { HotWorkDto } from '../../../../models/permits/hot-work.model';
import { ConfinedSpaceDto } from '../../../../models/permits/confined-space.model';
import { HotWorkFormComponent } from "../../hot-work/hot-work-form/hot-work-form.component";
import { ConfinedSpaceFormComponent } from "../../confined-space/confined-space-form/confined-space-form.component";
import { FormsModule } from '@angular/forms';
import { DailyPermitPackageDto } from '../../../../models/permits/dailt-permit-package.model';
import { CurrentDailyPermitPackageService } from '../../../../services/current-items-services/current-daily-permit-package.service';
import { CurrentSafeWorkService } from '../../../../services/current-items-services/current-safe-work.service';
import { CurrentHotWorkService } from '../../../../services/current-items-services/current-hot-work.service';
import { CurrentConfinedSpaceService } from '../../../../services/current-items-services/current-confined-space.service';
import { DailyPermitPackageService } from '../../../../services/permits/daily-permit-package.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkCategoryProfileApiService } from '../../work-category-profile/services/work-category-profile-api.service';
import { WorkCategoryProfileDto } from '../../../../models/permits/work-category-profile.model';

@Component({
  selector: 'app-daily-permit-package-form',
  standalone: true,
  imports: [WorkRequestDisplayComponent, SafeWorkFormComponent, HotWorkFormComponent, ConfinedSpaceFormComponent, FormsModule, WorkAreaMapPickerComponent],
  templateUrl: './daily-permit-package-form.component.html',
  styleUrl: './daily-permit-package-form.component.css'
})
export class DailyPermitPackageFormComponent {
  private currentDailyPermitPackage = inject(CurrentDailyPermitPackageService);
  private dailyPermitPackage = inject(DailyPermitPackageService);
  private currentSafeWorkService = inject(CurrentSafeWorkService);
  private currentHotWorkService = inject(CurrentHotWorkService);
  private currentConfinedSpaceService = inject(CurrentConfinedSpaceService);
  private categoryProfileApi = inject(WorkCategoryProfileApiService);
  private destroyRef = inject(DestroyRef);


  @Input() workRequest: Signal<WorkRequestDto> = signal<WorkRequestDto>(new WorkRequestDto());

  @Input() safeWorkInput?: Signal<SafeWorkDto>;
  @Input() hotWorkInput?: Signal<HotWorkDto>;
  @Input() confinedSpaceInput?: Signal<ConfinedSpaceDto>;

  @Output() formSubmit = new EventEmitter<DailyPermitPackageDto>();

  // Category profile loaded reactively based on work request's work category
  private categoryProfile = signal<WorkCategoryProfileDto | null>(null);

  /**
   * Every work area, so a per-area permit can be seeded from and bound to its OWN area rather than
   * the request's primary one. Cheap: the list is small and cached by the shared API service.
   */
  private workAreaOptions = signal<WorkAreaDto[]>([]);
  private workAreaApi = inject(WorkAreaApiService);

  private readonly loadAreas = this.workAreaApi.getAll()
    .subscribe(areas => this.workAreaOptions.set(areas));

  /**
   * The request as permits should be generated from it — the operator's area / equipment / scope
   * decision applied over what the requester submitted.
   *
   * <p>Every generator below reads this instead of `workRequest()`, which is the whole point of
   * having it: the override then reaches permits generated now AND any permit added to the
   * package later, without each generator having to remember to consult it. The underlying
   * request object is never mutated — it keeps showing what was actually asked for.
   *
   * <p>`workArea` is re-pointed too, not just the list: it is the FK a permit persists against,
   * so leaving it on the requester's guess would file the permit under the wrong area even when
   * the operator had corrected it.
   */
  effectiveRequest: Signal<WorkRequestDto> = computed(() => {
    const wr = this.workRequest();
    if (!this.hasOperatorOverride()) return wr;
    const patched = WorkRequestDto.fromJson({ ...wr.toJson() });
    patched.workAreas = wr.effectiveWorkAreas ?? [];
    patched.affectedEquipment = wr.effectiveAffectedEquipment ?? null;
    patched.workScope = wr.effectiveWorkScope ?? null;
    const primary = (wr.effectiveWorkAreas ?? []).find(a => a.primary) ?? (wr.effectiveWorkAreas ?? [])[0];
    const primaryDto = primary ? this.areaDtoFor(primary) : null;
    if (primaryDto) {
      patched.workArea = primaryDto;
      patched.location = primary!.name;
    }
    return patched;
  });

  /** True when an operator has corrected any of area / equipment / scope on this request. */
  hasOperatorOverride = computed(() => {
    const wr = this.workRequest();
    return (wr.operatorWorkAreas?.length ?? 0) > 0
      || !!wr.operatorAffectedEquipment?.trim()
      || !!wr.operatorWorkScope?.trim();
  });

  // ---- Operator area / equipment / scope panel -------------------------------------------
  //
  // A request can arrive with no area at all (the PWA's "not sure which area" path exists
  // because an offline cold start has no shapes to pick from), or with an equipment line or
  // scope too vague to put on a permit. Correcting it here once beats correcting every
  // generated permit by hand, and again for every permit added later.

  private workRequestApi = inject(WorkRequestService);
  private currentWorkRequestService = inject(CurrentWorkRequestService);

  overridePanelOpen = signal(false);
  /** Working copy — nothing is committed until Apply, so a half-edited area list never generates. */
  overrideAreas = signal<WorkRequestAreaDto[]>([]);
  overrideEquipment = signal('');
  overrideScope = signal('');
  overrideSaving = signal(false);
  overrideError = signal<string | null>(null);

  /** Ids currently in the working set, so the map can draw the whole running selection. */
  chosenAreaIds = computed(() => this.overrideAreas().map(a => a.id));

  /** Opens the panel seeded with what is in force now, so editing starts from the truth. */
  openOverridePanel(): void {
    const wr = this.workRequest();
    this.overrideAreas.set((wr.effectiveWorkAreas ?? []).map(a => ({ ...a })));
    this.overrideEquipment.set(wr.effectiveAffectedEquipment ?? '');
    this.overrideScope.set(wr.effectiveWorkScope ?? '');
    this.overrideError.set(null);
    this.overridePanelOpen.set(true);
  }

  /**
   * Adds an area picked on the map. Add-only and idempotent: clicking a shape that is already
   * in the set does nothing.
   *
   * <p>Not a toggle, deliberately. On a map a click is how you inspect a shape as much as how
   * you choose it, and a toggle would let an operator drop an area — and with it a Hot Work or
   * Confined Space permit — by clicking to look at it. Removal is an explicit × in the list.
   */
  onMapAreaPicked(area: WorkAreaDto | null): void {
    if (!area?.id) return;
    const current = this.overrideAreas();
    if (current.some(a => a.id === area.id)) return;
    this.overrideAreas.set([...current, {
      id: area.id,
      name: area.name ?? '',
      primary: current.length === 0,
      confinedSpaceEntry: false,
      spaceName: null,
      hotWork: false,
    } as WorkRequestAreaDto]);
  }

  removeOverrideArea(areaId: number | null): void {
    const current = this.overrideAreas();
    const removed = current.find(a => a.id === areaId);
    const remaining = current.filter(a => a.id !== areaId);
    // Removing the primary would leave the list without one, and everything downstream that asks
    // for "the" area then silently falls back to whichever is first. Promote explicitly instead.
    if (removed?.primary && remaining.length) remaining[0] = { ...remaining[0], primary: true };
    this.overrideAreas.set(remaining);
  }

  /** Patches one field of one chosen area (primary / hotWork / confinedSpaceEntry / spaceName). */
  patchOverrideArea(areaId: number | null, patch: Partial<WorkRequestAreaDto>): void {
    this.overrideAreas.set(this.overrideAreas().map(a => {
      if (a.id !== areaId) {
        // Primary is exclusive — setting it on one area has to clear it everywhere else, or the
        // "primary or first" fallback quietly picks whichever happens to be first in the list.
        return patch.primary ? { ...a, primary: false } : a;
      }
      return { ...a, ...patch };
    }));
  }

  applyOverride(): void {
    const id = this.workRequest().id;
    if (!id) return;
    this.overrideSaving.set(true);
    this.overrideError.set(null);
    this.workRequestApi.setOperatorOverride(id, {
      operatorWorkAreas: this.overrideAreas(),
      operatorAffectedEquipment: this.overrideEquipment().trim(),
      operatorWorkScope: this.overrideScope().trim(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.overrideSaving.set(false);
          this.overridePanelOpen.set(false);
          this.currentWorkRequestService.updateSelectedWorkRequest(res.responseData);
        },
        error: err => {
          this.overrideSaving.set(false);
          this.overrideError.set(err?.error?.message ?? 'Could not save. The permits below still show the submitted values.');
        },
      });
  }

  clearOverride(): void {
    const id = this.workRequest().id;
    if (!id) return;
    this.overrideSaving.set(true);
    this.workRequestApi.clearOperatorOverride(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.overrideSaving.set(false);
          this.overridePanelOpen.set(false);
          this.currentWorkRequestService.updateSelectedWorkRequest(res.responseData);
        },
        error: err => {
          this.overrideSaving.set(false);
          this.overrideError.set(err?.error?.message ?? 'Could not clear the override.');
        },
      });
  }

  safeWork: Signal<SafeWorkDto> = computed(() =>
    this.safeWorkInput?.() ?? SafeWorkDto.generatePermitFromRequest(this.effectiveRequest(), this.effectiveRequest().workArea, this.categoryProfile())
  );

  hotWork: Signal<HotWorkDto> = computed(() =>
    this.hotWorkInput?.() ?? HotWorkDto.generatePermitFromRequest(this.effectiveRequest(), this.effectiveRequest().workArea, this.categoryProfile())
  );

  confinedSpace: Signal<ConfinedSpaceDto> = computed(() =>
    this.confinedSpaceInput?.() ?? ConfinedSpaceDto.generatePermitFromRequest(this.effectiveRequest(), this.effectiveRequest().workArea, this.categoryProfile())
  );

  /**
   * The areas this request covers that need entry — one Confined Space permit each.
   *
   * <p>A CS permit is inherently per-space: its atmosphere readings, entrants and attendant all
   * belong to one space. The package has always been able to hold several; what it could not do was
   * generate them, because a request named only one space.
   *
   * <p>Falls back to the single request-level permit when the request declares no areas, which is
   * every request submitted before this existed.
   */
  confinedSpaces: Signal<ConfinedSpaceDto[]> = computed(() => {
    const wr = this.effectiveRequest();
    if (this.confinedSpaceInput?.()) return [this.confinedSpaceInput()!];

    const declared = wr.workAreas ?? [];
    // No areas at all is the legacy shape — every request submitted before multi-area existed — and
    // falls back to the single request-level permit. Areas declared with none needing entry is a
    // real answer meaning "no confined space", NOT missing data, so it produces no permit.
    if (!declared.length) return [this.confinedSpace()];

    return declared.filter(a => a.confinedSpaceEntry).map(area => {
      const dto = ConfinedSpaceDto.generatePermitFromRequest(wr, this.areaDtoFor(area), this.categoryProfile());
      dto.space = area.spaceName?.trim() || area.name;
      // Without this the permit persists against the PRIMARY area, so a five-space package would
      // report every space as being in the first one.
      (dto as any).workArea = this.areaDtoFor(area);
      return dto;
    });
  });

  /**
   * The areas where hot work is planned — one Hot Work permit each, and usually a subset of the
   * areas, because a fire watch cannot be in two places.
   *
   * <p>The hot-work DETAIL (types, welding method, the Cr(VI) assessment) is asked once on the
   * request and seeded into every permit: same crew, same job, so the kind of welding does not
   * change between areas. The operator completes each permit's fire watch, which is the part that
   * genuinely cannot be shared and which the requester could not have known at submission time.
   */
  hotWorks: Signal<HotWorkDto[]> = computed(() => {
    const wr = this.effectiveRequest();
    if (this.hotWorkInput?.()) return [this.hotWorkInput()!];

    const declared = wr.workAreas ?? [];
    if (!declared.length) return [this.hotWork()];

    return declared.filter(a => a.hotWork).map(area => {
      const dto = HotWorkDto.generatePermitFromRequest(wr, this.areaDtoFor(area), this.categoryProfile());
      dto.location = area.name;
      (dto as any).workArea = this.areaDtoFor(area);
      return dto;
    });
  });

  /** True when the request covers more than one area, so the operator gets the choice below. */
  isMultiArea = computed(() => (this.effectiveRequest().workAreas ?? []).length > 1);

  /**
   * One Safe Work spanning every area, or one per area — the operator's call, not ours.
   *
   * <p>Nothing in a Safe Work is location-bound, so one covering the whole job is usually right and
   * is the default. But areas with very different standing hazards can warrant separate permits, and
   * only the person issuing them knows which case this is.
   */
  splitSafeWorkPerArea = signal(false);

  safeWorks: Signal<SafeWorkDto[]> = computed(() => {
    const wr = this.effectiveRequest();
    const areas = wr.workAreas ?? [];
    if (this.safeWorkInput?.() || !this.splitSafeWorkPerArea() || areas.length < 2) {
      return [this.safeWork()];
    }
    return areas.map(area => {
      const dto = SafeWorkDto.generatePermitFromRequest(wr, this.areaDtoFor(area), this.categoryProfile());
      dto.location = area.name;
      (dto as any).workArea = this.areaDtoFor(area);
      return dto;
    });
  });

  /**
   * The full WorkAreaDto for a declared area, so a generated permit is seeded from — and persists
   * against — its OWN area rather than the request's primary one.
   *
   * <p>Falls back to the primary when the area is not among the loaded ones, which is better than a
   * null FK: the permit still lands somewhere real and an operator can correct it.
   */
  private areaDtoFor(area: { id: number | null; name: string }): WorkAreaDto | null {
    const loaded = this.workAreaOptions().find(a => a.id === area.id);
    return loaded ?? this.workRequest().workArea ?? null;
  }

  /*
   * The permit form components take a Signal, not a value — they were written when there was
   * exactly one of each. Wrapping each element keeps that contract intact rather than changing
   * three shared form components and every other place that uses them.
   */
  safeWorkAt(i: number): Signal<SafeWorkDto> { return this.slotAt(this.safeWorkSlots, i, () => this.safeWorks()[i]); }
  hotWorkAt(i: number): Signal<HotWorkDto> { return this.slotAt(this.hotWorkSlots, i, () => this.hotWorks()[i]); }
  confinedSpaceAt(i: number): Signal<ConfinedSpaceDto> { return this.slotAt(this.confinedSpaceSlots, i, () => this.confinedSpaces()[i]); }

  private safeWorkSlots = new Map<number, Signal<SafeWorkDto>>();
  private hotWorkSlots = new Map<number, Signal<HotWorkDto>>();
  private confinedSpaceSlots = new Map<number, Signal<ConfinedSpaceDto>>();

  /**
   * A STABLE signal per index that re-reads its list.
   *
   * <p>Returning `computed(() => value)` from a template-called method looked simpler and was
   * wrong twice over: it mints a fresh signal on every change detection pass, and it captures a
   * value rather than tracking one — so a child bound to slot 0 kept showing the first permit
   * generated even after the request or the asynchronously-loaded category profile changed. One
   * signal per slot, created once and reading through to the current list, keeps the reactivity the
   * single-permit version had.
   */
  private slotAt<T>(cache: Map<number, Signal<T>>, i: number, read: () => T): Signal<T> {
    let slot = cache.get(i);
    if (!slot) {
      slot = computed(read);
      cache.set(i, slot);
    }
    return slot;
  }

  isSafeWorkVisible = true;
  isConfinedSpaceVisible = true;
  isHotWorkVisible = true;
  isWorkRequestVisible = true;

  packageName: string = '';
  packageId: string = '';
  safeWorkIds: number[] = [];
  hotWorkIds: number[] = [];
  confinedSpaceIds: number[] = [];

  constructor() {
    effect(() => {
      this.packageName = this.workRequest().workScope ?? '';
    });
    // Fetch category profile when work category changes
    effect(() => {
      const categoryId = this.workRequest().workCategory?.id;
      if (categoryId) {
        this.categoryProfileApi.getByWorkCategoryId(categoryId).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe(profile => this.categoryProfile.set(profile));
      } else {
        this.categoryProfile.set(null);
      }
    });
  }

  onSubmitPackage() {
    if (!this.workRequest || !this.packageName) {
      console.error('Work request or package name is missing.');
      return;
    }

    const permitPackage = new DailyPermitPackageDto({
      name: this.packageName,
      // workRequests: [this.workRequest()],
      // safeWorks: [this.safeWork()],
      // hotWorks: [this.hotWork()],
      // confinedSpaces: [this.confinedSpace()],
      lotos: [],
      safeWorkIds: this.safeWorkIds,
      hotWorkIds: this.hotWorkIds,
      confinedSpaceIds: this.confinedSpaceIds
    });

    if (this.formSubmit.observed) {
      this.formSubmit.emit(permitPackage);
    } else {
      this.currentDailyPermitPackage.createDailyPermitPackage(permitPackage).subscribe({
        next: (response) => {
          console.log('Permit package created successfully', response);
          this.packageId = response.responseData.id.toString();
        },
        error: (err) => {
          console.error('Error creating permit package', err);
        }
      });
    }
  }

  onSumbitSafeWork(sw: SafeWorkDto) {
    this.currentSafeWorkService.createSafeWork(sw).subscribe({
      next: (response) => {
        console.log('Safe work created successfully', response);
        this.safeWorkIds.push(response.responseData.id);
      },
      error: (err) => {
        console.error('Error creating safe work', err);
      }
    });
  }

  onSumbitHotWork(hw: HotWorkDto) {
    this.currentHotWorkService.createHotWork(hw).subscribe({
      next: (response) => {
        console.log('Hot work created successfully', response);
        this.hotWorkIds.push(response.responseData.id);
      },
      error: (err) => {
        console.error('Error creating hot work', err);
      }
    });
  }

  onSumbitConfinedSpace(cs: ConfinedSpaceDto) {
    this.currentConfinedSpaceService.createConfinedSpace(cs).subscribe({
      next: (response) => {
        console.log('Confined space created successfully', response);
        this.confinedSpaceIds.push(response.responseData.id);
      },
      error: (err) => {
        console.error('Error creating confined space', err);
      }
    });
  }

  build(){
    this.dailyPermitPackage.buildPermitsById(this.packageId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (permits) => {
        console.log('Permits built successfully', permits.responseData);
      },
      error: (err) => {
        console.error('Error building permits', err);
      }
    })
  }

  toggleSafeWorkVisibility(): void {
    this.isSafeWorkVisible = !this.isSafeWorkVisible;
  }

  toggleConfinedSpaceVisibility(): void {
    this.isConfinedSpaceVisible = !this.isConfinedSpaceVisible;
  }

  toggleHotWorkVisibility(): void {
    this.isHotWorkVisible = !this.isHotWorkVisible;
  }

  toggleWorkRequestVisibility(): void {
    this.isWorkRequestVisible = !this.isWorkRequestVisible;
  }

}