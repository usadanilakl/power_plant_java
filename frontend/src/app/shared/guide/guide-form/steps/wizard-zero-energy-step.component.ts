import { Component, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { WizardStep, WizardContextFrame, StepDataPayload, WizardFlowType } from '../wizard-stack.types';
import { RfValueService } from '../../../../features/values/refactored/services/rf-value.service';
import { SearchableSelectInputComponent } from '../../../reactive-form/refactored/input-fields/searchable-select-input/searchable-select-input.component';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';

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
            Select equipment for each placeholder.
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

                  @if (equipmentAssignments()[i]) {
                    <div class="assigned-equipment">
                      <span class="equipment-tag">{{ getEquipmentDisplay(equipmentAssignments()[i]) }}</span>
                      <button mat-icon-button (click)="clearEquipment(i)" matTooltip="Clear">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  } @else {
                    <div class="equipment-actions">
                      <button mat-flat-button color="primary" (click)="openEquipmentPicker(i)">
                        <mat-icon>touch_app</mat-icon>
                        Select or Draw Equipment
                      </button>
                      <span class="action-hint">Browse P&ID to select existing or draw new</span>
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

    .equipment-tag {
      font-weight: 500;
      color: #2e7d32;
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

  step = input.required<WizardStep>();
  frame = input.required<WizardContextFrame>();

  valueChange = output<StepDataPayload>();
  branchRequest = output<{ flowType: WizardFlowType; field: string; initialData?: any }>();

  selectedPhraseId = signal<number | null>(null);
  selectedPhrase = signal<ZeroEnergyPhrase | null>(null);
  equipmentAssignments = signal<(EquipmentDto | null)[]>([]);

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
        const equipment = assignments[segment.placeholderIndex];
        return {
          ...segment,
          substitutedText: equipment ? this.getEquipmentDisplay(equipment) : '',
          hasSubstitution: !!equipment,
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

  // Store which placeholder we're currently selecting for
  private currentPlaceholderIndex = signal<number | null>(null);

  openEquipmentPicker(placeholderIndex: number): void {
    this.currentPlaceholderIndex.set(placeholderIndex);

    // Branch to equipment-picker-dialog flow which handles both
    // selecting existing equipment and drawing new with simplified form
    this.branchRequest.emit({
      flowType: 'select-equipment-for-zero-energy' as any,
      field: `zeroEnergy.templateEquipment`,
      initialData: {
        placeholderIndex,
        // Use simplified form when drawing - only essential fields
        simplifiedForm: true,
        requiredFields: ['tagNumber', 'description', 'eqType', 'location', 'normPos', 'isoPos'],
      },
    });
  }

  clearEquipment(index: number): void {
    const assignments = [...this.equipmentAssignments()];
    assignments[index] = null;
    this.equipmentAssignments.set(assignments);
    this.emitEquipmentAssignments();
  }

  setEquipment(index: number, equipment: EquipmentDto): void {
    const assignments = [...this.equipmentAssignments()];
    assignments[index] = equipment;
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
    const assignments = this.equipmentAssignments().filter(e => e !== null);
    this.valueChange.emit({
      field: 'templateEquipment',
      value: assignments,
      entityType: 'zeroEnergy',
    });

    this.valueChange.emit({
      field: 'templateEquipmentIds',
      value: assignments.map(e => e?.id).filter(id => id),
      entityType: 'zeroEnergy',
    });
  }
}
