import { Component, computed, inject } from '@angular/core';
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

@Component({
  selector: 'app-daily-permit-package-builder',
  standalone: true,
  imports: [FormsModule, ItemCarouselComponent, WorkRequestDisplayComponent, PopupProjectionComponent, WorkRequestTableComponent, WorkRequestFormComponent, SafeWorkFormComponent, HotWorkFormComponent, ConfinedSpaceFormComponent, SafeWorkTableComponent],
  templateUrl: './daily-permit-package-builder.component.html',
  styleUrl: './daily-permit-package-builder.component.css'
})
export class DailyPermitPackageBuilderComponent {
  currentDailyPermitPackageService = inject(CurrentDailyPermitPackageService);

  currentPackage = this.currentDailyPermitPackageService.currentDailyPacksge;

  requests = computed<WorkRequestDto[]>(() => this.currentPackage().workRequests);
  requestCount = computed(() => this.requests.length);

  safeWorks = computed<SafeWorkDto[]>(() => this.currentPackage().safeWorks);
  safeWorkCount = computed(() => this.safeWorks.length);

  hotWorks = computed<HotWorkDto[]>(() => this.currentPackage().hotWorks);
  hotWorkCount = computed(() => this.hotWorks.length);

  confinedSpaces = computed<ConfinedSpaceDto[]>(() => this.currentPackage().confinedSpaces);
  confinedSpaceCount = computed(() => this.confinedSpaces.length);

  popupTitle: string = '';
  isPopupVisible = false;
  isPopupStepOne = true;
  isAttachingExisting = false;

  isSafeWorkVisible = true;
  isConfinedSpaceVisible = true;
  isHotWorkVisible = true;
  isWorkRequestVisible = true;

  packageName: string = '';




  onSubmitPackage() {
    
  }

  build(){
    
  }  
  attachNew(permitType: string) {
    if (permitType === 'Safe Work') {}
    if (permitType === 'Confined Space') {}
    if (permitType === 'Hot Work') {}
    if (permitType === 'Work Request') {
      this.popupTitle = 'Work Request';
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


  /***************************************************************************
   * Permit Functions
   **************************************************************************/

  addWorkRequest(request: WorkRequestDto) {
    this.currentDailyPermitPackageService.createAndAttachWorkRequestsToPackage([request]);
  }
  addSafeWork($event: SafeWorkDto) {
    this.currentDailyPermitPackageService.createAndAttachSafeWorksToPackage([$event]);
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
}
