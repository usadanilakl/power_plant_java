import { Component, inject, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { GuideFormStep, GuideFormState } from '../guide-form.types';
import { GuideHintsPanelComponent } from './guide-hints-panel.component';
import { CurrentFileService } from '../../../../services/current-file.service';
import { FileDto } from '../../../../models/file/file.model';

@Component({
  selector: 'app-guide-file-viewer-step',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, GuideHintsPanelComponent],
  template: `
    <div class="file-viewer-step">
      <h3 class="step-title">{{ step().title }}</h3>
      <p class="step-description">{{ step().description }}</p>

      <!-- Selected File Info -->
      @if (state().selectedFileDto) {
        <div class="selected-file-card">
          <div class="file-icon">
            <mat-icon>description</mat-icon>
          </div>
          <div class="file-info">
            <span class="file-name">{{ state().selectedFileDto?.name }}</span>
            <span class="file-type">{{ state().selectedFileDto?.fileType || 'File' }}</span>
          </div>
        </div>
      }

      <!-- Action -->
      <div class="action-section">
        <p class="action-description">
          Click the button below to open the file viewer. The guide will minimize while you work.
          When you're done marking the location, click the guide button to continue.
        </p>

        <button
          mat-flat-button
          color="primary"
          class="open-viewer-btn"
          (click)="openFileViewer()"
        >
          <mat-icon>open_in_new</mat-icon>
          Open File Viewer
        </button>
      </div>

      @if (step().hints && step().hints!.length > 0) {
        <app-guide-hints-panel [hints]="step().hints!" [compact]="true" />
      }

      <!-- Skip Option -->
      <div class="skip-section">
        <button mat-button color="primary" (click)="onSkip.emit()">
          Skip this step (mark location later)
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .file-viewer-step {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .step-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary, #333);
      }

      .step-description {
        margin: 0;
        font-size: 14px;
        color: var(--text-secondary, #666);
      }

      .selected-file-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--surface-alt, #f5f5f5);
        border-radius: 8px;
        border: 1px solid var(--border-color, #e0e0e0);
      }

      .file-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        background: var(--primary-light, #e3f2fd);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .file-icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: var(--primary-color, #1976d2);
      }

      .file-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .file-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary, #333);
      }

      .file-type {
        font-size: 12px;
        color: var(--text-tertiary, #999);
      }

      .action-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        background: var(--info-bg, #e3f2fd);
        border-radius: 8px;
      }

      .action-description {
        margin: 0;
        font-size: 13px;
        color: var(--text-secondary, #666);
        line-height: 1.5;
      }

      .open-viewer-btn {
        align-self: flex-start;
      }

      .open-viewer-btn mat-icon {
        margin-right: 8px;
      }

      .skip-section {
        display: flex;
        justify-content: center;
        padding-top: 8px;
        border-top: 1px solid var(--border-light, #f0f0f0);
      }
    `,
  ],
})
export class GuideFileViewerStepComponent {
  private currentFileService = inject(CurrentFileService);

  step = input.required<GuideFormStep>();
  state = input.required<GuideFormState>();

  onOpenViewer = output<void>();
  onSkip = output<void>();

  openFileViewer(): void {
    const fileDto = this.state().selectedFileDto;
    if (fileDto) {
      // Create a minimal FileDto to set as current file
      const file = new FileDto({
        id: fileDto.id,
        name: fileDto.name,
      });
      this.currentFileService.setCurrentFile(file);
    }
    this.onOpenViewer.emit();
  }
}
