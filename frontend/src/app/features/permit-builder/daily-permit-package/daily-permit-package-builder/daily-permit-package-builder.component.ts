import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { CurrentDailyPermitPackageService } from '../../../../services/current-items-services/current-daily-permit-package.service';
import { SafeWorkDto } from '../../../../models/permits/safe-work.model';
import { HotWorkDto } from '../../../../models/permits/hot-work.model';
import { ConfinedSpaceDto } from '../../../../models/permits/confined-space.model';
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
import { TableComponent as SharedTableComponent } from '../../../../shared/table/table.component';
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

@Component({
  selector: 'app-daily-permit-package-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, ItemCarouselComponent, WorkRequestDisplayComponent, PopupProjectionComponent, WorkRequestTableComponent, WorkRequestFormComponent, SafeWorkFormComponent, HotWorkFormComponent, ConfinedSpaceFormComponent, SafeWorkTableComponent, HotWorkTableComponent, ConfinedSpaceTableComponent, SafeWorkPaperFormComponent, HotWorkPaperFormComponent, ConfinedSpacePaperFormComponent, LotoDetailFormComponent, LotoTableComponent, LotoPaperFormComponent, SharedTableComponent, RfReactiveFormComponent, EnergizedWorkPermitTableComponent, ExcavationPermitTableComponent, VentingPermitTableComponent, EnergizedWorkPermitPaperFormComponent, ExcavationPermitPaperFormComponent, VentingPermitPaperFormComponent],
  templateUrl: './daily-permit-package-builder.component.html',
  styleUrl: './daily-permit-package-builder.component.css'
})
export class DailyPermitPackageBuilderComponent {
  currentDailyPermitPackageService = inject(CurrentDailyPermitPackageService);
  destroyRef = inject(DestroyRef);

  currentPackage = this.currentDailyPermitPackageService.currentDailyPacksge;

  requests = this.currentDailyPermitPackageService.requests;
  requestCount = this.currentDailyPermitPackageService.requestCount;

  safeWorks = this.currentDailyPermitPackageService.safeWorks;
  safeWorkCount = this.currentDailyPermitPackageService.safeWorkCount;
  emptySafeWorksExists = this.currentDailyPermitPackageService.emptySafeWorksExists;

  hotWorks = this.currentDailyPermitPackageService.hotWorks;
  hotWorkCount = this.currentDailyPermitPackageService.hotWorkCount;
  emptyHotWorksExists = this.currentDailyPermitPackageService.emptyConfinedSpacesExists;

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

  // Static field definitions for RF form components
  energizedWorkPermitFields = EnergizedWorkPermitDto.toFormFields(new EnergizedWorkPermitDto()) as RfFormField[];
  excavationPermitFields = ExcavationPermitDto.toFormFields(new ExcavationPermitDto()) as RfFormField[];
  ventingPermitFields = VentingPermitDto.toFormFields(new VentingPermitDto()) as RfFormField[];

  // Status lifecycle
  packageStatus = this.currentDailyPermitPackageService.packageStatus;
  isEditable = this.currentDailyPermitPackageService.isEditable;
  isReadOnly = this.currentDailyPermitPackageService.isReadOnly;


  popupTitle: string = '';
  isPopupVisible = false;
  isPopupStepOne = true;
  isAttachingExisting = false;

  isReusePermitsPopupVisible = false;
  reissueColumns = DailyPermitPackageDto.toTableColumns(['id', 'name', 'permitNumber']);


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

  handlePopupStepOne(existing: boolean) {
    this.isAttachingExisting = existing;
    this.isPopupStepOne = false;
  }

  closePopup() {
    this.isPopupVisible = false;
    this.popupTitle = '';
    this.isPopupStepOne = true;
  }

  attachExisting(item: any, permitType: string){
    const ids = [item.id];
    this.currentDailyPermitPackageService.addNewAttachments(ids, permitType);
    this.closePopup();
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


  /***************************************************************************
   * Permit Functions
   **************************************************************************/

  addWorkRequest(request: WorkRequestDto = new WorkRequestDto()  ) {
    this.currentDailyPermitPackageService.createAndAttachWorkRequestsToPackage([request]);
  }
  addSafeWork($event: SafeWorkDto  = new SafeWorkDto()  ) {
    this.currentDailyPermitPackageService.createAndAttachSafeWorksToPackage([$event]);
  }
  addHotWork($event: HotWorkDto = new HotWorkDto()) {
    this.currentDailyPermitPackageService.createAndAttachHotWorksToPackage([$event]);
  }
  addConfinedSpace($event: ConfinedSpaceDto = new ConfinedSpaceDto()) {
    this.currentDailyPermitPackageService.createAndAttachConfinedSpacesToPackage([$event]);
  }

  addLoto($event: LotoDto = new LotoDto()) {
    this.currentDailyPermitPackageService.createAndAttachLotosToPackage([$event]);
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
    this.currentDailyPermitPackageService.closePackage();
    this.isClosurePopupOpen = false;
    if (!this.closureWorkCompleted) {
      this.isReissueAfterClosePromptOpen = true;
    }
  }

  isReissueAfterClosePromptOpen = false;

  confirmReissueAfterClose(): void {
    this.reusePermitsPopupOpen();
    this.isReissueAfterClosePromptOpen = false;
  }

  dismissReissuePrompt(): void {
    this.isReissueAfterClosePromptOpen = false;
  }
}
