import { Component, input, output, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WizardStep, WizardContextFrame, StepDataPayload, WizardFlowType } from '../wizard-stack.types';
import { RfValueService } from '../../../../features/values/refactored/services/rf-value.service';
import { SearchableSelectInputComponent } from '../../../reactive-form/refactored/input-fields/searchable-select-input/searchable-select-input.component';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import {
  EquipmentConnectionDialogComponent
} from '../dialogs/equipment-connection-dialog/equipment-connection-dialog.component';
import {
  EquipmentConnectionDialogData,
  EquipmentConnectionDialogResult
} from '../dialogs/equipment-connection-dialog/equipment-connection-dialog.types';

interface PhraseSegment {
  type: 'text' | 'placeholder';
  content: string;
  placeholderIndex?: number;
  substitutedText?: string;
  hasSubstitution?: boolean;
}

interface ZeroEnergyPhrase {
  id?: number;
  name: string;
  segments: PhraseSegment[];
  rawText: string;
}

interface EquipmentWithLotoPoint {
  equipment: EquipmentDto;
  lotoPoint?: LotoPointDto;
}

@Component({
  selector: 'app-wizard-zero-energy-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatCardModule,
    MatTooltipModule,
    SearchableSelectInputComponent,
  ],
  template: `
    <div class="zero-energy-step">
      <!-- Step 1: Select Zero Energy Phrase -->
      <div class="section">
        <h3 class="section-title">
          <span class="step-number">1</span>
          Select Zero Energy Phrase
        </h3>
        <p class="section-description">
          Choose a phrase template that describes how to verify zero energy state.
        </p>

        <app-searchable-select-input
          [options]="phraseOptions()"
          [label]="'Zero Energy Phrase'"
          [categoryName]="'zeroEnergyTemplate'"
          (valueChange)="onPhraseSelected($event)"
          (addNewOption)="onAddNewPhrase()"
        />
      </div>

      <!-- Step 2: Assign Equipment to Placeholders -->
      @if (selectedPhrase() && placeholders().length > 0) {
        <mat-divider class="section-divider"></mat-divider>

        <div class="section">
          <h3 class="section-title">
            <span class="step-number">2</span>
            Assign Equipment to Placeholders
          </h3>
          <p class="section-description">
            The selected phrase has {{ placeholders().length }} placeholder(s).
            Select equipment for each placeholder from P&ID drawings.
          </p>

          <div class="placeholders-list">
            @for (placeholder of placeholders(); track placeholder.placeholderIndex; let i = $index) {
              <mat-card class="placeholder-card" [class.assigned]="equipmentAssignments()[i]">
                <mat-card-content>
                  <div class="placeholder-header">
                    <span class="placeholder-label">[{{ placeholder.content }}]</span>
                    @if (equipmentAssignments()[i]) {
                      <mat-icon class="assigned-icon">check_circle</mat-icon>
                    }
                  </div>

                  @if (equipmentAssignments()[i]; as assignment) {
                    <div class="assigned-equipment">
                      <div class="equipment-info">
                        <span class="equipment-tag">{{ getEquipmentDisplay(assignment.equipment) }}</span>
                        @if (assignment.lotoPoint) {
                          <span class="loto-point-tag">
                            <mat-icon>lock</mat-icon>
                            {{ assignment.lotoPoint.tagNumber || 'LOTO #' + assignment.lotoPoint.id }}
                          </span>
                        }
                        @if (assignment.equipment.mainFileObject?.name; as fileName) {
                          <span class="file-name">({{ fileName }})</span>
                        }
                      </div>
                      <button mat-icon-button (click)="clearEquipment(i)" matTooltip="Clear">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  } @else {
                    <div class="equipment-actions">
                      <button mat-flat-button color="primary" (click)="openEquipmentPicker(i)">
                        <mat-icon>touch_app</mat-icon>
                        Select Equipment from P&ID
                      </button>
                      <span class="action-hint">
                        Browse P&ID files to select existing equipment or draw new.
                        If equipment has no LOTO point, you'll be prompted to create one.
                      </span>
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            }
          </div>
        </div>
      }

      <!-- Preview Section -->
      @if (selectedPhrase()) {
        <mat-divider class="section-divider"></mat-divider>

        <div class="section">
          <h3 class="section-title">
            <mat-icon class="preview-title-icon">visibility</mat-icon>
            Preview
          </h3>
          <div class="preview-box">
            @for (segment of previewSegments(); track $index) {
              @if (segment.type === 'text') {
                <span class="preview-text">{{ segment.content }}</span>
              } @else {
                <span
                  class="preview-placeholder"
                  [class.filled]="segment.hasSubstitution"
                  [class.empty]="!segment.hasSubstitution"
                >
                  {{ segment.hasSubstitution ? segment.substitutedText : '[' + segment.content + ']' }}
                </span>
              }
            }
          </div>
        </div>
      }

      @if (!selectedPhrase()) {
        <div class="empty-state">
          <mat-icon>energy_savings_leaf</mat-icon>
          <p>Select a zero energy phrase to continue</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .zero-energy-step {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .section {
      padding: 16px 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .step-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: #1976d2;
      color: white;
      border-radius: 50%;
      font-size: 13px;
      font-weight: 600;
    }

    .section-description {
      margin: 0 0 16px 36px;
      color: #666;
      font-size: 13px;
    }

    .section-divider {
      margin: 8px 0;
    }

    .placeholders-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-left: 36px;
    }

    .placeholder-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .placeholder-card.assigned {
      border-color: #4caf50;
      background: #f1f8e9;
    }

    .placeholder-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .placeholder-label {
      font-family: monospace;
      font-size: 14px;
      font-weight: 600;
      color: #1976d2;
      background: #e3f2fd;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .assigned-icon {
      color: #4caf50;
    }

    .assigned-equipment {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .equipment-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .equipment-tag {
      font-weight: 500;
      color: #2e7d32;
    }

    .loto-point-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #1976d2;
    }

    .loto-point-tag mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .file-name {
      font-size: 11px;
      color: #888;
    }

    .equipment-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .action-hint {
      font-size: 12px;
      color: #666;
      font-style: italic;
      line-height: 1.4;
    }

    .preview-title-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #1976d2;
    }

    .preview-box {
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      line-height: 1.8;
    }

    .preview-text {
      color: #333;
    }

    .preview-placeholder {
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      margin: 0 2px;
    }

    .preview-placeholder.filled {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .preview-placeholder.empty {
      background: #fff3e0;
      color: #e65100;
      font-family: monospace;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #999;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
  `],
})
export class WizardZeroEnergyStepComponent {
  private valueService = inject(RfValueService);
  private dialog = inject(MatDialog);

  step = input.required<WizardStep>();
  frame = input.required<WizardContextFrame>();

  valueChange = output<StepDataPayload>();
  branchRequest = output<{ flowType: WizardFlowType; field: string; initialData?: any }>();

  selectedPhraseId = signal<number | null>(null);
  selectedPhrase = signal<ZeroEnergyPhrase | null>(null);
  equipmentAssignments = signal<(EquipmentWithLotoPoint | null)[]>([]);

  // Store which placeholder we're currently selecting for
  private currentPlaceholderIndex = signal<number | null>(null);

  // Flag to prevent re-initialization
  private isInitialized = false;

  constructor() {
    // Restore state from frame's entity data when component loads
    effect(() => {
      const frameData = this.frame();
      if (this.isInitialized || !frameData) return;

      const zeroEnergy = frameData.entityData.zeroEnergy as any;
      if (!zeroEnergy) return;

      // Restore phrase selection
      if (zeroEnergy.zeroEnergyTemplate?.id) {
        const phraseId = zeroEnergy.zeroEnergyTemplate.id;
        this.selectedPhraseId.set(phraseId);

        // Get full phrase data from value service
        const values = this.valueService.getValuesByCategory('zeroEnergyTemplate');
        const selectedValue = values.find(v => v.id === phraseId);
        if (selectedValue?.alias) {
          try {
            const phraseData: ZeroEnergyPhrase = JSON.parse(selectedValue.alias);
            phraseData.id = phraseId;
            phraseData.name = selectedValue.name;
            this.selectedPhrase.set(phraseData);

            // Restore equipment assignments
            const placeholderCount = phraseData.segments?.filter(s => s.type === 'placeholder').length || 0;
            const assignments: (EquipmentWithLotoPoint | null)[] = new Array(placeholderCount).fill(null);

            // Check if we have saved equipment and loto points
            const savedEquipment = zeroEnergy.templateEquipment as EquipmentDto[] | undefined;
            const savedLotoPoints = zeroEnergy.templateLotoPoints as LotoPointDto[] | undefined;

            if (savedEquipment && savedEquipment.length > 0) {
              savedEquipment.forEach((equipment, index) => {
                if (index < placeholderCount) {
                  const lotoPoint = savedLotoPoints?.[index];
                  assignments[index] = { equipment, lotoPoint };
                }
              });
            }

            this.equipmentAssignments.set(assignments);
          } catch (e) {
            console.error('Failed to restore phrase data:', e);
          }
        }
      }

      this.isInitialized = true;
    });
  }

  phraseOptions = computed(() => {
    const optionsSignal = this.valueService.getValueOptions('zeroEnergyTemplate');
    const values = optionsSignal();

    return values.map(opt => {
      // Parse phrase data from the value's alias field (stored as JSON)
      let phraseText = '';
      let placeholderCount = 0;

      try {
        const rawValues = this.valueService.getValuesByCategory('zeroEnergyTemplate');
        const fullValue = rawValues.find(v => v.id === opt.value);
        if (fullValue?.alias) {
          const phraseData: ZeroEnergyPhrase = JSON.parse(fullValue.alias);
          phraseText = phraseData.rawText || '';
          placeholderCount = phraseData.segments?.filter(s => s.type === 'placeholder').length || 0;
        }
      } catch (e) {
        // Parsing failed, use defaults
      }

      return {
        value: opt.value,
        label: opt.label + (placeholderCount > 0 ? ` (${placeholderCount} placeholder${placeholderCount !== 1 ? 's' : ''})` : ''),
        description: phraseText,
      };
    });
  });

  placeholders = computed(() => {
    const phrase = this.selectedPhrase();
    if (!phrase?.segments) return [];
    return phrase.segments.filter(s => s.type === 'placeholder');
  });

  previewSegments = computed(() => {
    const phrase = this.selectedPhrase();
    if (!phrase?.segments) return [];

    const assignments = this.equipmentAssignments();

    return phrase.segments.map(segment => {
      if (segment.type === 'placeholder' && segment.placeholderIndex !== undefined) {
        const assignment = assignments[segment.placeholderIndex];
        const displayText = assignment ? this.getEquipmentDisplay(assignment.equipment) : '';
        return {
          ...segment,
          substitutedText: displayText,
          hasSubstitution: !!assignment,
        };
      }
      return segment;
    });
  });

  onPhraseSelected(valueId: number): void {
    this.selectedPhraseId.set(valueId);

    // Get full phrase data
    const values = this.valueService.getValuesByCategory('zeroEnergyTemplate');
    const selectedValue = values.find(v => v.id === valueId);

    if (selectedValue?.alias) {
      try {
        const phraseData: ZeroEnergyPhrase = JSON.parse(selectedValue.alias);
        phraseData.id = valueId;
        phraseData.name = selectedValue.name;
        this.selectedPhrase.set(phraseData);

        // Initialize equipment assignments array
        const placeholderCount = phraseData.segments?.filter(s => s.type === 'placeholder').length || 0;
        this.equipmentAssignments.set(new Array(placeholderCount).fill(null));

        // Emit the phrase selection
        this.valueChange.emit({
          field: 'zeroEnergyTemplate',
          value: { id: valueId, name: selectedValue.name },
          entityType: 'zeroEnergy',
        });
      } catch (e) {
        console.error('Failed to parse phrase data:', e);
      }
    }
  }

  onAddNewPhrase(): void {
    // Branch to create-value flow for zeroEnergyTemplate category
    this.branchRequest.emit({
      flowType: 'create-value',
      field: 'zeroEnergyTemplate',
      initialData: { categoryName: 'zeroEnergyTemplate' },
    });
  }

  openEquipmentPicker(placeholderIndex: number): void {
    this.currentPlaceholderIndex.set(placeholderIndex);

    const dialogData: EquipmentConnectionDialogData = {
      mode: 'single',
      allowBrowse: true,
      allowDraw: true,
      allowUpload: false,
      // Enable quick-create mode for equipment without LOTO points
      requireLotoPointForUnassociated: true,
      lotoPointQuickCreateFields: ['tagNumber', 'description', 'location', 'isoPos', 'normPos'],
    };

    const dialogRef = this.dialog.open(EquipmentConnectionDialogComponent, {
      data: dialogData,
      width: '95vw',
      maxWidth: '1400px',
      height: '85vh',
      panelClass: 'equipment-connection-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((result: EquipmentConnectionDialogResult | undefined) => {
      if (result && !result.cancelled && result.selectedEquipment.length > 0) {
        this.handleEquipmentSelection(placeholderIndex, result);
      }
    });
  }

  private handleEquipmentSelection(placeholderIndex: number, result: EquipmentConnectionDialogResult): void {
    const equipment = result.selectedEquipment[0];

    // Check if the equipment has a LOTO point
    let lotoPoint: LotoPointDto | undefined;

    if (equipment.lotoPoints && equipment.lotoPoints.length > 0) {
      // Use existing LOTO point
      lotoPoint = equipment.lotoPoints[0];
    } else if (result.newlyCreatedLotoPoints && result.newlyCreatedLotoPoints.length > 0) {
      // Use newly created LOTO point from quick-create
      lotoPoint = result.newlyCreatedLotoPoints[0];
    }

    const assignment: EquipmentWithLotoPoint = {
      equipment,
      lotoPoint,
    };

    this.setEquipment(placeholderIndex, assignment);
  }

  clearEquipment(index: number): void {
    const assignments = [...this.equipmentAssignments()];
    assignments[index] = null;
    this.equipmentAssignments.set(assignments);
    this.emitEquipmentAssignments();
  }

  setEquipment(index: number, assignment: EquipmentWithLotoPoint): void {
    const assignments = [...this.equipmentAssignments()];
    assignments[index] = assignment;
    this.equipmentAssignments.set(assignments);
    this.emitEquipmentAssignments();
  }

  getEquipmentDisplay(equipment: EquipmentDto | null): string {
    if (!equipment) return '';

    // Try to get a meaningful display name
    if (equipment.tagNumber) return equipment.tagNumber;
    if ((equipment as any).lotoPoints?.[0]?.tagNumber) {
      return (equipment as any).lotoPoints[0].tagNumber;
    }
    return `Equipment #${equipment.id}`;
  }

  private emitEquipmentAssignments(): void {
    const assignments = this.equipmentAssignments().filter(a => a !== null) as EquipmentWithLotoPoint[];

    // Emit equipment
    this.valueChange.emit({
      field: 'templateEquipment',
      value: assignments.map(a => a.equipment),
      entityType: 'zeroEnergy',
    });

    this.valueChange.emit({
      field: 'templateEquipmentIds',
      value: assignments.map(a => a.equipment.id).filter(id => id),
      entityType: 'zeroEnergy',
    });

    // Emit LOTO points if available
    const lotoPoints = assignments.filter(a => a.lotoPoint).map(a => a.lotoPoint!);
    if (lotoPoints.length > 0) {
      this.valueChange.emit({
        field: 'templateLotoPoints',
        value: lotoPoints,
        entityType: 'zeroEnergy',
      });

      this.valueChange.emit({
        field: 'templateLotoPointIds',
        value: lotoPoints.map(lp => lp.id).filter(id => id),
        entityType: 'zeroEnergy',
      });
    }
  }
}
