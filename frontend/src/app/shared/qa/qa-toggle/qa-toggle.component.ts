import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { QaService } from '../../../services/qa/qa.service';

@Component({
  selector: 'app-qa-toggle',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <button
      mat-icon-button
      (click)="qaService.toggleQaMode()"
      [matTooltip]="qaService.isQaMode() ? 'Disable Help Mode' : 'Enable Help Mode'"
      class="qa-toggle-btn"
      [class.qa-active]="qaService.isQaMode()"
    >
      <mat-icon>{{ qaService.isQaMode() ? 'help' : 'help_outline' }}</mat-icon>
    </button>
  `,
  styles: [`
    .qa-toggle-btn {
      color: inherit;
    }
    .qa-toggle-btn.qa-active {
      color: var(--primary-color, #1976d2);
      background-color: var(--primary-light, rgba(25, 118, 210, 0.12));
      border-radius: 50%;
    }
  `]
})
export class QaToggleComponent {
  qaService = inject(QaService);
}
