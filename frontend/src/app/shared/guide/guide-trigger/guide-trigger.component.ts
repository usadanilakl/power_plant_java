import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WizardStackService, WizardFlowType } from '../guide-form';

@Component({
  selector: 'app-guide-trigger',
  standalone: true,
  imports: [
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  template: `
    @if (!wizardService.isActive()) {
      <button
        mat-icon-button
        [matMenuTriggerFor]="guideMenu"
        matTooltip="Start Guide"
        class="guide-trigger-btn"
      >
        <mat-icon>auto_fix_high</mat-icon>
      </button>
      <mat-menu #guideMenu="matMenu">
        <button mat-menu-item (click)="startGuide('build-standard')">
          <mat-icon>playlist_add</mat-icon>
          <span>Build LOTO Standard</span>
        </button>
        <button mat-menu-item (click)="startGuide('add-loto-point')">
          <mat-icon>add_location</mat-icon>
          <span>Add LOTO Point</span>
        </button>
        <button mat-menu-item (click)="startGuide('upload-file')">
          <mat-icon>upload_file</mat-icon>
          <span>Upload File</span>
        </button>
      </mat-menu>
    }
  `,
  styles: [`
    .guide-trigger-btn {
      color: inherit;
    }
  `],
})
export class GuideTriggerComponent {
  wizardService = inject(WizardStackService);

  startGuide(action: WizardFlowType): void {
    this.wizardService.startOrResume(action);
  }
}
