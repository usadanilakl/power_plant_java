import { Component, Input, input, Signal, signal } from '@angular/core';
import { WorkRequestDisplayComponent } from "../../work-request/work-request-display/work-request-display.component";
import { SafeWorkFormComponent } from "../../safe-work/safe-work-form/safe-work-form.component";
import { WorkRequestDto } from '../../../../models/permits/work-request.model';
import { SafeWorkDto } from '../../../../models/permits/safe-work.model';

@Component({
  selector: 'app-daily-permit-package-form',
  imports: [WorkRequestDisplayComponent, SafeWorkFormComponent],
  templateUrl: './daily-permit-package-form.component.html',
  styleUrl: './daily-permit-package-form.component.css'
})
export class DailyPermitPackageFormComponent {
  @Input() workRequest: Signal<WorkRequestDto> = signal<WorkRequestDto>(new WorkRequestDto());
  @Input() safeWork: Signal<SafeWorkDto> = signal<SafeWorkDto>(new SafeWorkDto());

}
