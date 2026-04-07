import { Component, computed, DestroyRef, effect, inject, Input, OnInit, signal, TemplateRef, viewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CurrentDailyPermitPackageService } from '../../../../services/current-items-services/current-daily-permit-package.service';
import { SafeWorkDto, SwHazards } from '../../../../models/permits/safe-work.model';
import { HotWorkDto, HotWorkMeasures } from '../../../../models/permits/hot-work.model';
import { ConfinedSpaceDto, ConfinedSpaceHazards } from '../../../../models/permits/confined-space.model';
import { WorkRequestDto } from '../../../../models/permits/work-request.model';
import { FormsModule } from '@angular/forms';
import { ItemCarouselComponent } from "../../../../shared/item-carousel/item-carousel.component";
import { WorkRequestDisplayComponent } from "../../work-request/work-request-display/work-request-display.component";
import { PopupProjectionComponent } from "../../../../shared/popup-projection/popup-projection.component";
import { WorkRequestTableComponent } from "../../work-request/work-request-table/work-request-table.component";
import { WorkRequestFormComponent } from "../../work-request/work-request-form/work-request-form.component";
import { SafeWorkFormComponent } from "../../safe-work/safe-work-form/safe-work-form.component";
import { HotWorkFormComponent } from "../../hot-work/hot-work-form/hot-work-form.component";
import { ConfinedSpaceFormComponent } from "../../confined-space/confined-space-form/confined-space-form.component";
import { SafeWorkTableComponent } from "../../safe-work/safe-work-table/safe-work-table.component";
import { HotWorkTableComponent } from "../../hot-work/hot-work-table/hot-work-table.component";
import { ConfinedSpaceTableComponent } from "../../confined-space/confined-space-table/confined-space-table.component";
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { SafeWorkPaperFormComponent } from '../../safe-work/safe-work-paper-form/safe-work-paper-form.component';
import { HotWorkPaperFormComponent } from "../../hot-work/hot-work-paper-form/hot-work-paper-form.component";
import { ConfinedSpacePaperFormComponent } from "../../confined-space/confined-space-paper-form/confined-space-paper-form.component";
import { LotoDetailFormComponent } from "../../../loto/loto-detail-form/loto-detail-form.component";
import { LotoDto } from '../../../../models/loto/loto.model';
import { LotoTableComponent } from "../../../loto/loto-table/loto-table.component";
import { LotoPaperFormComponent } from "../../../loto/loto-paper-form/loto-paper-form.component";
import { DailyPermitPackageDto } from '../../../../models/permits/dailt-permit-package.model';
import { TableComponent } from '../../../../shared/table/refactored/table.component';
import { EnergizedWorkPermitDto } from '../../../../models/permits/energized-work-permit.model';
import { ExcavationPermitDto } from '../../../../models/permits/excavation-permit.model';
import { VentingPermitDto } from '../../../../models/permits/venting-permit.model';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { EnergizedWorkPermitTableComponent } from "../../energized-work-permit/energized-work-permit-table/energized-work-permit-table.component";
import { ExcavationPermitTableComponent } from "../../excavation-permit/excavation-permit-table/excavation-permit-table.component";
import { VentingPermitTableComponent } from "../../venting-permit/venting-permit-table/venting-permit-table.component";
import { EnergizedWorkPermitPaperFormComponent } from "../../energized-work-permit/energized-work-permit-paper-form/energized-work-permit-paper-form.component";
import { ExcavationPermitPaperFormComponent } from "../../excavation-permit/excavation-permit-paper-form/excavation-permit-paper-form.component";
import { VentingPermitPaperFormComponent } from "../../venting-permit/venting-permit-paper-form/venting-permit-paper-form.component";
import { RfFormField } from '../../../../models/ui/form-field.model';
import { JobLogService } from '../../../../services/permits/job-log.service';
import { Router } from '@angular/router';
import { JobLogDto } from '../../../../models/permits/job-log.model';
import { RedTagProgressPanelComponent } from '../../../../shared/automation/red-tag-progress-panel/red-tag-progress-panel.component';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { Column } from '../../../../models/column.model';
import { TableSelectionService } from '../../../../shared/table/refactored/services/table-selection.service';
import { TableDragService } from '../../../../shared/table/refactored/services/table-drag.service';
import { TableStateService } from '../../../../shared/table/refactored/services/table-state.service';
import { TableSearchService } from '../../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../../shared/table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../shared/table/refactored/services/table-sync.service';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../../shared/table/refactored/services/table-controls.service';
import { TableDataService } from '../../../../shared/table/refactored/services/table-data.service';
import { RfWorkRequestStateService } from '../../work-request/refactored/services/rf-work-request-state.service';
import { PopupWindowService } from '../../../../shared/popup-window/popup-window.service';
import { PersonnelPanelComponent } from '../personnel-panel/personnel-panel.component';
import { LotoService } from '../../../../services/loto/loto.service';

@Component({
  selector: 'app-daily-permit-package-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, ItemCarouselComponent, WorkRequestDisplayComponent, PopupProjectionComponent, WorkRequestTableComponent, WorkRequestFormComponent, SafeWorkFormComponent, HotWorkFormComponent, ConfinedSpaceFormComponent, SafeWorkTableComponent, HotWorkTableComponent, ConfinedSpaceTableComponent, SafeWorkPaperFormComponent, HotWorkPaperFormComponent, ConfinedSpacePaperFormComponent, LotoDetailFormComponent, LotoTableComponent, LotoPaperFormComponent, TableComponent, RfReactiveFormComponent, EnergizedWorkPermitTableComponent, ExcavationPermitTableComponent, VentingPermitTableComponent, EnergizedWorkPermitPaperFormComponent, ExcavationPermitPaperFormComponent, VentingPermitPaperFormComponent, RedTagProgressPanelComponent, PersonnelPanelComponent],
  providers: [
    TableSelectionService,
    TableStateService,
    TableDragService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    TableClickService,
    TableControlsService,
    TableDataService,
  ],
  templateUrl: './daily-permit-package-builder.component.html',
  styleUrl: './daily-permit-package-builder.component.css'
})
export class DailyPermitPackageBuilderComponent implements OnInit {
  private readonly headerCollapseBreakpointPx = 1400;
  currentDailyPermitPackageService = inject(CurrentDailyPermitPackageService);
  private jobLogService = inject(JobLogService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private workRequestStateService = inject(RfWorkRequestStateService);
  private popupWindowService = inject(PopupWindowService);
  destroyRef = inject(DestroyRef);
  private readonly lotoStandardApiUrl = '/ng/loto-standards';

  // Reissue from WR context menu inputs
  @Input() reissueFromWrId: number | null = null;
  @Input() reissueInitialScope: string = '';
  @Input() reissueInitialDate: string = '';
  @Input() reissueInitialLocation: string = '';
  // Reissue from processed WR inputs
  @Input() reissueProcessedWrId: number | null = null;
  @Input() reissueSourcePackageId: number | null = null;

  // Reissue-from-WR dialog state
  isReissueFromWrOpen = false;
  reissueWrScope = '';
  reissueWrDate = '';
  reissueWrLocation = '';
  reissueWrSearchResults = signal<any[]>([]);
  reissueWrSearching = false;

  // Reissue processed WR dialog state
  isReissueProcessedWrOpen = false;
  reissueProcessedWrAlsoReissueWr = false;
  reissueProcessedWrDate = new Date().toISOString().split('T')[0];
  reissueProcessedWrTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  // Reissue from package builder (two-step: date/time → select)
  reissueDate = new Date().toISOString().split('T')[0];
  reissueTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  applyAllDate = this.reissueDate;
  applyAllTime = this.reissueTime;
  isHeaderCollapsed = signal(false);

  currentPackage = this.currentDailyPermitPackageService.currentDailyPacksge;
  parentJob = signal<JobLogDto | null>(null);

  requests = this.currentDailyPermitPackageService.requests;
  requestCount = this.currentDailyPermitPackageService.requestCount;

  safeWorks = this.currentDailyPermitPackageService.safeWorks;
  safeWorkCount = this.currentDailyPermitPackageService.safeWorkCount;
  emptySafeWorksExists = this.currentDailyPermitPackageService.emptySafeWorksExists;

  hotWorks = this.currentDailyPermitPackageService.hotWorks;
  hotWorkCount = this.currentDailyPermitPackageService.hotWorkCount;
  emptyHotWorksExists = this.currentDailyPermitPackageService.emptyHotWorksExists;

  confinedSpaces = this.currentDailyPermitPackageService.confinedSpaces;
  confinedSpaceCount = this.currentDailyPermitPackageService.confinedSpaceCount;
  emptyConfinedSpacesExists = this.currentDailyPermitPackageService.emptyConfinedSpacesExists;

  lotos = this.currentDailyPermitPackageService.lotos;
  lotoCount = this.currentDailyPermitPackageService.lotoCount;

  energizedWorkPermits = this.currentDailyPermitPackageService.energizedWorkPermits;
  energizedWorkPermitCount = this.currentDailyPermitPackageService.energizedWorkPermitCount;

  excavationPermits = this.currentDailyPermitPackageService.excavationPermits;
  excavationPermitCount = this.currentDailyPermitPackageService.excavationPermitCount;

  ventingPermits = this.currentDailyPermitPackageService.ventingPermits;
  ventingPermitCount = this.currentDailyPermitPackageService.ventingPermitCount;

  personnelSignedOnCount = computed(() =>
    (this.currentPackage().personnel || []).filter(e => !e.signOffTime).length
  );

  // Static field definitions for RF form components
  energizedWorkPermitFields = EnergizedWorkPermitDto.toFormFields(new EnergizedWorkPermitDto()) as RfFormField[];
  excavationPermitFields = ExcavationPermitDto.toFormFields(new ExcavationPermitDto()) as RfFormField[];
  ventingPermitFields = VentingPermitDto.toFormFields(new VentingPermitDto()) as RfFormField[];

  // Status lifecycle
  packageStatus = this.currentDailyPermitPackageService.packageStatus;
  isEditable = this.currentDailyPermitPackageService.isEditable;
  isReadOnly = this.currentDailyPermitPackageService.isReadOnly;

  // LOTO suggestions from WorkArea
  lotoSuggestions = signal<{ existingLotos: any[]; suggestedStandards: any[] } | null>(null);
  hasLotoSuggestion = computed(() => {
    const s = this.lotoSuggestions();
    return s && (s.existingLotos.length > 0 || s.suggestedStandards.length > 0);
  });

  // LOTO chip picker state
  private lotoService = inject(LotoService);
  lotoSubTab = signal<'detail' | 'select'>('detail');
  availableLotos = signal<LotoDto[]>([]);
  lotoChipSearch = signal('');
  availableLotosGrouped = computed(() => {
    const search = this.lotoChipSearch().toLowerCase().trim();
    const all = search
      ? this.availableLotos().filter(l => {
          const haystack = [l.name, l.equipmentSystem, l.workScope, l.sourceStandardName, l.boxNumber?.toString()].join(' ').toLowerCase();
          return haystack.includes(search);
        })
      : this.availableLotos();
    const packageLotoIds = new Set(this.lotos().map(l => l.id));
    type EnrichedLoto = LotoDto & { inPackage: boolean; chipDescription: string };
    const groups: { label: string; lotos: EnrichedLoto[] }[] = [];
    const buckets: Record<string, EnrichedLoto[]> = { 'U1': [], 'U2': [], 'BOP': [], 'Other': [] };
    for (const loto of all) {
      const searchText = [loto.name, loto.equipmentSystem, loto.workScope, loto.sourceStandardName].join(' ').toUpperCase();
      const desc = loto.workScope || loto.sourceStandardName || loto.equipmentSystem || loto.name || '';
      const enriched = Object.assign(Object.create(Object.getPrototypeOf(loto)), loto, {
        inPackage: packageLotoIds.has(loto.id),
        chipDescription: desc
      }) as EnrichedLoto;
      if (/\bU1\b|UNIT\s*1\b/.test(searchText)) buckets['U1'].push(enriched);
      else if (/\bU2\b|UNIT\s*2\b/.test(searchText)) buckets['U2'].push(enriched);
      else if (/\bBOP\b|BALANCE\s*OF\s*PLANT\b/.test(searchText)) buckets['BOP'].push(enriched);
      else buckets['Other'].push(enriched);
    }
    for (const label of ['U1', 'U2', 'BOP', 'Other']) {
      if (buckets[label].length > 0) groups.push({ label, lotos: buckets[label] });
    }
    return groups;
  });

  popupTitle: string = '';
  isPopupVisible = false;
  isPopupStepOne = true;
  isAttachingExisting = false;

  // Multi-select LOTOs for attach existing
  selectedLotosForAttach = signal<any[]>([]);

  isReusePermitsPopupVisible = false;
  reissueActionCell = viewChild.required<TemplateRef<{ $implicit: DailyPermitPackageDto; column: Column }>>('reissueActionCell');
  reissueColumns = computed<Column[]>(() => {
    const columns = DailyPermitPackageDto.toTableColumns([
      'permitNumber',
      'name',
      'companyName',
      'personName',
      'date',
      'time',
    ]);

    return [
      columns[0],
      columns[1],
      {
        id: 'location',
        header: 'Location',
        accessorFn: (item: DailyPermitPackageDto) => this.getPackageLocation(item),
      },
      ...columns.slice(2),
      {
        id: 'reissueAction',
        header: 'Action',
        template: this.reissueActionCell(),
        width: 140,
      },
    ];
  });


  // Tab-based layout
  activeTab = signal<string>('workRequests');
  pinnedTabs = signal<string[]>([]);
  panelCount = computed(() => this.pinnedTabs().length + 1);

  permitTabs = computed(() => [
    { key: 'workRequests', label: 'WR', count: this.requestCount() },
    { key: 'safeWorks', label: 'Safe Work', count: this.safeWorkCount() },
    { key: 'hotWorks', label: 'Hot Work', count: this.hotWorkCount() },
    { key: 'confinedSpaces', label: 'Confined Space', count: this.confinedSpaceCount() },
    { key: 'lotos', label: 'LOTO', count: this.lotoCount() },
    { key: 'energizedWork', label: 'Energized', count: this.energizedWorkPermitCount() },
    { key: 'excavation', label: 'Excavation', count: this.excavationPermitCount() },
    { key: 'venting', label: 'Venting', count: this.ventingPermitCount() },
    { key: 'personnel', label: 'Personnel', count: this.personnelSignedOnCount() },
  ]);

  selectTab(tab: string) {
    if (this.pinnedTabs().includes(tab)) return;
    this.activeTab.set(tab);
  }

  togglePin(tab: string) {
    if (this.pinnedTabs().includes(tab)) {
      this.pinnedTabs.update(pins => pins.filter(p => p !== tab));
    } else if (this.pinnedTabs().length < 3) {
      this.pinnedTabs.update(pins => [...pins, tab]);
      if (tab === this.activeTab()) {
        const nextTab = this.permitTabs().find(t => t.key !== tab && !this.pinnedTabs().includes(t.key));
        if (nextTab) this.activeTab.set(nextTab.key);
      }
    }
  }

  // Paper form popup visibility (separate from main tab view)
  isSafeWorkVisible = true;
  isConfinedSpaceVisible = true;
  isHotWorkVisible = true;
  isWorkRequestVisible = true;
  isLotoVisible = true;
  isEnergizedWorkVisible = true;
  isExcavationVisible = true;
  isVentingVisible = true;
  isModificationsVisible = false;

  packageName: string = '';
  companyName: string = '';
  private fieldUpdate = new Subject<{ field: keyof DailyPermitPackageDto, value: any }>();
  private headerMediaQuery?: MediaQueryList;
  private headerMediaQueryListener?: (event: MediaQueryListEvent) => void;
  
  // private packageNameUpdate = new Subject<string>();
  // private packageNameSubscription: Subscription;


  // constructor() {
  //   effect(() => {
  //     this.packageName = this.currentPackage().name;});
  //     this.packageNameSubscription = this.packageNameUpdate.pipe(
  //     takeUntilDestroyed(this.destroyRef), // Cancel the subscription when the component is destroyed
  //     debounceTime(500), // Wait for 500ms pause in events
  //     distinctUntilChanged() // Only emit if value has changed
  //   ).subscribe(() => {
  //     this.onSubmitPackage();
  //   });
  // }

  // // This method will be called on every keystroke
  // onPackageNameChange(): void {
  //   this.packageNameUpdate.next(this.packageName);
  // }  
  constructor() {
    this.fieldUpdate.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(500),
      distinctUntilChanged((prev, curr) => prev.value === curr.value && prev.field === curr.field)
    ).subscribe(({ field, value }) => {
      this.updatePackageProperty(field, value);
    });

    effect(() => {
      const pkg = this.currentPackage();
      this.applyAllDate = pkg?.date || new Date().toISOString().split('T')[0];
      this.applyAllTime = pkg?.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      if (pkg?.id) {
        this.jobLogService.getByPackageId(pkg.id.toString()).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
          const job = response?.responseData ? JobLogDto.fromJson(response.responseData) : null;
          this.parentJob.set(job);
          // Load LOTO suggestions if WorkArea has constant LOTOs
          if (job?.workArea?.constantLotoIds?.length) {
            this.http.get<any>(`/ng/daily-permit-packages/loto-suggestions/${job.workArea.id}`).pipe(
              takeUntilDestroyed(this.destroyRef)
            ).subscribe({
              next: res => this.lotoSuggestions.set(res.responseData),
              error: () => this.lotoSuggestions.set(null)
            });
          }
        });
      } else {
        this.parentJob.set(null);
      }
    });
  }

  ngOnInit(): void {
    this.initializeHeaderCollapseMode();
    // If navigated from processed WR "Reissue", open date/time picker
    if (this.reissueProcessedWrId && this.reissueSourcePackageId) {
      this.isReissueProcessedWrOpen = true;
    }
    // If navigated from WR context menu "Reissue", open the reissue dialog
    else if (this.reissueFromWrId) {
      this.reissueWrScope = this.reissueInitialScope;
      this.reissueWrDate = this.reissueInitialDate;
      this.reissueWrLocation = this.reissueInitialLocation;
      this.isReissueFromWrOpen = true;
      this.searchPackagesForReissue();
    }

    this.destroyRef.onDestroy(() => {
      if (this.headerMediaQuery && this.headerMediaQueryListener) {
        this.headerMediaQuery.removeEventListener('change', this.headerMediaQueryListener);
      }
    });
  }

  searchPackagesForReissue(): void {
    this.reissueWrSearching = true;
    const params: any = {};
    if (this.reissueWrScope) params.scope = this.reissueWrScope;
    if (this.reissueWrDate) params.date = this.reissueWrDate;
    if (this.reissueWrLocation) params.location = this.reissueWrLocation;

    this.http.get<any>('/ng/daily-permit-packages/search', { params }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        this.reissueWrSearchResults.set(res.responseData ?? []);
        this.reissueWrSearching = false;
      },
      error: () => {
        this.reissueWrSearchResults.set([]);
        this.reissueWrSearching = false;
      }
    });
  }

  confirmReissueFromWr(sourcePackage: any): void {
    if (!this.reissueFromWrId || !sourcePackage?.id) return;

    this.http.post<any>(`/ng/daily-permit-packages/reissue-from/${sourcePackage.id}/for-wr/${this.reissueFromWrId}`, {
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        if (res?.responseData) {
          const newPkg = new DailyPermitPackageDto(res.responseData);
          this.popupWindowService.openOrFocus(
            `${window.location.origin}/app/permit-builder/daily-packages?packageId=${newPkg.id}&mode=popup`
          );
          if (this.reissueFromWrId != null) {
            this.workRequestStateService.refreshWorkRequest(
              this.reissueFromWrId,
              'Work request reissued and marked as Processed'
            );
          }
          this.isReissueFromWrOpen = false;
          this.router.navigate(['/permit-builder/work-requests']);
        }
      },
      error: err => console.error('Reissue from WR failed:', err)
    });
  }

  confirmReissueProcessedWr(): void {
    if (!this.reissueSourcePackageId) return;
    const body = { date: this.reissueProcessedWrDate, time: this.reissueProcessedWrTime };

    if (this.reissueProcessedWrAlsoReissueWr && this.reissueProcessedWrId) {
      // Reissue package AND re-attach the WR
      this.http.post<any>(
        `/ng/daily-permit-packages/reissue-from/${this.reissueSourcePackageId}/for-wr/${this.reissueProcessedWrId}`,
        body
      ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: res => {
          if (res?.responseData) {
            const newPkg = new DailyPermitPackageDto(res.responseData);
            this.popupWindowService.openOrFocus(
              `${window.location.origin}/app/permit-builder/daily-packages?packageId=${newPkg.id}&mode=popup`
            );
            this.workRequestStateService.refreshWorkRequest(
              this.reissueProcessedWrId!,
              'Package reissued with work request'
            );
          }
          this.isReissueProcessedWrOpen = false;
          this.router.navigate(['/permit-builder/work-requests']);
        },
        error: err => console.error('Reissue processed WR failed:', err)
      });
    } else {
      // Reissue package only (WR stays on the original package)
      const bodyWithSkip = { ...body, skipWorkRequests: 'true' };
      this.http.post<any>(
        `/ng/daily-permit-packages/${this.reissueSourcePackageId}/reissue`,
        bodyWithSkip
      ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: res => {
          if (res?.responseData) {
            const newPkg = new DailyPermitPackageDto(res.responseData);
            this.popupWindowService.openOrFocus(
              `${window.location.origin}/app/permit-builder/daily-packages?packageId=${newPkg.id}&mode=popup`
            );
          }
          this.isReissueProcessedWrOpen = false;
          this.router.navigate(['/permit-builder/work-requests']);
        },
        error: err => console.error('Reissue package failed:', err)
      });
    }
  }

  onFieldChange(field: keyof DailyPermitPackageDto, value: any): void {
    this.fieldUpdate.next({ field, value });
  }

  updatePackageProperty(field: keyof DailyPermitPackageDto, value: any) {
    const current = this.currentPackage();
    if (field === 'name' && !value) {
      return;
    }
    
    const updatedPackage = { ...current, [field]: value };
    this.currentDailyPermitPackageService.updateCurrentDailyPacksge(new DailyPermitPackageDto(updatedPackage));
  }


  onSubmitPackage() {
    if (!this.packageName) {
      return;
    }
    const current = this.currentPackage()
    current.name = this.packageName;
    this.currentDailyPermitPackageService.updateCurrentDailyPacksge(current);
  }
  onDeletePackage() {
    this.currentDailyPermitPackageService.deleteCurrentDailyPacksge();
  }

  toggleHeaderCollapsed(): void {
    this.isHeaderCollapsed.update(value => !value);
  }

  applyDateTimeToAllPermits(): void {
    if (!this.currentPackage().id || !this.applyAllDate) {
      return;
    }

    this.currentDailyPermitPackageService.applyDateTimeToAllPermits(
      this.applyAllDate,
      this.applyAllTime
    );
  }

  buildInRedTag(permit: any, type: string) {
    if(permit!== null && permit.id != null && type!=null){
      this.currentDailyPermitPackageService.build(type, permit.id);
    }
  }
  
  attachNew(permitType: string) {
    if (permitType === 'Safe Work') {
      this.popupTitle = 'Safe Work';
      this.isPopupVisible = true;
    }
    if (permitType === 'Confined Space') {
      this.popupTitle = 'Confined Space';
      this.isPopupVisible = true;
    }
    if (permitType === 'Hot Work') {
      this.popupTitle = 'Hot Work';
      this.isPopupVisible = true;
    }
    if (permitType === 'Work Request') {
      this.popupTitle = 'Work Request';
      this.isPopupVisible = true;
    }
    if (permitType === 'LOTO') {
      this.popupTitle = 'LOTO';
      this.isPopupVisible = true;
    }
    if (permitType === 'Energized Work Permit') {
      this.popupTitle = 'Energized Work Permit';
      this.isPopupVisible = true;
    }
    if (permitType === 'Excavation Permit') {
      this.popupTitle = 'Excavation Permit';
      this.isPopupVisible = true;
    }
    if (permitType === 'Venting Permit') {
      this.popupTitle = 'Venting Permit';
      this.isPopupVisible = true;
    }
  }

  createLotoFromSuggestedStandard(standardSummary: { id: number; name?: string; description?: string }): void {
    if (!standardSummary?.id) {
      return;
    }

    this.http.get<any>(`${this.lotoStandardApiUrl}/${standardSummary.id}`).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        const standard = LotoStandardDto.fromJson(res?.responseData);
        const loto = new LotoDto({
          name: standard.name ?? '',
          equipmentSystem: standard.name ?? standardSummary.name ?? '',
          lotoRequestor: this.currentPackage().personName ?? '',
          date: this.currentPackage().date ?? new Date().toISOString().split('T')[0],
          lotoPoints: (standard.lotoPoints ?? []).map(point => new LotoPointDto(point))
        });

        this.addLoto(loto);
      },
      error: err => {
        console.error('Failed to create LOTO from suggested standard:', err);
        this.attachNew('LOTO');
      }
    });
  }

  handlePopupStepOne(existing: boolean) {
    this.isAttachingExisting = existing;
    this.isPopupStepOne = false;
  }

  closePopup() {
    this.isPopupVisible = false;
    this.popupTitle = '';
    this.isPopupStepOne = true;
    this.selectedLotosForAttach.set([]);
  }

  attachExisting(item: any, permitType: string){
    const ids = [item.id];
    this.currentDailyPermitPackageService.addNewAttachments(ids, permitType);
    this.closePopup();
  }

  toggleLotoSelection(loto: any) {
    const current = this.selectedLotosForAttach();
    const exists = current.some(l => l.id === loto.id);
    if (exists) {
      this.selectedLotosForAttach.set(current.filter(l => l.id !== loto.id));
    } else {
      this.selectedLotosForAttach.set([...current, loto]);
    }
  }

  isLotoSelected(lotoId: number): boolean {
    return this.selectedLotosForAttach().some(l => l.id === lotoId);
  }

  attachSelectedLotos() {
    const ids = this.selectedLotosForAttach().map(l => l.id);
    if (ids.length > 0) {
      this.currentDailyPermitPackageService.addNewAttachments(ids, 'lotos');
    }
    this.selectedLotosForAttach.set([]);
    this.closePopup();
  }

  removeFromLotoSelection(lotoId: number) {
    this.selectedLotosForAttach.update(list => list.filter(l => l.id !== lotoId));
  }

  reusePermitsPopupOpen(){
    this.isReusePermitsPopupVisible = true;
  }

  reusePermitsPopupClose(){
    this.isReusePermitsPopupVisible = false;
  }

  reissuePermits(pckg: DailyPermitPackageDto){
    this.currentDailyPermitPackageService.reissuePermits(pckg);
    this.reusePermitsPopupClose();
  }

  reissuePermitsWithDate(pckg: DailyPermitPackageDto){
    this.currentDailyPermitPackageService.reissuePermitsWithDate(pckg, this.reissueDate, this.reissueTime);
    this.reusePermitsPopupClose();
  }

  getPackageLocation(pkg: DailyPermitPackageDto): string {
    const permit = pkg.workRequests?.[0] || pkg.safeWorks?.[0] || pkg.hotWorks?.[0] || pkg.confinedSpaces?.[0];
    return ((permit as any)?.location || '').toString();
  }

  getPackageWorkScope(pkg: DailyPermitPackageDto): string {
    const permit = pkg.workRequests?.[0] || pkg.safeWorks?.[0] || pkg.hotWorks?.[0] || pkg.confinedSpaces?.[0];
    const scope = ((permit as any)?.workScope || pkg.name || '').toString().trim();
    return scope.length > 60 ? `${scope.substring(0, 60)}...` : scope;
  }

  confirmCurrentPackageReissue(): void {
    this.currentDailyPermitPackageService.reissueCurrentPackageWithDate(this.reissueDate, this.reissueTime);
    this.reusePermitsPopupClose();
  }

  selectReissueSource(pckg: DailyPermitPackageDto, event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.confirmReissueFromWr(pckg);
  }


  /***************************************************************************
   * Permit Functions
   **************************************************************************/

  addWorkRequest(request: WorkRequestDto = new WorkRequestDto()  ) {
    this.currentDailyPermitPackageService.createAndAttachWorkRequestsToPackage([request]);
  }
  addSafeWork($event: SafeWorkDto  = new SafeWorkDto()  ) {
    // Pre-populate constant hazards from WorkArea if adding a new empty permit
    const wa = this.parentJob()?.workArea;
    if (!$event.id && wa?.constantHazards) {
      $event.hazards = new SwHazards({ ...$event.hazards, ...wa.constantHazards });
    }
    this.currentDailyPermitPackageService.createAndAttachSafeWorksToPackage([$event]);
  }
  addHotWork($event: HotWorkDto = new HotWorkDto()) {
    const wa = this.parentJob()?.workArea;
    if (!$event.id && wa?.constantHotWorkMeasures) {
      $event.measures = new HotWorkMeasures({ ...$event.measures, ...wa.constantHotWorkMeasures });
    }
    this.currentDailyPermitPackageService.createAndAttachHotWorksToPackage([$event]);
  }
  addConfinedSpace($event: ConfinedSpaceDto = new ConfinedSpaceDto()) {
    const wa = this.parentJob()?.workArea;
    if (!$event.id && wa?.constantConfinedSpaceHazards) {
      $event.hazards = new ConfinedSpaceHazards({ ...$event.hazards, ...wa.constantConfinedSpaceHazards });
    }
    this.currentDailyPermitPackageService.createAndAttachConfinedSpacesToPackage([$event]);
  }

  addLoto($event: LotoDto = new LotoDto()) {
    this.currentDailyPermitPackageService.createAndAttachLotosToPackage([$event]);
  }

  loadAvailableLotos(): void {
    this.lotoService.getActiveWithBox().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => this.availableLotos.set((res.responseData ?? []).map(l => LotoDto.fromJson(l))),
      error: () => this.availableLotos.set([])
    });
  }

  switchLotoSubTab(tab: 'detail' | 'select'): void {
    this.lotoSubTab.set(tab);
    if (tab === 'select' && this.availableLotos().length === 0) {
      this.loadAvailableLotos();
    }
  }

  toggleLotoInPackage(loto: LotoDto): void {
    const currentIds = this.lotos().map(l => l.id);
    if (currentIds.includes(loto.id)) {
      this.currentDailyPermitPackageService.removePermitFromPackageItem(loto, 'lotos');
    } else {
      this.currentDailyPermitPackageService.addNewAttachments([loto.id], 'lotos');
    }
  }

  isLotoInPackage(lotoId: number): boolean {
    return this.lotos().some(l => l.id === lotoId);
  }

  addEnergizedWorkPermit($event: EnergizedWorkPermitDto = new EnergizedWorkPermitDto()) {
    this.currentDailyPermitPackageService.createAndAttachEnergizedWorkPermitsToPackage([$event]);
  }
  addExcavationPermit($event: ExcavationPermitDto = new ExcavationPermitDto()) {
    this.currentDailyPermitPackageService.createAndAttachExcavationPermitsToPackage([$event]);
  }
  addVentingPermit($event: VentingPermitDto = new VentingPermitDto()) {
    this.currentDailyPermitPackageService.createAndAttachVentingPermitsToPackage([$event]);
  }


  /***************************************************************************
   * View Control Functions
   **************************************************************************/


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

  toggleLotoVisibility(): void {
    this.isLotoVisible =!this.isLotoVisible;
  }

  toggleEnergizedWorkVisibility(): void {
    this.isEnergizedWorkVisible = !this.isEnergizedWorkVisible;
  }

  toggleExcavationVisibility(): void {
    this.isExcavationVisible = !this.isExcavationVisible;
  }

  toggleVentingVisibility(): void {
    this.isVentingVisible = !this.isVentingVisible;
  }

  removeCurrentEnergizedWorkPermit(): void {
    const id = this.currentDailyPermitPackageService.currentEnergizedWorkPermit()?.id;
    if (id) this.currentDailyPermitPackageService.removeAttachment(id, 'energizedWorkPermits');
  }
  removeCurrentExcavationPermit(): void {
    const id = this.currentDailyPermitPackageService.currentExcavationPermit()?.id;
    if (id) this.currentDailyPermitPackageService.removeAttachment(id, 'excavationPermits');
  }
  removeCurrentVentingPermit(): void {
    const id = this.currentDailyPermitPackageService.currentVentingPermit()?.id;
    if (id) this.currentDailyPermitPackageService.removeAttachment(id, 'ventingPermits');
  }

  /***************************************************************************
   * Paper Form Functions
   **************************************************************************/

  isSnapshotPopupOpen = false;
  isPaperFormPopupOpen = false;
  isRedTagProgressOpen = false;
  parsedActivationSnapshot = computed(() => {
    const raw = this.currentPackage().activationSnapshotJson;
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  });

  openRedTagProgress(): void {
    this.isRedTagProgressOpen = true;
  }

  closeRedTagProgress(): void {
    this.isRedTagProgressOpen = false;
  }

  // Modification log filters
  modFilterAction = signal('');
  modFilterPermitType = signal('');
  filteredModifications = computed(() => {
    const mods = this.currentPackage().modifications || [];
    const actionFilter = this.modFilterAction();
    const typeFilter = this.modFilterPermitType();
    return mods.filter((mod: any) => {
      if (actionFilter && mod.action !== actionFilter) return false;
      if (typeFilter && mod.permitType !== typeFilter) return false;
      return true;
    }).reverse();
  });
  openPaperFormPopup(){
    this.isPaperFormPopupOpen = true;
  }
  closePaperFormPopup(){
    this.isPaperFormPopupOpen = false;
  }

  /***************************************************************************
   * Activation & Closure Workflow
   **************************************************************************/

  isActivationPopupOpen = false;
  activationValidationErrors = signal<string[]>([]);

  openActivationDialog(): void {
    const errors: string[] = [];
    const pkg = this.currentPackage();
    if (!pkg.name) errors.push('Package name is required');
    if (pkg.safeWorks.length === 0 && pkg.hotWorks.length === 0 &&
        pkg.confinedSpaces.length === 0 && pkg.energizedWorkPermits.length === 0 &&
        pkg.excavationPermits.length === 0 && pkg.ventingPermits.length === 0) {
      errors.push('At least one permit is required');
    }
    if (pkg.workRequests.length === 0) errors.push('At least one work request is required');
    this.activationValidationErrors.set(errors);
    this.isActivationPopupOpen = true;
  }

  confirmActivation(): void {
    this.currentDailyPermitPackageService.activatePackage();
    this.isActivationPopupOpen = false;
    this.activeTab.set('personnel');
  }

  onForemanSignOn(event: { personName: string; company: string }): void {
    this.currentDailyPermitPackageService.foremanSignOn(event);
  }

  onForemanCloseOut(event: { workCompleted: boolean; comments: string; scopeChanged: boolean; scopeDetails: string; continueDate: string; continueTime: string }): void {
    this.currentDailyPermitPackageService.foremanCloseOut(event);
  }

  onPersonnelSignOn(event: { personName: string; personRole: string; company: string }): void {
    this.currentDailyPermitPackageService.signOnPerson(event);
  }

  onPersonnelSignOff(event: { personName: string; comments: string }): void {
    this.currentDailyPermitPackageService.signOffPerson(event);
  }

  onGenerateContinuation(): void {
    this.currentDailyPermitPackageService.generateContinuation();
    this.isClosurePopupOpen = false;
  }

  closeAndGenerateContinuation(): void {
    this.currentDailyPermitPackageService.closeAndGenerateContinuation();
    this.isClosurePopupOpen = false;
  }

  getSignedOffWithComments(): any[] {
    return (this.currentPackage().personnel || [])
      .filter((e: any) => e.signOffTime && e.signOffComments && e.signOffComments.trim());
  }

  getStillSignedOnCount(): number {
    return (this.currentPackage().personnel || []).filter((e: any) => !e.signOffTime).length;
  }

  getSignedOffCount(): number {
    return (this.currentPackage().personnel || []).filter((e: any) => !!e.signOffTime).length;
  }

  isClosurePopupOpen = false;
  closureWorkCompleted = true;
  closureComments = '';
  closureScopeChanged = false;
  closureScopeDetails = '';
  closureContinueDate = '';

  openClosureDialog(): void {
    this.closureWorkCompleted = true;
    this.closureComments = '';
    this.closureScopeChanged = false;
    this.closureScopeDetails = '';
    this.closureContinueDate = '';
    this.isClosurePopupOpen = true;
  }

  confirmClosure(): void {
    // Close-out data already stored by foreman — just close the package
    this.currentDailyPermitPackageService.closePackage();
    this.isClosurePopupOpen = false;
  }

  isReissueAfterClosePromptOpen = false;

  confirmReissueAfterClose(): void {
    this.reusePermitsPopupOpen();
    this.isReissueAfterClosePromptOpen = false;
  }

  createContinuationWorkRequest(): void {
    this.isReissueAfterClosePromptOpen = false;
    // Navigate to WR form with context from the current job
    const job = this.parentJob();
    const queryParams: any = {};
    if (job?.workArea?.id) queryParams.workAreaId = job.workArea.id;
    if (job?.workCategory?.name) queryParams.workCategory = job.workCategory.name;
    if (job?.id) queryParams.jobId = job.id;
    this.router.navigate(['/permit-builder/work-requests'], { queryParams });
  }

  dismissReissuePrompt(): void {
    this.isReissueAfterClosePromptOpen = false;
  }

  goToParentJob(): void {
    const job = this.parentJob();
    if (job?.id) {
      this.router.navigate(['/permit-builder/jobs'], { queryParams: { jobId: job.id } });
    }
  }

  private initializeHeaderCollapseMode(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      this.isHeaderCollapsed.set(false);
      return;
    }

    this.headerMediaQuery = window.matchMedia(`(max-width: ${this.headerCollapseBreakpointPx}px)`);
    this.isHeaderCollapsed.set(this.headerMediaQuery.matches);

    this.headerMediaQueryListener = (event: MediaQueryListEvent) => {
      this.isHeaderCollapsed.set(event.matches);
    };

    this.headerMediaQuery.addEventListener('change', this.headerMediaQueryListener);
  }
}
