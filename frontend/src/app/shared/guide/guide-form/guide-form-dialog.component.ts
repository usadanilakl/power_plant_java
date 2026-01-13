import { Component, inject, signal, computed, HostListener, DestroyRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GuideFormService } from './guide-form.service';
import { GuideWelcomeStepComponent } from './steps/guide-welcome-step.component';
import { GuideFileSelectStepComponent } from './steps/guide-file-select-step.component';
import { GuideFormStepComponent } from './steps/guide-form-step.component';
import { GuideReviewStepComponent } from './steps/guide-review-step.component';
import { GuideCompleteStepComponent } from './steps/guide-complete-step.component';
import { RfFileApiService } from '../../../features/files/refactored/services/rf-file-api.service';
import { CurrentFileService } from '../../../services/current-file.service';
import { GlobalMessageService } from '../../global-message/global-message.service';
import { FileDto } from '../../../models/file/file.model';
import { GuideAction } from './guide-form.types';
import { GuideFileSelectorStepComponent } from './steps/guide-file-selector-step.component';
import { GuideFileViewerStepComponent } from './steps/guide-file-viewer-step.component';
import { GuideLotoFormStepComponent } from './steps/guide-loto-form-step.component';
import { GuideTutorialStepComponent } from './steps/guide-tutorial-step.component';
import { GuideLotoReviewStepComponent } from './steps/guide-loto-review-step.component';

@Component({
  selector: 'app-guide-form-dialog',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    CdkDrag,
    CdkDragHandle,
    GuideWelcomeStepComponent,
    GuideFileSelectStepComponent,
    GuideFormStepComponent,
    GuideReviewStepComponent,
    GuideCompleteStepComponent,
    GuideFileSelectorStepComponent,
    GuideFileViewerStepComponent,
    GuideLotoFormStepComponent,
    GuideTutorialStepComponent,
    GuideLotoReviewStepComponent,
  ],
  template: `
    @if (guideService.isActive()) {
      <div
        class="guide-form-dialog"
        [class.minimized]="guideService.isMinimized()"
        cdkDrag
        cdkDragBoundary="body"
      >
        <!-- Header -->
        <div class="dialog-header" cdkDragHandle>
          <div class="header-left">
            @if (guideService.currentFlow()?.icon) {
              <mat-icon class="flow-icon">{{ guideService.currentFlow()?.icon }}</mat-icon>
            }
            <span class="flow-name">{{ guideService.currentFlow()?.name }}</span>
          </div>
          <div class="header-actions">
            <button
              mat-icon-button
              class="header-btn"
              (click)="guideService.toggleMinimize()"
              [matTooltip]="guideService.isMinimized() ? 'Expand' : 'Minimize'"
            >
              <mat-icon>{{ guideService.isMinimized() ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
            <button
              mat-icon-button
              class="header-btn close-btn"
              (click)="onClose()"
              matTooltip="Close Guide"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>

        @if (!guideService.isMinimized()) {
          <!-- Progress Bar -->
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="guideService.progress()"></div>
          </div>

          <!-- Step Content -->
          <div class="dialog-content">
            @switch (guideService.currentStep()?.type) {
              @case ('welcome') {
                <app-guide-welcome-step
                  [step]="guideService.currentStep()!"
                  (onStart)="onNext()"
                />
              }
              @case ('file-select') {
                <app-guide-file-select-step
                  [step]="guideService.currentStep()!"
                  (fileSelected)="onFileSelected($event)"
                />
              }
              @case ('file-selector') {
                <app-guide-file-selector-step
                  [step]="guideService.currentStep()!"
                  (fileSelected)="onExistingFileSelected($event)"
                  (onUploadNew)="onUploadNewFile()"
                />
              }
              @case ('file-viewer') {
                <app-guide-file-viewer-step
                  [step]="guideService.currentStep()!"
                  [state]="guideService.state()!"
                  (onOpenViewer)="onOpenFileViewer()"
                  (onSkip)="onNext()"
                />
              }
              @case ('loto-form') {
                <app-guide-loto-form-step
                  [step]="guideService.currentStep()!"
                  [state]="guideService.state()!"
                  (onOpenForm)="onOpenLotoForm()"
                />
              }
              @case ('tutorial') {
                <app-guide-tutorial-step
                  [step]="guideService.currentStep()!"
                  [state]="guideService.state()!"
                  (onValueChange)="onTutorialValueChange($event)"
                  (onSkip)="onNext()"
                  (onComplete)="onNext()"
                />
              }
              @case ('form') {
                <app-guide-form-step
                  [step]="guideService.currentStep()!"
                  [initialData]="guideService.state()?.collectedData || {}"
                  [selectedFileName]="selectedFileName()"
                  (formChange)="onFormChange($event)"
                />
              }
              @case ('review') {
                <app-guide-review-step
                  [step]="guideService.currentStep()!"
                  [state]="guideService.state()!"
                  [isSubmitting]="isSubmitting()"
                  [error]="submitError()"
                />
              }
              @case ('complete') {
                <app-guide-complete-step
                  [step]="guideService.currentStep()!"
                  [currentAction]="guideService.state()!.action"
                  (onDone)="onComplete()"
                  (onNextAction)="onStartNextAction($event)"
                />
              }
            }
          </div>

          <!-- Footer -->
          @if (!isWelcomeOrComplete()) {
            <div class="dialog-footer">
              <div class="footer-left">
                @if (guideService.canGoBack()) {
                  <button
                    mat-button
                    class="footer-btn back-btn"
                    (click)="onBack()"
                    [disabled]="isSubmitting()"
                  >
                    <mat-icon>arrow_back</mat-icon>
                    Back
                  </button>
                }
              </div>
              <div class="footer-center">
                <span class="step-indicator">
                  Step {{ guideService.currentStepIndex() + 1 }} of {{ guideService.totalSteps() }}
                </span>
              </div>
              <div class="footer-right">
                @if (guideService.currentStep()?.type === 'review') {
                  <button
                    mat-flat-button
                    color="primary"
                    class="footer-btn submit-btn"
                    (click)="onSubmit()"
                    [disabled]="isSubmitting()"
                  >
                    @if (isSubmitting()) {
                      <div class="btn-spinner"></div>
                    } @else {
                      <mat-icon>cloud_upload</mat-icon>
                    }
                    {{ isSubmitting() ? 'Uploading...' : 'Upload' }}
                  </button>
                } @else if (guideService.canGoNext()) {
                  <button
                    mat-flat-button
                    color="primary"
                    class="footer-btn next-btn"
                    (click)="onNext()"
                    [disabled]="!canProceed()"
                  >
                    Next
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                }
              </div>
            </div>
          }
        }
      </div>
    }
  `,
  styles: [
    `
      .guide-form-dialog {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 400px;
        max-width: calc(100vw - 48px);
        max-height: calc(100vh - 48px);
        background: var(--surface-color, #ffffff);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .guide-form-dialog.minimized {
        width: auto;
        min-width: 220px;
        max-height: none;
      }

      .dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 8px 12px 16px;
        background: var(--primary-color, #1976d2);
        color: white;
        cursor: move;
        flex-shrink: 0;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .flow-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .flow-name {
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 2px;
      }

      .header-btn {
        width: 32px;
        height: 32px;
        line-height: 32px;
        color: rgba(255, 255, 255, 0.9);
      }

      .header-btn:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
      }

      .header-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .close-btn:hover {
        background: rgba(255, 0, 0, 0.2);
      }

      .progress-bar {
        height: 4px;
        background: var(--border-color, #e0e0e0);
        flex-shrink: 0;
      }

      .progress-fill {
        height: 100%;
        background: var(--success-color, #4caf50);
        transition: width 0.3s ease;
      }

      .dialog-content {
        flex: 1;
        overflow-y: auto;
        min-height: 200px;
        max-height: 60vh;
      }

      .dialog-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-top: 1px solid var(--border-color, #e0e0e0);
        background: var(--surface-color, #ffffff);
        flex-shrink: 0;
      }

      .footer-left,
      .footer-center,
      .footer-right {
        display: flex;
        align-items: center;
      }

      .footer-left {
        flex: 1;
        justify-content: flex-start;
      }

      .footer-center {
        flex: 1;
        justify-content: center;
      }

      .footer-right {
        flex: 1;
        justify-content: flex-end;
      }

      .step-indicator {
        font-size: 12px;
        color: var(--text-tertiary, #999);
      }

      .footer-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
      }

      .footer-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .back-btn {
        color: var(--text-secondary, #666);
      }

      .next-btn mat-icon,
      .submit-btn mat-icon {
        margin-left: 4px;
      }

      .back-btn mat-icon {
        margin-right: 4px;
        margin-left: 0;
      }

      .btn-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: 8px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Mobile responsiveness */
      @media (max-width: 480px) {
        .guide-form-dialog {
          bottom: 0;
          right: 0;
          left: 0;
          width: auto;
          max-width: none;
          border-radius: 16px 16px 0 0;
        }
      }
    `,
  ],
})
export class GuideFormDialogComponent {
  guideService = inject(GuideFormService);
  private fileApiService = inject(RfFileApiService);
  private currentFileService = inject(CurrentFileService);
  private messageService = inject(GlobalMessageService);
  private destroyRef = inject(DestroyRef);

  // Local state
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);
  private currentFormData = signal<Record<string, any>>({});
  private selectedFile = signal<File | null>(null);

  selectedFileName = computed(() => this.selectedFile()?.name || '');

  isWelcomeOrComplete(): boolean {
    const type = this.guideService.currentStep()?.type;
    return type === 'welcome' || type === 'complete';
  }

  canProceed(): boolean {
    const step = this.guideService.currentStep();
    if (!step) return false;

    switch (step.type) {
      case 'file-select':
        return this.selectedFile() !== null;
      case 'file-selector':
        return this.guideService.state()?.selectedFileDto !== null;
      case 'file-viewer':
      case 'loto-form':
        // These steps have their own actions, proceed is always available
        return true;
      case 'form':
        // Basic check - form component handles detailed validation
        return true;
      default:
        return true;
    }
  }

  onFileSelected(file: File): void {
    this.selectedFile.set(file);
    this.guideService.setSelectedFile(file);
  }

  onExistingFileSelected(file: FileDto): void {
    this.guideService.setSelectedFileDto({
      id: file.id,
      name: file.name,
      fileType: file.fileType?.name
    });
    this.guideService.next();
  }

  onUploadNewFile(): void {
    // Cancel current flow and start upload-file flow
    this.guideService.cancel();
    this.resetLocalState();
    this.guideService.start('upload-file');
  }

  onOpenFileViewer(): void {
    // Navigate to file viewer and minimize guide
    const state = this.guideService.state();
    if (state?.selectedFileDto) {
      // Create a minimal FileDto to pass to setCurrentFile
      const fileDto = new FileDto({ id: state.selectedFileDto.id, name: state.selectedFileDto.name });
      this.currentFileService.setCurrentFile(fileDto);
    }
    this.guideService.minimize();
    // Move to next step (loto form)
    this.guideService.next();
  }

  onOpenLotoForm(): void {
    // The loto form step component handles opening the form
    // Just minimize the guide so user can interact with the form
    this.guideService.minimize();
  }

  onTutorialValueChange(event: { field: string; value: any }): void {
    // Update the LOTO point data in the guide service
    this.guideService.updateLotoPointData(event.field, event.value);
  }

  onFormChange(data: Record<string, any>): void {
    this.currentFormData.set(data);
    this.guideService.updateData(data);
  }

  onNext(): void {
    const step = this.guideService.currentStep();

    if (step?.type === 'form') {
      // Save form data before advancing
      this.guideService.next(this.currentFormData());
    } else {
      this.guideService.next();
    }
  }

  onBack(): void {
    this.guideService.back();
  }

  onSubmit(): void {
    const state = this.guideService.state();
    if (!state) return;

    const file = state.selectedFile;
    if (!file) {
      this.submitError.set('No file selected');
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const collectedData = state.collectedData;

    // Build file DTO
    const fileDto = new FileDto({
      name: collectedData['name'] || '',
      fileType: collectedData['fileType'],
      fileNumber: collectedData['fileNumber'] || [],
      vendor: collectedData['vendor'],
      isVerified: collectedData['isVerified'] === 'true' || collectedData['isVerified'] === true,
    });

    // Build FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileDto', new Blob([JSON.stringify(fileDto.toIdModel())], {
      type: 'application/json'
    }));
    formData.append('overrideFile', 'false');

    // Upload using API service with proper subscription
    this.fileApiService.uploadFile(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          const savedFile = new FileDto(response.responseData);

          // Refresh the file menu to show the new file
          this.currentFileService.refreshFiles();

          // Show success message
          this.messageService.showSuccess('File uploaded successfully');

          // Move to complete step
          this.guideService.next();
        },
        error: (error) => {
          this.isSubmitting.set(false);
          const errorMsg = error?.error?.message || error?.message || 'Failed to upload file';
          this.submitError.set(errorMsg);
          this.messageService.showError(`Upload failed: ${errorMsg}`);
        }
      });
  }

  onComplete(): void {
    this.guideService.complete();
    this.resetLocalState();
  }

  onStartNextAction(action: GuideAction): void {
    this.guideService.complete();
    this.resetLocalState();
    // Start new guide flow
    this.guideService.start(action);
  }

  onClose(): void {
    if (this.guideService.currentStep()?.type === 'complete') {
      // If on complete step, just close
      this.guideService.complete();
    } else {
      // Ask for confirmation
      if (confirm('Are you sure you want to close? Your progress will be saved.')) {
        this.guideService.cancel();
      }
    }
    this.resetLocalState();
  }

  private resetLocalState(): void {
    this.selectedFile.set(null);
    this.currentFormData.set({});
    this.isSubmitting.set(false);
    this.submitError.set(null);
  }

  // Keyboard shortcuts
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.guideService.isActive() && !this.guideService.isMinimized()) {
      this.guideService.minimize();
    }
  }
}
