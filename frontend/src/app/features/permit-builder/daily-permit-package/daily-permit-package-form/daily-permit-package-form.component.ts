import { Component, Input, computed, Signal, signal } from '@angular/core';
import { WorkRequestDisplayComponent } from "../../work-request/work-request-display/work-request-display.component";
import { SafeWorkFormComponent } from "../../safe-work/safe-work-form/safe-work-form.component";
import { WorkRequestDto } from '../../../../models/permits/work-request.model';
import { SafeWorkDto } from '../../../../models/permits/safe-work.model';
import { HotWorkDto } from '../../../../models/permits/hot-work.model';
import { ConfinedSpaceDto } from '../../../../models/permits/confined-space.model';
import { HotWorkFormComponent } from "../../hot-work/hot-work-form/hot-work-form.component";
import { ConfinedSpaceFormComponent } from "../../confined-space/confined-space-form/confined-space-form.component";

@Component({
  selector: 'app-daily-permit-package-form',
  standalone: true,
  imports: [WorkRequestDisplayComponent, SafeWorkFormComponent, HotWorkFormComponent, ConfinedSpaceFormComponent],
  templateUrl: './daily-permit-package-form.component.html',
  styleUrl: './daily-permit-package-form.component.css'
})
export class DailyPermitPackageFormComponent {
  @Input() workRequest: Signal<WorkRequestDto> = signal<WorkRequestDto>(new WorkRequestDto());
  
  @Input() safeWorkInput?: Signal<SafeWorkDto>;
  @Input() hotWorkInput?: Signal<HotWorkDto>;
  @Input() confinedSpaceInput?: Signal<ConfinedSpaceDto>;

  safeWork: Signal<SafeWorkDto> = computed(() => 
    this.safeWorkInput?.() ?? SafeWorkDto.generatePermitFromRequest(this.workRequest())
  );

  hotWork: Signal<HotWorkDto> = computed(() => 
    this.hotWorkInput?.() ?? HotWorkDto.generatePermitFromRequest(this.workRequest())
  );

  confinedSpace: Signal<ConfinedSpaceDto> = computed(() => 
    this.confinedSpaceInput?.() ?? ConfinedSpaceDto.generatePermitFromRequest(this.workRequest())
  );
}