import { Component, inject, signal, computed, ViewChild, AfterViewInit, Injector, effect, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { SearchableSelectInputComponent } from '../../../reactive-form/refactored/input-fields/searchable-select-input/searchable-select-input.component';
import { EquipmentUnifiedDialogComponent } from '../../../reactive-form/refactored/input-fields/equipment-unified-dialog/equipment-unified-dialog.component';
import { RfValueService } from '../../../../features/values/refactored/services/rf-value.service';
import { ZeroEnergyPhrase, PhraseSegment } from '../../../reactive-form/refactored/input-fields/zero-energy-phrase-builder/zero-energy-phrase-builder.component';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';

export interface GuideZeroEnergyResult {
  phraseId: number;
  phraseName: string;
  templateEquipment: EquipmentDto[];
  templateEquipmentIds: number[];
}

type DialogStep = 'phrase' | 'equipment' | 'review';

@Component({
  selector: 'app-guide-zero-energy-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    SearchableSelectInputComponent,
    EquipmentUnifiedDialogComponent
  ],
  template: `
    <div class="guide-dialog-container">
      <!-- Header with step indicator -->
      <div class="dialog-header">
        <h2>Configure Zero Energy Verification</h2>
        <div class="step-indicator">
          <div class="step" [class.active]="currentStep() === 'phrase'" [class.completed]="isStepCompleted('phrase')">
            <span class="step-number">1</span>
            <span class="step-label">Select Phrase</span>
          </div>
          <div class="step-connector" [class.completed]="isStepCompleted('phrase')"></div>
          <div class="step" [class.active]="currentStep() === 'equipment'" [class.completed]="isStepCompleted('equipment')">
            <span class="step-number">2</span>
            <span class="step-label">Select Equipment</span>
          </div>
          <div class="step-connector" [class.completed]="isStepCompleted('equipment')"></div>
          <div class="step" [class.active]="currentStep() === 'review'">
            <span class="step-number">3</span>
            <span class="step-label">Review</span>
          </div>
        </div>
      </div>

      <!-- Step Content -->
      <div class="dialog-content">
        @switch (currentStep()) {
          @case ('phrase') {
            <div class="step-content phrase-step">
              <div class="step-guidance">
                <mat-icon>info</mat-icon>
                <p>Select a zero energy phrase template. The phrase may contain placeholders (like [tag1], [tag2]) that will be replaced with actual equipment references.</p>
              </div>

              <div class="phrase-selector">
                <app-searchable-select-input
                  #phraseSelect
                  [label]="'Zero Energy Phrase'"
                  [options]="phraseOptions()"
                  (valueChange)="onPhraseSelected($event)"
                />
              </div>

              @if (selectedPhrase()) {
                <div class="phrase-preview">
                  <h4>Phrase Preview</h4>
                  <div class="preview-content">
                    @for (segment of selectedPhrase()?.segments; track $index) {
                      @if (segment.type === 'text') {
                        <span class="text-segment">{{ segment.content }}</span>
                      } @else {
                        <span class="placeholder-segment">[{{ segment.content }}]</span>
                      }
                    }
                  </div>
                  @if (placeholderCount() > 0) {
                    <p class="placeholder-info">
                      <mat-icon>assignment</mat-icon>
                      This phrase has <strong>{{ placeholderCount() }}</strong> placeholder{{ placeholderCount() === 1 ? '' : 's' }}.
                      You'll select equipment for {{ placeholderCount() === 1 ? 'it' : 'them' }} in the next step.
                    </p>
                  } @else {
                    <p class="no-placeholder-info">
                      <mat-icon>check_circle</mat-icon>
                      This phrase has no placeholders. No equipment selection is needed.
                    </p>
                  }
                </div>
              }
            </div>
          }

          @case ('equipment') {
            <div class="step-content equipment-step">
              <div class="step-guidance">
                <mat-icon>info</mat-icon>
                <p>Select equipment for each placeholder in the phrase. Click on an equipment to assign it to placeholder {{ currentPlaceholderIndex() + 1 }}.</p>
              </div>

              <div class="equipment-progress">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="equipmentProgress()"></div>
                </div>
                <span class="progress-text">{{ selectedEquipment().length }} of {{ placeholderCount() }} placeholders filled</span>
              </div>

              <div class="placeholder-tabs">
                @for (placeholder of placeholders(); track $index) {
                  <button
                    class="placeholder-tab"
                    [class.active]="currentPlaceholderIndex() === $index"
                    [class.filled]="selectedEquipment()[$index]"
                    (click)="selectPlaceholder($index)">
                    <span class="tab-label">[{{ placeholder.content }}]</span>
                    @if (selectedEquipment()[$index]) {
                      <span class="tab-value">{{ getEquipmentLabel(selectedEquipment()[$index]) }}</span>
                      <mat-icon class="tab-clear" (click)="clearEquipment($index); $event.stopPropagation()">close</mat-icon>
                    }
                  </button>
                }
              </div>

              <div class="equipment-dialog-wrapper">
                <app-equipment-unified-dialog
                  [immediateSelection]="true"
                  [hideActions]="true"
                  (equipmentAcquired)="onEquipmentSelected($event)"
                />
              </div>
            </div>
          }

          @case ('review') {
            <div class="step-content review-step">
              <div class="step-guidance">
                <mat-icon>info</mat-icon>
                <p>Review your zero energy configuration before confirming.</p>
              </div>

              <div class="review-card">
                <h4>Selected Phrase</h4>
                <p class="phrase-name">{{ selectedPhrase()?.name }}</p>
              </div>

              <div class="review-card">
                <h4>Preview with Equipment</h4>
                <div class="preview-content final-preview">
                  @for (segment of previewWithEquipment(); track $index) {
                    @if (segment.type === 'text') {
                      <span class="text-segment">{{ segment.content }}</span>
                    } @else {
                      <span class="equipment-segment" [class.filled]="segment.hasSubstitution">
                        {{ segment.hasSubstitution ? segment.substitutedText : '[' + segment.content + ']' }}
                      </span>
                    }
                  }
                </div>
              </div>

              @if (placeholderCount() > 0) {
                <div class="review-card">
                  <h4>Equipment Assignments</h4>
                  <div class="equipment-list">
                    @for (placeholder of placeholders(); track $index) {
                      <div class="equipment-item">
                        <span class="placeholder-label">[{{ placeholder.content }}]</span>
                        <mat-icon>arrow_forward</mat-icon>
                        <span class="equipment-value" [class.missing]="!selectedEquipment()[$index]">
                          {{ selectedEquipment()[$index] ? getEquipmentLabel(selectedEquipment()[$index]) : 'Not assigned' }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>

      <!-- Footer with navigation -->
      <div class="dialog-footer">
        <button mat-button (click)="onCancel()">Cancel</button>
        <div class="nav-buttons">
          @if (currentStep() !== 'phrase') {
            <button mat-button (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              Back
            </button>
          }
          @if (currentStep() === 'review') {
            <button mat-raised-button color="primary" [disabled]="!canConfirm()" (click)="onConfirm()">
              <mat-icon>check</mat-icon>
              Confirm
            </button>
          } @else {
            <button mat-raised-button color="primary" [disabled]="!canProceed()" (click)="goNext()">
              Next
              <mat-icon>arrow_forward</mat-icon>
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .guide-dialog-container {
      display: flex;
      flex-direction: column;
      height: 85vh;
      max-height: 85vh;
      width: 90vw;
      max-width: 1200px;
    }

    .dialog-header {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color, #e0e0e0);
      flex-shrink: 0;
    }

    .dialog-header h2 {
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 500;
      color: var(--text-primary, #333);
    }

    .step-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      opacity: 0.5;
    }

    .step.active, .step.completed {
      opacity: 1;
    }

    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--surface-alt, #f5f5f5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 14px;
    }

    .step.active .step-number {
      background: var(--primary-color, #1976d2);
      color: white;
    }

    .step.completed .step-number {
      background: var(--success-color, #4caf50);
      color: white;
    }

    .step-label {
      font-size: 12px;
      color: var(--text-secondary, #666);
    }

    .step-connector {
      width: 60px;
      height: 2px;
      background: var(--border-color, #e0e0e0);
      margin-bottom: 20px;
    }

    .step-connector.completed {
      background: var(--success-color, #4caf50);
    }

    .dialog-content {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      padding: 16px 24px;
      display: flex;
      flex-direction: column;
    }

    .step-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .step-content.phrase-step,
    .step-content.review-step {
      overflow-y: auto;
    }

    .step-content.equipment-step {
      overflow: hidden;
    }

    .step-guidance {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      background: var(--info-bg, #e3f2fd);
      border-radius: 8px;
      border-left: 4px solid var(--primary-color, #1976d2);
    }

    .step-guidance mat-icon {
      color: var(--primary-color, #1976d2);
      flex-shrink: 0;
    }

    .step-guidance p {
      margin: 0;
      font-size: 14px;
      color: var(--text-primary, #333);
      line-height: 1.5;
    }

    .phrase-selector {
      max-width: 500px;
    }

    .phrase-preview {
      background: var(--surface-alt, #f5f5f5);
      border-radius: 8px;
      padding: 16px;
    }

    .phrase-preview h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary, #333);
    }

    .preview-content {
      font-size: 14px;
      line-height: 1.6;
      padding: 12px;
      background: white;
      border-radius: 4px;
      border: 1px solid var(--border-color, #e0e0e0);
    }

    .text-segment {
      color: var(--text-primary, #333);
    }

    .placeholder-segment {
      background: var(--warning-bg, #fff3e0);
      color: var(--warning-color, #f57c00);
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .equipment-segment {
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .equipment-segment.filled {
      background: var(--success-bg, #e8f5e9);
      color: var(--success-color, #4caf50);
    }

    .equipment-segment:not(.filled) {
      background: var(--warning-bg, #fff3e0);
      color: var(--warning-color, #f57c00);
    }

    .placeholder-info, .no-placeholder-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 12px 0 0 0;
      font-size: 13px;
      color: var(--text-secondary, #666);
    }

    .placeholder-info mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--warning-color, #f57c00);
    }

    .no-placeholder-info mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--success-color, #4caf50);
    }

    /* Equipment step */
    .equipment-progress {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: var(--surface-alt, #f5f5f5);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--success-color, #4caf50);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 13px;
      color: var(--text-secondary, #666);
      white-space: nowrap;
    }

    .placeholder-tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .placeholder-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 2px solid var(--border-color, #e0e0e0);
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .placeholder-tab:hover {
      border-color: var(--primary-color, #1976d2);
    }

    .placeholder-tab.active {
      border-color: var(--primary-color, #1976d2);
      background: var(--primary-bg, #e3f2fd);
    }

    .placeholder-tab.filled {
      border-color: var(--success-color, #4caf50);
    }

    .placeholder-tab.filled.active {
      background: var(--success-bg, #e8f5e9);
    }

    .tab-label {
      font-weight: 500;
      color: var(--text-primary, #333);
    }

    .tab-value {
      font-size: 12px;
      color: var(--success-color, #4caf50);
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tab-clear {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--text-tertiary, #999);
      cursor: pointer;
    }

    .tab-clear:hover {
      color: var(--error-color, #f44336);
    }

    .equipment-dialog-wrapper {
      flex: 1;
      min-height: 0;
      border: 1px solid var(--border-color, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .equipment-dialog-wrapper ::ng-deep .dialog-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .equipment-dialog-wrapper ::ng-deep .dialog-content {
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .equipment-dialog-wrapper ::ng-deep .navigation-panel {
      overflow-y: auto;
    }

    /* Review step */
    .review-card {
      background: var(--surface-alt, #f5f5f5);
      border-radius: 8px;
      padding: 16px;
    }

    .review-card h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-secondary, #666);
    }

    .phrase-name {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-color, #1976d2);
    }

    .final-preview {
      font-size: 16px;
      background: white;
      padding: 16px;
    }

    .equipment-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .equipment-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: white;
      border-radius: 4px;
    }

    .equipment-item mat-icon {
      color: var(--text-tertiary, #999);
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .placeholder-label {
      font-weight: 500;
      color: var(--text-primary, #333);
      min-width: 80px;
    }

    .equipment-value {
      color: var(--success-color, #4caf50);
      font-weight: 500;
    }

    .equipment-value.missing {
      color: var(--warning-color, #f57c00);
      font-style: italic;
    }

    .dialog-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-top: 1px solid var(--border-color, #e0e0e0);
      flex-shrink: 0;
    }

    .nav-buttons {
      display: flex;
      gap: 8px;
    }

    .nav-buttons button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class GuideZeroEnergyDialogComponent implements AfterViewInit {
  private valueService = inject(RfValueService);
  private injector = inject(Injector);

  @ViewChild('phraseSelect') phraseSelect!: SearchableSelectInputComponent;

  // Input: initial values if editing
  initialPhraseId = input<number | null>(null);
  initialEquipment = input<EquipmentDto[]>([]);

  // Output: result when confirmed
  confirmed = output<GuideZeroEnergyResult>();
  cancelled = output<void>();

  // Dialog reference for closing
  private dialogRef = inject(MatDialogRef<GuideZeroEnergyDialogComponent>, { optional: true });

  // State
  currentStep = signal<DialogStep>('phrase');
  selectedPhraseId = signal<number | null>(null);
  selectedEquipment = signal<(EquipmentDto | null)[]>([]);
  currentPlaceholderIndex = signal<number>(0);

  // Phrase options
  phraseOptions = computed(() => {
    const values = this.valueService.getValuesByCategory('zeroEnergyTemplate');
    return values.map(v => {
      let phraseText = '';
      let placeholderCount = 0;

      try {
        const phraseData: ZeroEnergyPhrase = JSON.parse(v.alias || '{}');
        phraseText = phraseData.rawText || '';
        placeholderCount = phraseData.segments?.filter(s => s.type === 'placeholder').length || 0;
      } catch (e) {
        // Ignore parsing errors
      }

      const labelSuffix = placeholderCount > 0 ? ` (${placeholderCount} placeholder${placeholderCount === 1 ? '' : 's'})` : '';

      return {
        value: v.id,
        label: v.name + labelSuffix,
        description: phraseText
      };
    });
  });

  // Selected phrase data
  selectedPhrase = computed(() => {
    const phraseId = this.selectedPhraseId();
    if (!phraseId) return null;

    const values = this.valueService.getValuesByCategory('zeroEnergyTemplate');
    const selectedValue = values.find(v => v.id === phraseId);
    if (!selectedValue) return null;

    try {
      return JSON.parse(selectedValue.alias || '{}') as ZeroEnergyPhrase;
    } catch (e) {
      return null;
    }
  });

  // Placeholders from selected phrase
  placeholders = computed(() => {
    const phrase = this.selectedPhrase();
    if (!phrase?.segments) return [];
    return phrase.segments.filter(s => s.type === 'placeholder');
  });

  placeholderCount = computed(() => this.placeholders().length);

  // Equipment progress
  equipmentProgress = computed(() => {
    const total = this.placeholderCount();
    if (total === 0) return 100;
    const filled = this.selectedEquipment().filter(e => e !== null).length;
    return (filled / total) * 100;
  });

  // Preview with equipment substituted
  previewWithEquipment = computed(() => {
    const phrase = this.selectedPhrase();
    if (!phrase?.segments) return [];

    const equipment = this.selectedEquipment();

    return phrase.segments.map(segment => {
      if (segment.type === 'placeholder' && segment.placeholderIndex !== undefined) {
        const eq = equipment[segment.placeholderIndex];
        if (eq) {
          return {
            ...segment,
            substitutedText: this.getEquipmentLabel(eq),
            hasSubstitution: true
          };
        }
      }
      return { ...segment, hasSubstitution: false };
    });
  });

  constructor() {
    // Initialize from inputs
    effect(() => {
      const initialId = this.initialPhraseId();
      if (initialId) {
        this.selectedPhraseId.set(initialId);
      }
    });

    effect(() => {
      const initialEq = this.initialEquipment();
      if (initialEq && initialEq.length > 0) {
        this.selectedEquipment.set([...initialEq]);
      }
    });

    // Load phrase options
    this.valueService.refreshCategory('zeroEnergyTemplate');
  }

  ngAfterViewInit(): void {
    // Apply initial phrase ID to select component
    const initialId = this.initialPhraseId();
    if (initialId && this.phraseSelect) {
      setTimeout(() => {
        this.phraseSelect.writeValue(initialId);
      }, 100);
    }
  }

  // Step navigation
  isStepCompleted(step: DialogStep): boolean {
    switch (step) {
      case 'phrase':
        return this.selectedPhraseId() !== null;
      case 'equipment':
        return this.placeholderCount() === 0 ||
               this.selectedEquipment().filter(e => e !== null).length === this.placeholderCount();
      default:
        return false;
    }
  }

  canProceed(): boolean {
    switch (this.currentStep()) {
      case 'phrase':
        return this.selectedPhraseId() !== null;
      case 'equipment':
        // Can proceed even if not all equipment is filled (optional)
        return true;
      default:
        return false;
    }
  }

  canConfirm(): boolean {
    return this.selectedPhraseId() !== null;
  }

  goNext(): void {
    const step = this.currentStep();
    if (step === 'phrase') {
      if (this.placeholderCount() > 0) {
        this.currentStep.set('equipment');
        // Initialize equipment array with nulls
        const count = this.placeholderCount();
        if (this.selectedEquipment().length !== count) {
          this.selectedEquipment.set(new Array(count).fill(null));
        }
      } else {
        // Skip equipment step if no placeholders
        this.currentStep.set('review');
      }
    } else if (step === 'equipment') {
      this.currentStep.set('review');
    }
  }

  goBack(): void {
    const step = this.currentStep();
    if (step === 'review') {
      if (this.placeholderCount() > 0) {
        this.currentStep.set('equipment');
      } else {
        this.currentStep.set('phrase');
      }
    } else if (step === 'equipment') {
      this.currentStep.set('phrase');
    }
  }

  // Phrase selection
  onPhraseSelected(value: any): void {
    const id = value?.id ?? value;
    this.selectedPhraseId.set(id);
    // Reset equipment when phrase changes
    this.selectedEquipment.set([]);
    this.currentPlaceholderIndex.set(0);
  }

  // Equipment selection
  selectPlaceholder(index: number): void {
    this.currentPlaceholderIndex.set(index);
  }

  onEquipmentSelected(equipment: EquipmentDto): void {
    const index = this.currentPlaceholderIndex();
    const current = [...this.selectedEquipment()];

    // Ensure array is long enough
    while (current.length <= index) {
      current.push(null);
    }

    current[index] = equipment;
    this.selectedEquipment.set(current);

    // Auto-advance to next unfilled placeholder
    const nextEmpty = current.findIndex((e, i) => i > index && e === null);
    if (nextEmpty !== -1) {
      this.currentPlaceholderIndex.set(nextEmpty);
    } else {
      // If all filled, stay on current or go to first
      const firstEmpty = current.findIndex(e => e === null);
      if (firstEmpty !== -1) {
        this.currentPlaceholderIndex.set(firstEmpty);
      }
    }
  }

  clearEquipment(index: number): void {
    const current = [...this.selectedEquipment()];
    if (index < current.length) {
      current[index] = null;
      this.selectedEquipment.set(current);
    }
  }

  getEquipmentLabel(equipment: EquipmentDto | null): string {
    if (!equipment) return 'Not selected';

    // Try to get tag number from various sources
    if (equipment.tagNumber) {
      return equipment.tagNumber;
    }
    if ((equipment as any).lotoPoints?.length > 0) {
      return (equipment as any).lotoPoints[0].tagNumber || `Equipment #${equipment.id}`;
    }
    return `Equipment #${equipment.id}`;
  }

  // Actions
  onCancel(): void {
    this.cancelled.emit();
    this.dialogRef?.close();
  }

  onConfirm(): void {
    const phraseId = this.selectedPhraseId();
    const phrase = this.selectedPhrase();
    if (!phraseId || !phrase) return;

    const equipment = this.selectedEquipment().filter(e => e !== null) as EquipmentDto[];

    const result: GuideZeroEnergyResult = {
      phraseId,
      phraseName: phrase.name,
      templateEquipment: equipment,
      templateEquipmentIds: equipment.map(e => e.id)
    };

    this.confirmed.emit(result);
    this.dialogRef?.close(result);
  }
}
