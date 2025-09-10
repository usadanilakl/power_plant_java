import { Component, Input, signal, Signal } from '@angular/core';
import { WorkRequestDto } from '../../../../models/permits/work-request.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-work-request-display',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './work-request-display.component.html',
  styleUrl: './work-request-display.component.css'
})
export class WorkRequestDisplayComponent {
  @Input() workRequest: Signal<WorkRequestDto> = signal<WorkRequestDto>(new WorkRequestDto());

  // Helper method to safely access properties
  getProperty(key: keyof WorkRequestDto): any {
    return this.workRequest() ? this.workRequest()[key] : null;
  }

}
