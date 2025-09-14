import { Component, Input, computed, Signal, signal, inject, DestroyRef, effect, output, Output, EventEmitter } from '@angular/core';
import { WorkRequestDisplayComponent } from "../../work-request/work-request-display/work-request-display.component";
import { SafeWorkFormComponent } from "../../safe-work/safe-work-form/safe-work-form.component";
import { WorkRequestDto } from '../../../../models/permits/work-request.model';
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

@Component({
  selector: 'app-daily-permit-package-form',
  standalone: true,
  imports: [WorkRequestDisplayComponent, SafeWorkFormComponent, HotWorkFormComponent, ConfinedSpaceFormComponent, FormsModule],
  templateUrl: './daily-permit-package-form.component.html',
  styleUrl: './daily-permit-package-form.component.css'
})
export class DailyPermitPackageFormComponent {
  private currentDailyPermitPackage = inject(CurrentDailyPermitPackageService);
  private dailyPermitPackage = inject(DailyPermitPackageService);
  private currentSafeWorkService = inject(CurrentSafeWorkService);
  private currentHotWorkService = inject(CurrentHotWorkService);
  private currentConfinedSpaceService = inject(CurrentConfinedSpaceService);
  private destroyRef = inject(DestroyRef);


  @Input() workRequest: Signal<WorkRequestDto> = signal<WorkRequestDto>(new WorkRequestDto());
  
  @Input() safeWorkInput?: Signal<SafeWorkDto>;
  @Input() hotWorkInput?: Signal<HotWorkDto>;
  @Input() confinedSpaceInput?: Signal<ConfinedSpaceDto>;

  @Output() formSubmit = new EventEmitter<DailyPermitPackageDto>();

  safeWork: Signal<SafeWorkDto> = computed(() => 
    this.safeWorkInput?.() ?? SafeWorkDto.generatePermitFromRequest(this.workRequest())
  );

  hotWork: Signal<HotWorkDto> = computed(() => 
    this.hotWorkInput?.() ?? HotWorkDto.generatePermitFromRequest(this.workRequest())
  );

  confinedSpace: Signal<ConfinedSpaceDto> = computed(() => 
    this.confinedSpaceInput?.() ?? ConfinedSpaceDto.generatePermitFromRequest(this.workRequest())
  );

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