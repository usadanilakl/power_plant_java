import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  effect,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, catchError, tap, switchMap } from 'rxjs';

import { WizardStep, WizardContextFrame, StepDataPayload } from '../wizard-stack.types';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { RfLotoStandardApiService } from '../../../../features/loto-standard/refactored/services/rf-loto-standard-api.service';
import { RfLotoStandardStateService } from '../../../../features/loto-standard/refactored/services/rf-loto-standard-state.service';
import { RfLotoPointApiService } from '../../../../features/loto-points/refactored/services/rf-loto-point-api.service';
import { LotoPointCounterpartService } from '../../../../features/loto-points/refactored/services/loto-point-counterpart.service';
import { GlobalMessageService } from '../../../global-message/global-message.service';
import { LotoPointDualFormComponent } from '../../../../features/loto-points/refactored/loto-point-dual-form/loto-point-dual-form.component';
import { PopupProjectionComponent } from '../../../popup-projection/popup-projection.component';

interface CounterpartLotoPointStatus {
  primary: LotoPointDto;
  counterpart: LotoPointDto | null;
  status: 'linked' | 'found' | 'needs-creation' | 'creating' | 'done' | 'use-same';
  isProcessing: boolean;
}

@Component({
  selector: 'app-wizard-counterpart-creation-step',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    LotoPointDualFormComponent,
    PopupProjectionComponent,
  ],
  template: `
    <div class="counterpart-creation-container">
      <!-- Loading state -->
      @if (isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading LOTO points...</p>
        </div>
      } @else {
        <!-- Progress header -->
        <div class="progress-header">
          <div class="progress-info">
            <mat-icon [class.success]="allCounterpartsReady()">
              {{ allCounterpartsReady() ? 'check_circle' : 'sync' }}
            </mat-icon>
            <span>{{ progressText() }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="progressPercent()"></div>
          </div>
        </div>

        <!-- LOTO points list -->
        <div class="loto-points-list">
          @for (item of lotoPointStatuses(); track item.primary.id) {
            <div class="loto-point-item" [class.done]="item.status === 'done' || item.status === 'linked'">
              <div class="item-info">
                <span class="tag-number">{{ item.primary.tagNumber || 'No tag' }}</span>
                <span class="description">{{ item.primary.description || 'No description' }}</span>
              </div>
              <div class="item-status">
                @switch (item.status) {
                  @case ('linked') {
                    <span class="status-badge linked">
                      <mat-icon>link</mat-icon>
                      Linked
                    </span>
                  }
                  @case ('found') {
                    <span class="status-badge found">
                      <mat-icon>search</mat-icon>
                      Found
                    </span>
                  }
                  @case ('done') {
                    <span class="status-badge done">
                      <mat-icon>check</mat-icon>
                      Ready
                    </span>
                  }
                  @case ('use-same') {
                    <span class="status-badge use-same">
                      <mat-icon>content_copy</mat-icon>
                      Using Same
                    </span>
                  }
                  @case ('creating') {
                    <span class="status-badge creating">
                      <mat-spinner diameter="16"></mat-spinner>
                      Creating...
                    </span>
                  }
                  @case ('needs-creation') {
                    <div class="action-btn-group">
                      <button
                        mat-stroked-button
                        color="primary"
                        (click)="createCounterpart(item)"
                        [disabled]="item.isProcessing"
                        title="Create a counterpart LOTO point for the other unit"
                      >
                        <mat-icon>add</mat-icon>
                        Create Counterpart
                      </button>
                      <button
                        mat-stroked-button
                        (click)="useSamePoint(item)"
                        [disabled]="item.isProcessing"
                        title="Use the same LOTO point for both units (common equipment)"
                      >
                        <mat-icon>content_copy</mat-icon>
                        Use Same
                      </button>
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>

        <!-- Action buttons -->
        @if (!allCounterpartsReady()) {
          <div class="action-buttons">
            <button
              mat-flat-button
              color="primary"
              (click)="createAllMissingCounterparts()"
              [disabled]="isCreatingAll() || !hasMissingCounterparts()"
            >
              @if (isCreatingAll()) {
                <mat-spinner diameter="18"></mat-spinner>
              } @else {
                <mat-icon>add_circle</mat-icon>
              }
              Create All Missing Counterparts
            </button>
          </div>
        } @else {
          <!-- Create counterpart standard -->
          <div class="standard-creation-section">
            <div class="standard-info">
              <mat-icon class="success-icon">check_circle</mat-icon>
              <div class="standard-details">
                <p class="ready-message">All LOTO point counterparts are ready!</p>
                <p class="standard-name">
                  <strong>Counterpart Standard:</strong> {{ counterpartStandardName() }}
                </p>
              </div>
            </div>

            @if (!isStandardCreated()) {
              <button
                mat-flat-button
                color="primary"
                (click)="createCounterpartStandard()"
                [disabled]="isCreatingStandard()"
              >
                @if (isCreatingStandard()) {
                  <mat-spinner diameter="18"></mat-spinner>
                  Creating Standard...
                } @else {
                  <ng-container>
                    <mat-icon>playlist_add</mat-icon>
                    Create Counterpart Standard
                  </ng-container>
                }
              </button>
            } @else {
              <div class="success-message">
                <mat-icon>check_circle</mat-icon>
                <span>Counterpart standard created successfully!</span>
              </div>
              <button
                mat-flat-button
                color="primary"
                (click)="onContinue()"
                class="continue-btn"
              >
                <mat-icon>arrow_forward</mat-icon>
                Continue
              </button>
            }
          </div>
        }
      }

      <!-- Dual Form Popup -->
      <app-popup-projection
        [isOpen]="isDualFormOpen()"
        [title]="'Create Counterpart for ' + (editingItem()?.primary?.tagNumber || 'LOTO Point')"
        [size]="'large'"
        (close)="closeDualForm()"
      >
        @if (editingItem()) {
          <app-loto-point-dual-form
            [primaryLotoPoint]="editingItem()!.primary"
            (primarySaved)="onPrimarySaved($event)"
            (counterpartSaved)="onCounterpartSaved($event)"
            (bothSaved)="onBothSaved($event)"
            (formClosed)="closeDualForm()"
          ></app-loto-point-dual-form>
        }
      </app-popup-projection>
    </div>
  `,
  styles: [`
    .counterpart-creation-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 16px;
      color: #666;
    }

    .progress-header {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
    }

    .progress-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .progress-info mat-icon {
      color: #1976d2;
    }

    .progress-info mat-icon.success {
      color: #4caf50;
    }

    .progress-bar {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #1976d2, #42a5f5);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .loto-points-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 300px;
      overflow-y: auto;
    }

    .loto-point-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .loto-point-item.done {
      background: #e8f5e9;
      border-color: #c8e6c9;
    }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }

    .tag-number {
      font-weight: 600;
      font-family: monospace;
      color: #1976d2;
    }

    .description {
      font-size: 12px;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-status {
      flex-shrink: 0;
      margin-left: 16px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .status-badge.linked {
      background: #e3f2fd;
      color: #1976d2;
    }

    .status-badge.found {
      background: #fff3e0;
      color: #f57c00;
    }

    .status-badge.done {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-badge.creating {
      background: #f5f5f5;
      color: #666;
    }

    .status-badge.use-same {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .action-btn-group {
      display: flex;
      gap: 8px;
    }

    .action-btn-group button {
      font-size: 12px;
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      padding: 16px 0;
    }

    .standard-creation-section {
      background: #e8f5e9;
      border: 1px solid #c8e6c9;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .standard-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .success-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #4caf50;
    }

    .standard-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .ready-message {
      margin: 0;
      font-weight: 500;
      color: #2e7d32;
    }

    .standard-name {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2e7d32;
      font-weight: 500;
    }

    .success-message mat-icon {
      color: #4caf50;
    }

    .continue-btn {
      margin-top: 16px;
    }
  `],
})
export class WizardCounterpartCreationStepComponent {
  private lotoStandardApi = inject(RfLotoStandardApiService);
  private lotoPointApi = inject(RfLotoPointApiService);
  private counterpartService = inject(LotoPointCounterpartService);
  private messageService = inject(GlobalMessageService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private lotoStandardStateService = inject(RfLotoStandardStateService);

  // Inputs
  step = input.required<WizardStep>();
  frame = input.required<WizardContextFrame>();

  // Outputs
  valueChange = output<StepDataPayload>();
  stepComplete = output<void>();

  // State
  isLoading = signal<boolean>(true);
  lotoPointStatuses = signal<CounterpartLotoPointStatus[]>([]);
  isCreatingAll = signal<boolean>(false);
  isCreatingStandard = signal<boolean>(false);
  isStandardCreated = signal<boolean>(false);
  createdStandardId = signal<number | null>(null);

  // Dual form popup state
  isDualFormOpen = signal<boolean>(false);
  editingItem = signal<CounterpartLotoPointStatus | null>(null);

  // Source unit from primary standard
  sourceUnit = signal<string>('01');
  targetUnit = signal<string>('02');

  // Computed values
  allCounterpartsReady = computed(() => {
    const statuses = this.lotoPointStatuses();
    return statuses.length > 0 && statuses.every(
      s => s.status === 'linked' || s.status === 'found' || s.status === 'done' || s.status === 'use-same'
    );
  });

  hasMissingCounterparts = computed(() => {
    return this.lotoPointStatuses().some(s => s.status === 'needs-creation');
  });

  progressPercent = computed(() => {
    const statuses = this.lotoPointStatuses();
    if (statuses.length === 0) return 0;
    const ready = statuses.filter(
      s => s.status === 'linked' || s.status === 'found' || s.status === 'done' || s.status === 'use-same'
    ).length;
    return Math.round((ready / statuses.length) * 100);
  });

  progressText = computed(() => {
    const statuses = this.lotoPointStatuses();
    const ready = statuses.filter(
      s => s.status === 'linked' || s.status === 'found' || s.status === 'done' || s.status === 'use-same'
    ).length;
    return `${ready} of ${statuses.length} LOTO points ready`;
  });

  counterpartStandardName = computed(() => {
    const frameData = this.frame();
    if (!frameData?.entityData?.lotoStandard) return '';

    const primaryName = frameData.entityData.lotoStandard.name || '';
    const counterpartName = frameData.entityData.lotoStandard.counterpartName;

    if (counterpartName) return counterpartName;

    // Generate name by transforming unit references
    return this.counterpartService.transformUnitText(
      primaryName,
      this.sourceUnit(),
      this.targetUnit()
    );
  });

  constructor() {
    // Load LOTO points when frame changes
    effect(() => {
      const frameData = this.frame();
      if (frameData?.entityData?.lotoStandard?.lotoPoints) {
        this.loadCounterpartStatuses(frameData.entityData.lotoStandard.lotoPoints);
      }
    });
  }

  /**
   * Load counterpart status for all LOTO points
   */
  private loadCounterpartStatuses(lotoPoints: LotoPointDto[]): void {
    if (!lotoPoints || lotoPoints.length === 0) {
      this.isLoading.set(false);
      return;
    }

    // Determine source unit from first LOTO point
    const firstPoint = lotoPoints[0];
    const sourceUnit = this.counterpartService.getSourceUnit(firstPoint);
    this.sourceUnit.set(sourceUnit);
    this.targetUnit.set(this.counterpartService.getTargetUnit(sourceUnit));

    // Build initial statuses
    const statuses: CounterpartLotoPointStatus[] = lotoPoints.map(lp => ({
      primary: lp,
      counterpart: null,
      status: lp.counterpartId ? 'linked' : 'needs-creation',
      isProcessing: false,
    }));

    this.lotoPointStatuses.set(statuses);

    // Load counterpart info for points that have counterpartId
    const pointsWithCounterparts = lotoPoints.filter(lp => lp.counterpartId);

    if (pointsWithCounterparts.length === 0) {
      // Check for existing counterparts by tag number
      this.checkExistingCounterpartsByTag(statuses);
      return;
    }

    // Load all counterparts in parallel
    const counterpartRequests = pointsWithCounterparts.map(lp =>
      this.lotoPointApi.getLotoPointById(String(lp.counterpartId!)).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(counterpartRequests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (responses) => {
          const updatedStatuses = [...statuses];

          responses.forEach((response, index) => {
            if (response?.responseData) {
              const primaryId = pointsWithCounterparts[index].id;
              const statusIndex = updatedStatuses.findIndex(s => s.primary.id === primaryId);
              if (statusIndex !== -1) {
                updatedStatuses[statusIndex] = {
                  ...updatedStatuses[statusIndex],
                  counterpart: LotoPointDto.fromJson(response.responseData),
                  status: 'linked',
                };
              }
            }
          });

          this.lotoPointStatuses.set(updatedStatuses);
          this.checkExistingCounterpartsByTag(updatedStatuses);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Check for existing counterparts by tag number for points that aren't linked
   */
  private checkExistingCounterpartsByTag(statuses: CounterpartLotoPointStatus[]): void {
    const needsCheck = statuses.filter(s => s.status === 'needs-creation' && s.primary.tagNumber);

    if (needsCheck.length === 0) {
      this.isLoading.set(false);
      return;
    }

    const searchRequests = needsCheck.map(s =>
      this.lotoPointApi.getCounterpartByTagNumber(s.primary.tagNumber!).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(searchRequests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (responses) => {
          const updatedStatuses = [...this.lotoPointStatuses()];

          responses.forEach((response, index) => {
            if (response?.responseData && !response.responseData.isNew) {
              const primaryId = needsCheck[index].primary.id;
              const statusIndex = updatedStatuses.findIndex(s => s.primary.id === primaryId);
              if (statusIndex !== -1) {
                updatedStatuses[statusIndex] = {
                  ...updatedStatuses[statusIndex],
                  counterpart: LotoPointDto.fromJson(response.responseData.counterpart),
                  status: 'found',
                };
              }
            }
          });

          this.lotoPointStatuses.set(updatedStatuses);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Open dual form to create/link counterpart for a LOTO point
   */
  createCounterpart(item: CounterpartLotoPointStatus): void {
    // Let the dual form load the data from API - it knows how to handle counterpart creation
    this.editingItem.set(item);
    this.isDualFormOpen.set(true);
  }

  /**
   * Use the same LOTO point for both units (common equipment)
   * This marks the point as ready without creating a separate counterpart
   */
  useSamePoint(item: CounterpartLotoPointStatus): void {
    const currentStatuses = [...this.lotoPointStatuses()];
    const idx = currentStatuses.findIndex(s => s.primary.id === item.primary.id);

    if (idx !== -1) {
      currentStatuses[idx] = {
        ...currentStatuses[idx],
        counterpart: item.primary, // Use primary as counterpart
        status: 'use-same',
        isProcessing: false,
      };
      this.lotoPointStatuses.set(currentStatuses);
    }
  }

  /**
   * Close the dual form popup
   */
  closeDualForm(): void {
    this.isDualFormOpen.set(false);
    this.editingItem.set(null);
  }

  /**
   * Handle when primary LOTO point is saved from dual form
   */
  onPrimarySaved(primary: LotoPointDto): void {
    const editingItem = this.editingItem();
    if (!editingItem) return;

    const currentStatuses = [...this.lotoPointStatuses()];
    const idx = currentStatuses.findIndex(s => s.primary.id === editingItem.primary.id);

    if (idx !== -1) {
      currentStatuses[idx] = {
        ...currentStatuses[idx],
        primary: primary,
      };
      this.lotoPointStatuses.set(currentStatuses);
    }
  }

  /**
   * Handle when counterpart LOTO point is saved from dual form
   */
  onCounterpartSaved(counterpart: LotoPointDto): void {
    const editingItem = this.editingItem();
    if (!editingItem) return;

    const currentStatuses = [...this.lotoPointStatuses()];
    const idx = currentStatuses.findIndex(s => s.primary.id === editingItem.primary.id);

    if (idx !== -1) {
      currentStatuses[idx] = {
        ...currentStatuses[idx],
        counterpart: counterpart,
        status: counterpart.id ? 'done' : 'needs-creation',
        isProcessing: false,
      };
      this.lotoPointStatuses.set(currentStatuses);
    }

    // Close the popup after counterpart is saved
    this.closeDualForm();
    this.messageService.showSuccess('Counterpart created successfully');
  }

  /**
   * Handle when both LOTO points are saved from dual form
   */
  onBothSaved(event: { primary: LotoPointDto; counterpart: LotoPointDto }): void {
    const editingItem = this.editingItem();
    if (!editingItem) return;

    const currentStatuses = [...this.lotoPointStatuses()];
    const idx = currentStatuses.findIndex(s => s.primary.id === editingItem.primary.id);

    if (idx !== -1) {
      currentStatuses[idx] = {
        ...currentStatuses[idx],
        primary: event.primary,
        counterpart: event.counterpart,
        status: 'done',
        isProcessing: false,
      };
      this.lotoPointStatuses.set(currentStatuses);
    }

    // Close the popup
    this.closeDualForm();
    this.messageService.showSuccess('Both LOTO points saved and linked successfully');
  }

  /**
   * Create all missing counterparts at once
   */
  createAllMissingCounterparts(): void {
    const missing = this.lotoPointStatuses().filter(s => s.status === 'needs-creation');
    if (missing.length === 0) return;

    this.isCreatingAll.set(true);

    // Create counterparts sequentially to avoid overwhelming the API
    this.createCounterpartsSequentially(missing, 0);
  }

  /**
   * Create counterparts one by one
   */
  private createCounterpartsSequentially(items: CounterpartLotoPointStatus[], index: number): void {
    if (index >= items.length) {
      this.isCreatingAll.set(false);
      this.messageService.showSuccess('All counterparts created successfully');
      return;
    }

    const item = items[index];

    // Update status to creating
    const statuses = [...this.lotoPointStatuses()];
    const statusIndex = statuses.findIndex(s => s.primary.id === item.primary.id);
    if (statusIndex !== -1) {
      statuses[statusIndex] = { ...statuses[statusIndex], status: 'creating', isProcessing: true };
      this.lotoPointStatuses.set(statuses);
    }

    // Generate and save counterpart
    const counterpartData = this.counterpartService.generateCounterpart(
      item.primary,
      this.targetUnit()
    );

    this.lotoPointApi.saveLotoPoint(counterpartData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((response) => {
          if (!response.responseData) {
            throw new Error('Failed to create counterpart');
          }

          const savedCounterpart = LotoPointDto.fromJson(response.responseData);

          // Link the counterparts
          if (item.primary.id && savedCounterpart.id) {
            return this.lotoPointApi.linkCounterparts(item.primary.id, savedCounterpart.id).pipe(
              tap(() => {
                this.updateStatusToDone(item.primary.id!, savedCounterpart);
              }),
              catchError(() => {
                this.updateStatusToDone(item.primary.id!, savedCounterpart);
                return of(null);
              })
            );
          }

          return of(savedCounterpart);
        })
      )
      .subscribe({
        next: () => {
          // Continue to next item
          setTimeout(() => {
            this.createCounterpartsSequentially(items, index + 1);
          }, 100);
        },
        error: (error) => {
          console.error('Error creating counterpart:', error);
          this.resetStatusToNeedsCreation(item.primary.id!);
          // Continue to next item even on error
          setTimeout(() => {
            this.createCounterpartsSequentially(items, index + 1);
          }, 100);
        }
      });
  }

  private updateStatusToDone(primaryId: number, counterpart: LotoPointDto): void {
    const currentStatuses = [...this.lotoPointStatuses()];
    const idx = currentStatuses.findIndex(s => s.primary.id === primaryId);
    if (idx !== -1) {
      currentStatuses[idx] = {
        ...currentStatuses[idx],
        counterpart,
        status: 'done',
        isProcessing: false,
      };
      this.lotoPointStatuses.set(currentStatuses);
    }
  }

  private resetStatusToNeedsCreation(primaryId: number): void {
    const currentStatuses = [...this.lotoPointStatuses()];
    const idx = currentStatuses.findIndex(s => s.primary.id === primaryId);
    if (idx !== -1) {
      currentStatuses[idx] = {
        ...currentStatuses[idx],
        status: 'needs-creation',
        isProcessing: false,
      };
      this.lotoPointStatuses.set(currentStatuses);
    }
  }

  /**
   * Continue to next step after counterpart standard is created
   */
  onContinue(): void {
    this.stepComplete.emit();
  }

  /**
   * Create the counterpart LOTO standard
   */
  createCounterpartStandard(): void {
    this.isCreatingStandard.set(true);

    const frameData = this.frame();
    const primaryStandard = frameData?.entityData?.lotoStandard;

    if (!primaryStandard) {
      this.messageService.showError('Primary standard data not found');
      this.isCreatingStandard.set(false);
      return;
    }

    // Create counterpart standard DTO
    const counterpartStandardData: Partial<LotoStandardDto> = {
      name: this.counterpartStandardName(),
      description: this.counterpartService.transformUnitText(
        primaryStandard.description || '',
        this.sourceUnit(),
        this.targetUnit()
      ),
    };

    this.lotoStandardApi.createLotoStandard(counterpartStandardData as LotoStandardDto)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((response) => {
          if (!response.responseData?.id) {
            throw new Error('Failed to create counterpart standard');
          }

          const standardId = response.responseData.id;
          this.createdStandardId.set(standardId);

          // Add all counterpart LOTO points to the standard
          const counterpartPoints = this.lotoPointStatuses()
            .filter(s => s.counterpart?.id)
            .map(s => s.counterpart!);

          if (counterpartPoints.length === 0) {
            return of(standardId);
          }

          // Add points sequentially
          return this.addPointsToStandard(standardId, counterpartPoints, 0);
        })
      )
      .subscribe({
        next: (standardId) => {
          this.isCreatingStandard.set(false);
          this.isStandardCreated.set(true);
          this.messageService.showSuccess('Counterpart LOTO standard created successfully');

          // Notify state service to refresh lists - fetch the full created standard from API
          if (typeof standardId === 'number') {
            this.lotoStandardApi.getLotoStandardById(String(standardId))
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (response) => {
                  if (response.responseData) {
                    const createdStandard = LotoStandardDto.fromJson(response.responseData);
                    this.lotoStandardStateService.updateLotoStandardInList(createdStandard);
                  }
                }
              });
          }

          // Also refresh the primary standard if it has an ID
          const primaryStandard = this.frame()?.entityData?.lotoStandard;
          if (primaryStandard?.id) {
            this.lotoStandardApi.getLotoStandardById(String(primaryStandard.id))
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (response) => {
                  if (response.responseData) {
                    const refreshedPrimary = LotoStandardDto.fromJson(response.responseData);
                    this.lotoStandardStateService.updateLotoStandardInList(refreshedPrimary);
                  }
                }
              });
          }
          // User will click "Continue" button to proceed
        },
        error: (error) => {
          console.error('Error creating counterpart standard:', error);
          this.messageService.showError('Failed to create counterpart standard');
          this.isCreatingStandard.set(false);
        }
      });
  }

  /**
   * Add LOTO points to standard one by one
   */
  private addPointsToStandard(standardId: number, points: LotoPointDto[], index: number): any {
    if (index >= points.length) {
      return of(standardId);
    }

    const point = points[index];

    return this.lotoStandardApi.addLotoPointToStandard(standardId, point.id!).pipe(
      switchMap(() => this.addPointsToStandard(standardId, points, index + 1)),
      catchError((error) => {
        console.error(`Error adding point ${point.id} to standard:`, error);
        // Continue even on error
        return this.addPointsToStandard(standardId, points, index + 1);
      })
    );
  }
}
