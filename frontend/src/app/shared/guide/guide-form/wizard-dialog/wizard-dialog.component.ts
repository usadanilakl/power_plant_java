import {
  Component,
  inject,
  computed,
  signal,
  HostListener,
  OnInit,
  OnDestroy,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

import { WizardStackService } from '../services/wizard-stack.service';
import { WizardStepRendererComponent } from './wizard-step-renderer.component';
import { WizardBreadcrumbComponent } from './wizard-breadcrumb.component';
import { WizardBranchRequest, StepDataPayload, WizardEntityData } from '../wizard-stack.types';
import { RfLotoStandardApiService } from '../../../../features/loto-standard/refactored/services/rf-loto-standard-api.service';
import { RfLotoPointApiService } from '../../../../features/loto-points/refactored/services/rf-loto-point-api.service';
import { RfValueApiService } from '../../../../features/values/refactored/services/rf-value-api.service';
import { RfFileApiService } from '../../../../features/files/refactored/services/rf-file-api.service';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { ValueDto } from '../../../../models/value.model';
import { FileDto } from '../../../../models/file/file.model';

@Component({
  selector: 'app-wizard-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
    CdkDrag,
    CdkDragHandle,
    WizardStepRendererComponent,
    WizardBreadcrumbComponent,
  ],
  template: `
    @if (wizardService.isActive()) {
      <div
        class="wizard-overlay"
        [class.minimized]="wizardService.isMinimized()"
      >
        <div
          class="wizard-dialog"
          [class.is-branch]="wizardService.isBranch()"
          cdkDrag
          cdkDragBoundary=".wizard-overlay"
          [cdkDragDisabled]="wizardService.isMinimized()"
        >
          <!-- Header with drag handle -->
          <div class="dialog-header" cdkDragHandle>
            <div class="header-content">
              <!-- Breadcrumb for branches -->
              @if (wizardService.isBranch()) {
                <app-wizard-breadcrumb
                  [trail]="wizardService.breadcrumbTrail()"
                  (navigateBack)="onCancelBranch()"
                />
              }

              <div class="header-title">
                @if (wizardService.currentFlow()?.icon) {
                  <mat-icon class="flow-icon">{{ wizardService.currentFlow()?.icon }}</mat-icon>
                }
                <span class="flow-name">{{ wizardService.currentFlow()?.name }}</span>
              </div>
            </div>

            <div class="header-actions">
              <button
                mat-icon-button
                class="header-btn"
                (click)="wizardService.toggleMinimize()"
                [matTooltip]="wizardService.isMinimized() ? 'Expand' : 'Minimize'"
              >
                <mat-icon>{{ wizardService.isMinimized() ? 'open_in_full' : 'minimize' }}</mat-icon>
              </button>
              <button
                mat-icon-button
                class="header-btn close-btn"
                (click)="onClose()"
                matTooltip="Close"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>

          @if (!wizardService.isMinimized()) {
            <!-- Progress Bar -->
            <div class="progress-container">
              <mat-progress-bar
                mode="determinate"
                [value]="wizardService.progress()"
                [class.branch-progress]="wizardService.isBranch()"
              ></mat-progress-bar>
              <span class="step-counter">
                Step {{ wizardService.currentStepIndex() + 1 }} of {{ wizardService.totalSteps() }}
              </span>
            </div>

            <!-- Step Content -->
            <div class="dialog-content">
              <app-wizard-step-renderer
                [step]="wizardService.currentStep()"
                [frame]="wizardService.currentFrame()"
                (stepDataChange)="onStepDataChange($event)"
                (branchRequest)="onBranchRequest($event)"
                (stepComplete)="onStepComplete($event)"
              />
            </div>

            <!-- Footer -->
            <div class="dialog-footer">
              <div class="footer-left">
                @if (wizardService.canGoBack()) {
                  <button
                    mat-stroked-button
                    (click)="onBack()"
                    class="back-btn"
                  >
                    <mat-icon>arrow_back</mat-icon>
                    {{ wizardService.isBranch() && wizardService.isFirstStep() ? 'Cancel' : 'Back' }}
                  </button>
                }
              </div>

              <div class="footer-right">
                @if (isCompleteStep()) {
                  <button
                    mat-flat-button
                    color="primary"
                    (click)="onFinish()"
                    [disabled]="isSubmitting()"
                  >
                    @if (isSubmitting()) {
                      <mat-icon class="spinning">sync</mat-icon>
                      Saving...
                    } @else {
                      <mat-icon>check</mat-icon>
                      Done
                    }
                  </button>
                } @else if (isReviewStep()) {
                  <button
                    mat-flat-button
                    color="primary"
                    (click)="onSubmit()"
                    [disabled]="isSubmitting()"
                  >
                    @if (isSubmitting()) {
                      <mat-icon class="spinning">sync</mat-icon>
                      Saving...
                    } @else {
                      <mat-icon>save</mat-icon>
                      {{ wizardService.isBranch() ? 'Save & Return' : 'Save' }}
                    }
                  </button>
                } @else if (isWelcomeStep()) {
                  <button
                    mat-flat-button
                    color="primary"
                    (click)="onNext()"
                  >
                    Get Started
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                } @else {
                  @if (wizardService.currentStep()?.isOptional) {
                    <button
                      mat-stroked-button
                      (click)="onSkip()"
                      class="skip-btn"
                    >
                      Skip
                    </button>
                  }
                  <button
                    mat-flat-button
                    color="primary"
                    (click)="onNext()"
                    [disabled]="!canProceed()"
                  >
                    Next
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                }
              </div>
            </div>
          } @else {
            <!-- Minimized state info -->
            <div class="minimized-info" (click)="wizardService.expand()">
              <span>{{ wizardService.currentStep()?.title }}</span>
              <mat-icon>expand_less</mat-icon>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .wizard-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .wizard-overlay.minimized {
      background: transparent;
      pointer-events: none;
    }

    .wizard-dialog {
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      width: 600px;
      max-width: 90vw;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      pointer-events: all;
    }

    .wizard-dialog.is-branch {
      border: 2px solid #1976d2;
    }

    .wizard-overlay.minimized .wizard-dialog {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: auto;
      max-width: 300px;
      max-height: auto;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      cursor: move;
    }

    .header-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .flow-icon {
      color: #1976d2;
    }

    .flow-name {
      font-weight: 500;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 4px;
    }

    .header-btn {
      width: 32px;
      height: 32px;
      line-height: 32px;
    }

    .header-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .close-btn:hover {
      color: #d32f2f;
    }

    .progress-container {
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fafafa;
    }

    mat-progress-bar {
      flex: 1;
      height: 6px;
      border-radius: 3px;
    }

    mat-progress-bar.branch-progress {
      --mdc-linear-progress-active-indicator-color: #1976d2;
    }

    .step-counter {
      font-size: 12px;
      color: #666;
      white-space: nowrap;
    }

    .dialog-content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      min-height: 300px;
    }

    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      background: #fafafa;
    }

    .footer-left, .footer-right {
      display: flex;
      gap: 8px;
    }

    .back-btn {
      color: #666;
    }

    .skip-btn {
      color: #666;
    }

    button mat-icon {
      margin-right: 4px;
    }

    .footer-right button mat-icon {
      margin-right: 4px;
      margin-left: 0;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .minimized-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      cursor: pointer;
      color: #666;
    }

    .minimized-info:hover {
      background: #f5f5f5;
    }
  `],
})
export class WizardDialogComponent implements OnInit, OnDestroy {
  wizardService = inject(WizardStackService);
  private lotoStandardApi = inject(RfLotoStandardApiService);
  private lotoPointApi = inject(RfLotoPointApiService);
  private valueApi = inject(RfValueApiService);
  private fileApi = inject(RfFileApiService);
  private destroyRef = inject(DestroyRef);

  isSubmitting = signal(false);
  submitError = signal<string | null>(null);
  pendingStepData = signal<Record<string, any>>({});
  savedEntityId = signal<number | null>(null);

  ngOnInit(): void {
    // Check for saved session on init
    if (this.wizardService.hasSavedSession() && !this.wizardService.isActive()) {
      // Could show a prompt to resume
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  // Step type checks
  isWelcomeStep = computed(() => this.wizardService.currentStep()?.type === 'welcome');
  isReviewStep = computed(() => this.wizardService.currentStep()?.type === 'review');
  isCompleteStep = computed(() => this.wizardService.currentStep()?.type === 'complete');

  canProceed = computed(() => {
    const step = this.wizardService.currentStep();
    if (!step) return false;

    // Welcome and complete steps always allow proceed
    if (step.type === 'welcome' || step.type === 'complete') return true;

    // Optional steps always allow proceed
    if (step.isOptional) return true;

    // Check if required fields are filled
    // This is a simplified check - real implementation would validate based on step config
    return true;
  });

  onStepDataChange(payload: StepDataPayload): void {
    this.wizardService.updateEntityData(payload);
  }

  onBranchRequest(request: WizardBranchRequest): void {
    this.wizardService.branch(request);
  }

  onStepComplete(result: any): void {
    // Step signaled completion (e.g., after dialog selection)
    this.wizardService.next(result);
  }

  onBack(): void {
    this.wizardService.back();
  }

  onNext(): void {
    const data = this.pendingStepData();
    this.wizardService.next(Object.keys(data).length > 0 ? data : undefined);
    this.pendingStepData.set({});
  }

  onSkip(): void {
    // Skip optional step
    this.wizardService.next();
  }

  async onSubmit(): Promise<void> {
    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      const frame = this.wizardService.currentFrame();
      if (!frame) throw new Error('No active frame');

      const flowType = frame.flow.type;
      const entityData = frame.entityData;

      // Call appropriate API service based on flow type
      switch (flowType) {
        case 'build-standard':
          await this.saveLotoStandard(entityData);
          break;
        case 'add-loto-point':
          await this.saveLotoPoint(entityData);
          break;
        case 'create-value':
          await this.saveValue(entityData);
          break;
        case 'upload-file':
          await this.saveFile(entityData);
          break;
        default:
          console.warn(`No save handler for flow type: ${flowType}`);
      }

      // Move to complete step
      this.wizardService.next();
    } catch (error: any) {
      console.error('Save error:', error);
      this.submitError.set(error.message || 'Failed to save');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onFinish(): void {
    if (this.wizardService.isBranch()) {
      // Complete branch and return result to parent
      const frame = this.wizardService.currentFrame();
      const entityData = frame?.entityData;

      // Include saved entity ID in the return data
      if (entityData && this.savedEntityId()) {
        // Determine which entity type to update with the ID
        if (entityData.lotoPoint) {
          entityData.lotoPoint.id = this.savedEntityId()!;
        } else if (entityData.value) {
          entityData.value.id = this.savedEntityId()!;
        } else if (entityData.file) {
          entityData.file.id = this.savedEntityId()!;
        } else if (entityData.lotoStandard) {
          entityData.lotoStandard.id = this.savedEntityId()!;
        }
      }

      this.wizardService.completeBranch(entityData);
      this.savedEntityId.set(null);
    } else {
      // Complete entire wizard
      this.wizardService.complete();
      this.savedEntityId.set(null);
    }
  }

  onCancelBranch(): void {
    if (confirm('Discard changes and return to previous step?')) {
      this.wizardService.cancelBranch();
    }
  }

  onClose(): void {
    if (this.wizardService.isBranch()) {
      this.onCancelBranch();
    } else {
      if (confirm('Close the wizard? Your progress will be saved and you can resume later.')) {
        this.wizardService.cancel();
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.wizardService.isActive() && !this.wizardService.isMinimized()) {
      this.wizardService.minimize();
    }
  }

  // ============================================================================
  // API Save Methods
  // ============================================================================

  private async saveLotoStandard(data: WizardEntityData): Promise<void> {
    if (!data.lotoStandard) {
      throw new Error('No LOTO standard data to save');
    }

    // Create the standard DTO
    const standardData: Partial<LotoStandardDto> = {
      name: data.lotoStandard.name,
      description: data.lotoStandard.description,
    };

    const response = await firstValueFrom(
      this.lotoStandardApi.createLotoStandard(standardData as LotoStandardDto)
    );

    if (!response.responseData?.id) {
      throw new Error('Failed to create LOTO standard');
    }

    const standardId = response.responseData.id;
    this.savedEntityId.set(standardId);

    // Add LOTO points to the standard if any
    const lotoPoints = data.lotoStandard.lotoPoints;
    if (lotoPoints && lotoPoints.length > 0) {
      for (const point of lotoPoints) {
        if (point.id) {
          await firstValueFrom(
            this.lotoStandardApi.addLotoPointToStandard(standardId, point.id)
          );
        }
      }
    }

    console.log('LOTO Standard saved successfully:', standardId);
  }

  private async saveLotoPoint(data: WizardEntityData): Promise<void> {
    if (!data.lotoPoint) {
      throw new Error('No LOTO point data to save');
    }

    // Build the LOTO point DTO - LotoPointDto uses ValueDto objects directly
    // The API service internally converts them to IDs via toIdModel()
    const pointData = new LotoPointDto({
      ...data.lotoPoint,
      eqType: data.lotoPoint.eqType || null,
      location: data.lotoPoint.location || null,
      normPos: data.lotoPoint.normPos || null,
      isoPos: data.lotoPoint.isoPos || null,
    });

    // Handle zero energy if present - create ZeroEnergyModel compatible object
    if (data.zeroEnergy?.zeroEnergyTemplate) {
      pointData.zeroEnergy = {
        id: 0,
        name: '',
        objectType: 'ZeroEnergy',
        isVerified: false,
        method: data.zeroEnergy.method || '',
        zeroEnergyTemplate: data.zeroEnergy.zeroEnergyTemplate,
        templateEquipment: data.zeroEnergy.templateEquipment || [],
        templateEquipmentIds: data.zeroEnergy.templateEquipmentIds || [],
      };
    }

    const response = await firstValueFrom(
      this.lotoPointApi.saveLotoPoint(pointData)
    );

    if (!response.responseData?.id) {
      throw new Error('Failed to create LOTO point');
    }

    this.savedEntityId.set(response.responseData.id);
    console.log('LOTO Point saved successfully:', response.responseData.id);
  }

  private async saveValue(data: WizardEntityData): Promise<void> {
    if (!data.value) {
      throw new Error('No value data to save');
    }

    const categoryAlias = data.value.categoryAlias || data.value.categoryName || '';
    const valueName = data.value.name || '';
    const valueAlias = data.value.alias;

    if (!categoryAlias || !valueName) {
      throw new Error('Category alias and value name are required');
    }

    // RfValueApiService.createValue(categoryAlias, valueName, valueAlias?)
    const savedValue = await firstValueFrom(
      this.valueApi.createValue(categoryAlias, valueName, valueAlias)
    );

    if (!savedValue?.id) {
      throw new Error('Failed to create value');
    }

    this.savedEntityId.set(savedValue.id);
    console.log('Value saved successfully:', savedValue.id);
  }

  private async saveFile(data: WizardEntityData): Promise<void> {
    if (!data.file) {
      throw new Error('No file data to save');
    }

    // If there's an uploaded file, handle file upload
    if (data.file.uploadedFile) {
      const formData = new FormData();
      formData.append('file', data.file.uploadedFile);

      const fileDto = new FileDto({
        name: data.file.name,
        fileType: (data.file as any).fileType,
        fileNumber: (data.file as any).fileNumber,
      });

      formData.append('fileDto', new Blob([JSON.stringify(fileDto)], {
        type: 'application/json'
      }));

      const response = await firstValueFrom(
        this.fileApi.uploadFile(formData)
      );

      if (!response.responseData?.id) {
        throw new Error('Failed to upload file');
      }

      this.savedEntityId.set(response.responseData.id);
      console.log('File uploaded successfully:', response.responseData.id);
    } else {
      // Just create file metadata without upload
      const fileData = new FileDto({
        name: data.file.name,
      });

      const response = await firstValueFrom(
        this.fileApi.createFile(fileData)
      );

      if (!response.responseData?.id) {
        throw new Error('Failed to create file');
      }

      this.savedEntityId.set(response.responseData.id);
      console.log('File created successfully:', response.responseData.id);
    }
  }
}
