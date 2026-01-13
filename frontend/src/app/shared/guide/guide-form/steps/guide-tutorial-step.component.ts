import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  ViewChild,
  TemplateRef,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GuideFormStep, GuideFormState } from '../guide-form.types';
import { GuideHintsPanelComponent } from './guide-hints-panel.component';

// Import components for dialogs
import { TagNumberGeneratorComponent } from '../../../../features/tag-number/tag-number-generator/tag-number-generator.component';
import { NamingConventionComponent } from '../../../../features/tag-number/naming-convention/naming-convention.component';
import { ZeroEnergyPhraseBuilderComponent } from '../../../reactive-form/refactored/input-fields/zero-energy-phrase-builder/zero-energy-phrase-builder.component';
import { EquipmentBrowserDialogComponent } from '../../../reactive-form/refactored/input-fields/equipment-browser-dialog/equipment-browser-dialog.component';
import { EquipmentShapeDrawerDialogComponent } from '../../../reactive-form/refactored/input-fields/equipment-shape-drawer-dialog/equipment-shape-drawer-dialog.component';
import { RfLotoPointDualFormComponent } from '../../../../features/loto-points/refactored/rf-loto-point-dual-form/rf-loto-point-dual-form.component';
import { GuideZeroEnergyDialogComponent, GuideZeroEnergyResult } from '../dialogs/guide-zero-energy-dialog.component';
import { GuideFileConnectionDialogComponent, GuideFileConnectionResult } from '../dialogs/guide-file-connection-dialog.component';

// Import services
import { LotoPointCounterpartService } from '../../../../features/loto-points/refactored/services/loto-point-counterpart.service';
import { RfLotoPointApiService } from '../../../../features/loto-points/refactored/services/rf-loto-point-api.service';
import { RfValueService } from '../../../../features/values/refactored/services/rf-value.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';

@Component({
  selector: 'app-guide-tutorial-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    GuideHintsPanelComponent,
    TagNumberGeneratorComponent,
    NamingConventionComponent,
    ZeroEnergyPhraseBuilderComponent,
    EquipmentBrowserDialogComponent,
    EquipmentShapeDrawerDialogComponent,
    RfLotoPointDualFormComponent,
    GuideZeroEnergyDialogComponent,
    GuideFileConnectionDialogComponent,
  ],
  template: `
    <div class="tutorial-step">
      <h3 class="step-title">{{ step().title }}</h3>
      <p class="step-description">{{ step().description }}</p>

      <!-- Current Value Display -->
      @if (currentValue()) {
        <div class="current-value">
          <mat-icon>check_circle</mat-icon>
          <div class="value-content">
            <span class="value-label">Current value:</span>
            <span class="value-text">{{ currentValue() }}</span>
          </div>
          <button mat-icon-button class="edit-btn" (click)="onAction()" matTooltip="Edit">
            <mat-icon>edit</mat-icon>
          </button>
        </div>
      }

      <!-- Explanation Section -->
      @if (step().tutorialConfig?.explanation) {
        <div class="explanation-section">
          <p class="explanation">{{ step().tutorialConfig?.explanation }}</p>
        </div>
      }

      <!-- Examples -->
      @if (step().tutorialConfig?.examples?.length) {
        <div class="examples-section">
          <div class="section-header">
            <mat-icon>lightbulb</mat-icon>
            <span>Examples</span>
          </div>
          <ul class="examples-list">
            @for (example of step().tutorialConfig?.examples; track example) {
              <li>{{ example }}</li>
            }
          </ul>
        </div>
      }

      <!-- Conventions -->
      @if (step().tutorialConfig?.conventions?.length) {
        <div class="conventions-section">
          <div class="section-header">
            <mat-icon>rule</mat-icon>
            <span>Conventions</span>
          </div>
          <ul class="conventions-list">
            @for (convention of step().tutorialConfig?.conventions; track convention) {
              <li>{{ convention }}</li>
            }
          </ul>
        </div>
      }

      <!-- Action Buttons -->
      <div class="action-section">
        <button
          mat-flat-button
          color="primary"
          class="action-btn"
          (click)="onAction()"
        >
          @if (step().tutorialConfig?.actionIcon) {
            <mat-icon>{{ step().tutorialConfig?.actionIcon }}</mat-icon>
          }
          {{ currentValue() ? 'Edit Value' : (step().tutorialConfig?.actionLabel || 'Continue') }}
        </button>

        @if (step().tutorialConfig?.canSkip && !currentValue()) {
          <button
            mat-stroked-button
            class="skip-btn"
            (click)="onSkip.emit()"
          >
            {{ step().tutorialConfig?.skipLabel || 'Skip' }}
          </button>
        }
      </div>

      @if (step().hints && step().hints!.length > 0) {
        <app-guide-hints-panel [hints]="step().hints!" [compact]="true" />
      }
    </div>

    <!-- Tag Number Dialog -->
    <ng-template #tagNumberDialog>
      <div class="dialog-wrapper">
        <div class="dialog-header">
          <h2>Generate Tag Number</h2>
          <button mat-icon-button (click)="closeDialog()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="dialog-body">
          <app-tag-number-generator
            (tagGenerated)="onTagGenerated($event)"
            (cancelled)="closeDialog()"
          />
        </div>
      </div>
    </ng-template>

    <!-- Naming Convention Dialog -->
    <ng-template #namingConventionDialog>
      <div class="dialog-wrapper naming-dialog">
        <div class="dialog-header">
          <h2>Description Builder</h2>
          <button mat-icon-button (click)="closeDialog()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="dialog-body">
          <app-naming-convention #namingConv />
          <div class="dialog-footer">
            <mat-form-field class="description-input" appearance="outline">
              <mat-label>Final Description</mat-label>
              <input
                matInput
                [(ngModel)]="manualDescription"
                placeholder="Type or build using tools above..."
              />
            </mat-form-field>
            <div class="footer-actions">
              <button mat-stroked-button (click)="pasteFromClipboard()">
                <mat-icon>content_paste</mat-icon>
                Paste from Clipboard
              </button>
              <button
                mat-flat-button
                color="primary"
                [disabled]="!manualDescription"
                (click)="useDescription()"
              >
                <mat-icon>check</mat-icon>
                Use This Description
              </button>
            </div>
          </div>
        </div>
      </div>
    </ng-template>

    <!-- Positions Dialog -->
    <ng-template #positionsDialog>
      <div class="dialog-wrapper">
        <div class="dialog-header">
          <h2>Set Positions</h2>
          <button mat-icon-button (click)="closeDialog()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="dialog-body positions-dialog">
          <p class="dialog-instructions">
            Select the Normal and Isolated positions for this LOTO point.
            This determines how the equipment should be positioned during normal operation
            and during lockout/tagout.
          </p>

          <div class="position-fields">
            <div class="position-field">
              <label>Normal Position</label>
              <p class="field-help">How is this equipment positioned during normal plant operation?</p>
              <select [(ngModel)]="selectedNormPos" class="position-select">
                <option [ngValue]="null">-- Select Normal Position --</option>
                @for (pos of positionOptions; track pos.id) {
                  <option [ngValue]="pos">{{ pos.name }}</option>
                }
              </select>
            </div>

            <div class="position-field">
              <label>Isolated Position</label>
              <p class="field-help">How should this equipment be positioned for safe isolation?</p>
              <select [(ngModel)]="selectedIsoPos" class="position-select">
                <option [ngValue]="null">-- Select Isolated Position --</option>
                @for (pos of positionOptions; track pos.id) {
                  <option [ngValue]="pos">{{ pos.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="dialog-footer row">
            <button
              mat-flat-button
              color="primary"
              [disabled]="!selectedNormPos || !selectedIsoPos"
              (click)="savePositions()"
            >
              <mat-icon>check</mat-icon>
              Save Positions
            </button>
          </div>
        </div>
      </div>
    </ng-template>

    <!-- Zero Energy Dialog - Tab-based: Phrase and Equipment -->
    <ng-template #zeroEnergyDialog>
      <div class="dialog-wrapper zero-energy-dialog">
        <div class="dialog-header">
          <h2>Zero Energy Configuration</h2>
          <button mat-icon-button (click)="closeDialog()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Step guidance banner -->
        <div class="ze-guidance">
          <div class="guidance-step" [class.completed]="selectedZeroEnergyPhrase()">
            <span class="step-number">1</span>
            <span class="step-text">Select a verification phrase</span>
            @if (selectedZeroEnergyPhrase()) {
              <mat-icon class="step-check">check_circle</mat-icon>
            }
          </div>
          <mat-icon class="step-arrow">arrow_forward</mat-icon>
          <div class="guidance-step" [class.active]="selectedZeroEnergyPhrase() && needsMoreEquipment()" [class.completed]="!needsMoreEquipment() && selectedZeroEnergyEquipment().length > 0">
            <span class="step-number">2</span>
            <span class="step-text">Select equipment for placeholders</span>
            @if (!needsMoreEquipment() && selectedZeroEnergyEquipment().length > 0) {
              <mat-icon class="step-check">check_circle</mat-icon>
            }
          </div>
        </div>

        <div class="ze-tabs">
          <button class="ze-tab" [class.active]="zeroEnergyTab() === 'phrase'" (click)="zeroEnergyTab.set('phrase')">
            <mat-icon>text_snippet</mat-icon>
            Phrase Builder
          </button>
          <button class="ze-tab"
                  [class.active]="zeroEnergyTab() === 'equipment'"
                  [class.needs-attention]="needsMoreEquipment()"
                  (click)="zeroEnergyTab.set('equipment')">
            <mat-icon>precision_manufacturing</mat-icon>
            Equipment ({{ selectedZeroEnergyEquipment().length }})
            @if (needsMoreEquipment()) {
              <span class="attention-badge">!</span>
            }
          </button>
        </div>
        <div class="ze-content">
          @if (zeroEnergyTab() === 'phrase') {
            <div class="ze-phrase-tab">
              <div class="tips-panel">
                <div class="tip">
                  <mat-icon>lightbulb</mat-icon>
                  <span>Select or create a verification phrase. Phrases can have placeholders like <code>[tag1]</code>, <code>[tag2]</code> for equipment references.</span>
                </div>
              </div>
              <app-zero-energy-phrase-builder
                #phraseBuilder
                label="Zero Energy Phrase"
                [selectedEquipment]="selectedZeroEnergyEquipment()"
                [initialPhraseId]="selectedZeroEnergyPhrase()?.phraseId"
                (clipboardItemSelected)="onZeroEnergyClipboardSelected($event)"
                (placeholderCountChange)="updateRequiredPlaceholderCount($event)"
              />

              <!-- Equipment selection prompt -->
              @if (needsMoreEquipment()) {
                <div class="equipment-prompt">
                  <mat-icon>warning</mat-icon>
                  <div class="prompt-content">
                    <strong>Equipment selection required</strong>
                    <p>Your phrase has {{ getRequiredPlaceholderCount() }} placeholder(s). Please select {{ getRequiredPlaceholderCount() - selectedZeroEnergyEquipment().length }} more equipment item(s).</p>
                    <button mat-stroked-button color="primary" (click)="zeroEnergyTab.set('equipment')">
                      <mat-icon>arrow_forward</mat-icon>
                      Go to Equipment Tab
                    </button>
                  </div>
                </div>
              }

              @if (selectedZeroEnergyEquipment().length > 0) {
                <div class="selected-equipment-summary">
                  <span class="summary-label">Equipment for placeholders ({{ selectedZeroEnergyEquipment().length }}/{{ getRequiredPlaceholderCount() || '?' }}):</span>
                  @for (eq of selectedZeroEnergyEquipment(); track eq.id; let i = $index) {
                    <span class="eq-tag">
                      [tag{{ i + 1 }}] {{ getEquipmentDisplay(eq) }}
                      <mat-icon class="remove-tag" (click)="removeZeroEnergyEquipment(i)">close</mat-icon>
                    </span>
                  }
                </div>
              }
            </div>
          } @else {
            <div class="ze-equipment-tab">
              <div class="tips-panel">
                <div class="tip">
                  <mat-icon>lightbulb</mat-icon>
                  <span>Click on equipment shapes in the P&ID to select them. Selected equipment will fill placeholders [tag1], [tag2], etc. in order.</span>
                </div>
                @if (needsMoreEquipment()) {
                  <div class="tip warning">
                    <mat-icon>info</mat-icon>
                    <span>Select {{ getRequiredPlaceholderCount() - selectedZeroEnergyEquipment().length }} more equipment to fill all placeholders.</span>
                  </div>
                }
                <div class="tip">
                  <mat-icon>add_circle</mat-icon>
                  <span><strong>Need a new LOTO point?</strong> You can select equipment that doesn't have a LOTO point yet - the system will prompt you to create one.</span>
                </div>
              </div>
              <app-equipment-browser-dialog
                (equipmentSelected)="onEquipmentSelected($event)"
                (close)="zeroEnergyTab.set('phrase')"
              />
            </div>
          }
        </div>
        <div class="dialog-footer-bar">
          <button mat-stroked-button (click)="closeDialog()">Cancel</button>
          <button mat-flat-button color="primary" (click)="saveZeroEnergy()" [disabled]="needsMoreEquipment()">
            <mat-icon>check</mat-icon>
            Save Zero Energy
          </button>
        </div>
      </div>
    </ng-template>

    <!-- Equipment Browser Dialog (standalone) -->
    <ng-template #equipmentBrowserDialog>
      <app-equipment-browser-dialog
        (equipmentSelected)="onEquipmentSelected($event)"
        (close)="closeEquipmentBrowser()"
      />
    </ng-template>

    <!-- File Connection Dialog -->
    <ng-template #fileConnectionDialog>
      <div class="dialog-wrapper file-connection-dialog">
        <div class="dialog-header">
          <h2>Connect to P&ID File</h2>
          <button mat-icon-button (click)="closeDialog()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Info/Warning Banner -->
        <div class="file-connection-info">
          <div class="info-content">
            <mat-icon class="info-icon">info</mat-icon>
            <div class="info-text">
              <strong>Connect this LOTO point to a location on a P&ID file.</strong>
              <p>Select an existing equipment shape or draw a new one on a P&ID.</p>
            </div>
          </div>
          @if (linkedEquipment().length > 0) {
            <div class="linked-summary">
              <span class="linked-count">{{ linkedEquipment().length }} equipment linked</span>
              @for (eq of linkedEquipment(); track eq.id; let i = $index) {
                <span class="linked-chip">
                  {{ getEquipmentDisplay(eq) }}
                  <mat-icon class="chip-remove" (click)="removeLinkedEquipment(i)">close</mat-icon>
                </span>
              }
            </div>
          }
        </div>

        <!-- Tabs for Browse / Draw -->
        <div class="fc-tabs">
          <button class="fc-tab" [class.active]="fileConnectionTab() === 'browse'" (click)="fileConnectionTab.set('browse')">
            <mat-icon>search</mat-icon>
            Select Existing Shape
          </button>
          <button class="fc-tab" [class.active]="fileConnectionTab() === 'draw'" (click)="fileConnectionTab.set('draw')">
            <mat-icon>edit</mat-icon>
            Draw New Shape
          </button>
        </div>

        <!-- Tab Content -->
        <div class="fc-content">
          @if (fileConnectionTab() === 'browse') {
            <!-- Browse existing equipment -->
            <div class="fc-browse-tab">
              <div class="tips-panel">
                <div class="tip">
                  <mat-icon>lightbulb</mat-icon>
                  <span>Click on a shape in the P&ID image to select it.</span>
                </div>
                <div class="tip warning">
                  <mat-icon>warning</mat-icon>
                  <span>If selected equipment already has a LOTO point, your selection will replace that association.</span>
                </div>
              </div>
              <app-equipment-browser-dialog
                (equipmentSelected)="onFileEquipmentSelected($event)"
                (close)="fileConnectionTab.set('browse')"
              />
            </div>
          } @else {
            <!-- Draw new shape -->
            <div class="fc-draw-tab">
              <div class="tips-panel">
                <div class="tip">
                  <mat-icon>mouse</mat-icon>
                  <span><strong>How to draw:</strong> Select a P&ID file, click "Start Drawing", then right-click and drag to draw a rectangle around the equipment.</span>
                </div>
                <div class="tip">
                  <mat-icon>save</mat-icon>
                  <span>The shape will be automatically saved when you finish drawing.</span>
                </div>
                <div class="tip warning">
                  <mat-icon>warning</mat-icon>
                  <span>Drawing creates new equipment. If you need to select existing equipment, use the "Select Existing Shape" tab.</span>
                </div>
              </div>
              <app-equipment-shape-drawer-dialog
                (saveSuccess)="onShapeDrawn($event)"
                (close)="fileConnectionTab.set('browse')"
              />
            </div>
          }
        </div>

        <div class="dialog-footer-bar">
          <button mat-stroked-button (click)="closeDialog()">Cancel</button>
          <button mat-flat-button color="primary" [disabled]="linkedEquipment().length === 0" (click)="saveFileConnection()">
            <mat-icon>check</mat-icon>
            Save Connection ({{ linkedEquipment().length }})
          </button>
        </div>
      </div>
    </ng-template>

    <!-- Counterpart Dialog - Uses Dual Form -->
    <ng-template #counterpartDialog>
      <div class="dialog-wrapper counterpart-dialog">
        <div class="dialog-header">
          <h2>Create Counterpart</h2>
          <button mat-icon-button (click)="closeDialog()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="dialog-body counterpart-body">
          @if (primaryLotoPointForDualForm()) {
            <p class="dialog-instructions">
              Use the dual form below to create a counterpart LOTO point.
              The counterpart will be linked to the primary point you're creating.
            </p>
            <app-rf-loto-point-dual-form
              [primaryLotoPoint]="primaryLotoPointForDualForm()!"
              [fieldsToDisplay]="['tagNumber', 'description', 'specificLocation', 'eqType', 'isoPos', 'normPos', 'location']"
              (counterpartSaved)="onCounterpartSaved($event)"
              (bothSaved)="onBothSavedFromDualForm($event)"
              (formClosed)="closeDialog()"
            />
          } @else {
            <div class="no-counterpart">
              <mat-icon class="info-icon">info</mat-icon>
              <p>
                A tag number is required to create a counterpart.
                Please complete the tag number step first.
              </p>
              <p class="hint">
                Current tag: {{ state().lotoPointData?.tagNumber || 'Not set' }}
              </p>
            </div>
          }
        </div>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .tutorial-step {
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

      .current-value {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--success-bg, #e8f5e9);
        border-radius: 8px;
        border-left: 4px solid var(--success-color, #4caf50);
      }

      .current-value mat-icon {
        color: var(--success-color, #4caf50);
      }

      .value-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .value-label {
        font-size: 11px;
        color: var(--text-tertiary, #999);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .value-text {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary, #333);
        word-break: break-word;
      }

      .edit-btn {
        width: 32px;
        height: 32px;
      }

      .explanation-section {
        padding: 12px 16px;
        background: var(--info-bg, #e3f2fd);
        border-radius: 8px;
      }

      .explanation {
        margin: 0;
        font-size: 13px;
        line-height: 1.6;
        color: var(--text-secondary, #666);
      }

      .examples-section,
      .conventions-section {
        padding: 12px 16px;
        background: var(--surface-alt, #f5f5f5);
        border-radius: 8px;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary, #333);
      }

      .section-header mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--primary-color, #1976d2);
      }

      .examples-list,
      .conventions-list {
        margin: 0;
        padding-left: 24px;
        font-size: 12px;
        color: var(--text-secondary, #666);
        line-height: 1.8;
      }

      .examples-list li {
        font-family: monospace;
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 6px;
        border-radius: 4px;
        margin-bottom: 4px;
      }

      .action-section {
        display: flex;
        gap: 12px;
        margin-top: 8px;
      }

      .action-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .skip-btn {
        color: var(--text-secondary, #666);
      }

      /* Dialog styles */
      .dialog-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-width: 400px;
      }

      .naming-dialog {
        min-width: 700px;
      }

      .zero-energy-dialog {
        min-width: 800px;
        height: 100%;
      }

      .equipment-dialog {
        min-width: 900px;
        height: 100%;
      }

      .counterpart-dialog {
        min-width: 1000px;
        height: 100%;
      }

      .counterpart-body {
        flex: 1;
        overflow: auto;
      }

      .full-height-body {
        display: flex;
        flex-direction: column;
        padding: 0 !important;
      }

      .browser-container {
        flex: 1;
        overflow: auto;
        padding: 16px;
      }

      .linked-equipment-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--surface-alt, #f5f5f5);
        border-bottom: 1px solid var(--border-color, #e0e0e0);
        flex-wrap: wrap;
      }

      .linked-count {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-primary, #333);
      }

      .linked-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .linked-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px 4px 12px;
        background: var(--primary-color, #1976d2);
        color: white;
        border-radius: 16px;
        font-size: 12px;
      }

      .chip-remove {
        width: 20px !important;
        height: 20px !important;
        line-height: 20px !important;
      }

      .chip-remove mat-icon {
        font-size: 14px !important;
        width: 14px !important;
        height: 14px !important;
        color: white;
      }

      .dialog-footer-fixed {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding: 12px 16px;
        border-top: 1px solid var(--border-color, #e0e0e0);
        background: white;
      }

      .dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 16px 12px;
        border-bottom: 1px solid var(--border-color, #e0e0e0);
      }

      .dialog-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
      }

      .dialog-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      .dialog-footer {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-top: 16px;
        border-top: 1px solid var(--border-color, #e0e0e0);
        margin-top: 16px;
      }

      .dialog-footer.row {
        flex-direction: row;
        justify-content: flex-end;
      }

      .description-input {
        width: 100%;
      }

      .footer-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .dialog-instructions {
        margin: 0 0 16px;
        font-size: 14px;
        color: var(--text-secondary, #666);
        line-height: 1.5;
      }

      .position-fields {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .position-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .position-field label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary, #333);
      }

      .field-help {
        margin: 0;
        font-size: 12px;
        color: var(--text-tertiary, #999);
      }

      .position-select {
        padding: 10px 12px;
        font-size: 14px;
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 4px;
        background: white;
        cursor: pointer;
      }

      .position-select:focus {
        outline: none;
        border-color: var(--primary-color, #1976d2);
      }

      /* Equipment section styles */
      .equipment-section,
      .linked-equipment {
        margin-top: 16px;
        padding: 16px;
        background: var(--surface-alt, #f5f5f5);
        border-radius: 8px;
      }

      .equipment-section h4,
      .linked-equipment h4 {
        margin: 0 0 12px;
        font-size: 14px;
        font-weight: 500;
      }

      .empty-equipment {
        margin: 0 0 12px;
        font-size: 13px;
        color: var(--text-tertiary, #999);
        font-style: italic;
      }

      .equipment-list {
        list-style: none;
        margin: 0 0 12px;
        padding: 0;
      }

      .equipment-list li {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: white;
        border-radius: 4px;
        margin-bottom: 8px;
        font-size: 13px;
      }

      .equipment-list li span:first-child {
        font-family: monospace;
        color: var(--primary-color, #1976d2);
        font-weight: 500;
        min-width: 50px;
      }

      .equipment-list li span:nth-child(2) {
        flex: 1;
      }

      .equipment-list li button {
        width: 24px;
        height: 24px;
        line-height: 24px;
      }

      .equipment-list li button mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      /* Counterpart dialog styles */
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 32px;
      }

      .counterpart-preview h4 {
        margin: 0 0 8px;
        font-size: 14px;
        font-weight: 500;
      }

      .counterpart-fields {
        background: var(--surface-alt, #f5f5f5);
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
      }

      .field-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid var(--border-light, #e8e8e8);
      }

      .field-row:last-child {
        border-bottom: none;
      }

      .field-row .field-label {
        font-size: 12px;
        color: var(--text-tertiary, #999);
      }

      .field-row .field-value {
        font-size: 14px;
        font-weight: 500;
      }

      .field-row .field-value.tag {
        font-family: monospace;
        color: var(--primary-color, #1976d2);
      }

      .transformation-note {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: var(--info-bg, #e3f2fd);
        border-radius: 8px;
        font-size: 13px;
        color: var(--text-secondary, #666);
      }

      .transformation-note mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--primary-color, #1976d2);
      }

      .no-counterpart {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 24px;
      }

      .no-counterpart .info-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--text-tertiary, #999);
        margin-bottom: 16px;
      }

      .no-counterpart p {
        margin: 0 0 12px;
        color: var(--text-secondary, #666);
      }

      .no-counterpart .hint {
        font-family: monospace;
        font-size: 13px;
        color: var(--text-tertiary, #999);
      }

      .no-counterpart .warning {
        font-size: 13px;
        color: var(--warning-color, #ff9800);
        margin-top: 8px;
      }

      /* Zero Energy Tab-based Dialog */
      .ze-tabs {
        display: flex;
        gap: 0;
        border-bottom: 1px solid var(--border-color, #e0e0e0);
        background: var(--surface-alt, #f5f5f5);
      }

      .ze-tab {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary, #666);
        border-bottom: 3px solid transparent;
        transition: all 0.2s ease;
      }

      .ze-tab:hover {
        background: rgba(0, 0, 0, 0.04);
        color: var(--text-primary, #333);
      }

      .ze-tab.active {
        color: var(--primary-color, #1976d2);
        border-bottom-color: var(--primary-color, #1976d2);
        background: white;
      }

      .ze-tab mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .ze-content {
        flex: 1;
        overflow: auto;
        display: flex;
        flex-direction: column;
      }

      .ze-phrase-tab {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .ze-equipment-tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .ze-equipment-tab app-equipment-browser-dialog {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .selected-equipment-summary {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: var(--surface-alt, #f5f5f5);
        border-radius: 8px;
      }

      .summary-label {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-secondary, #666);
      }

      .eq-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px 4px 12px;
        background: var(--primary-color, #1976d2);
        color: white;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
      }

      .remove-tag {
        font-size: 14px !important;
        width: 14px !important;
        height: 14px !important;
        cursor: pointer;
        opacity: 0.8;
      }

      .remove-tag:hover {
        opacity: 1;
      }

      .hint-text {
        margin: 0;
        font-size: 13px;
        color: var(--text-tertiary, #999);
        font-style: italic;
      }

      /* File Connection Dialog */
      .file-connection-dialog {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .linked-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: var(--surface-alt, #f5f5f5);
        border-bottom: 1px solid var(--border-color, #e0e0e0);
        font-size: 13px;
      }

      .linked-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px 4px 12px;
        background: var(--primary-color, #1976d2);
        color: white;
        border-radius: 16px;
        font-size: 12px;
      }

      .browser-full {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
      }

      .browser-full app-equipment-browser-dialog {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .dialog-footer-bar {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding: 12px 16px;
        border-top: 1px solid var(--border-color, #e0e0e0);
        background: white;
        flex-shrink: 0;
      }

      /* File Connection Dialog Enhancements */
      .file-connection-info {
        padding: 12px 16px;
        background: var(--info-bg, #e3f2fd);
        border-bottom: 1px solid var(--border-color, #e0e0e0);
      }

      .info-content {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }

      .info-content .info-icon {
        color: var(--primary-color, #1976d2);
        flex-shrink: 0;
      }

      .info-text {
        flex: 1;
      }

      .info-text strong {
        display: block;
        margin-bottom: 4px;
        font-size: 14px;
      }

      .info-text p {
        margin: 0;
        font-size: 13px;
        color: var(--text-secondary, #666);
      }

      .linked-summary {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
      }

      .linked-count {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-secondary, #666);
      }

      .linked-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px 4px 12px;
        background: var(--primary-color, #1976d2);
        color: white;
        border-radius: 16px;
        font-size: 12px;
      }

      .chip-remove {
        font-size: 14px !important;
        width: 14px !important;
        height: 14px !important;
        cursor: pointer;
        opacity: 0.8;
      }

      .chip-remove:hover {
        opacity: 1;
      }

      .fc-tabs {
        display: flex;
        gap: 0;
        border-bottom: 1px solid var(--border-color, #e0e0e0);
        background: var(--surface-alt, #f5f5f5);
      }

      .fc-tab {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary, #666);
        border-bottom: 3px solid transparent;
        transition: all 0.2s ease;
      }

      .fc-tab:hover {
        background: rgba(0, 0, 0, 0.04);
        color: var(--text-primary, #333);
      }

      .fc-tab.active {
        color: var(--primary-color, #1976d2);
        border-bottom-color: var(--primary-color, #1976d2);
        background: white;
      }

      .fc-tab mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .fc-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
      }

      .fc-browse-tab,
      .fc-draw-tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .fc-browse-tab app-equipment-browser-dialog,
      .fc-draw-tab app-equipment-shape-drawer-dialog {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .tips-panel {
        padding: 12px 16px;
        background: var(--surface-alt, #f8f9fa);
        border-bottom: 1px solid var(--border-color, #e0e0e0);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .tip {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 13px;
        color: var(--text-secondary, #666);
      }

      .tip mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        color: var(--primary-color, #1976d2);
      }

      .tip.warning mat-icon {
        color: var(--warning-color, #ff9800);
      }

      .tip.warning {
        color: var(--text-primary, #333);
      }

      .tip code {
        background: rgba(0, 0, 0, 0.08);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
      }

      /* Zero Energy Guidance Banner */
      .ze-guidance {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 12px 16px;
        background: var(--surface-alt, #f5f5f5);
        border-bottom: 1px solid var(--border-color, #e0e0e0);
      }

      .guidance-step {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: white;
        border-radius: 20px;
        border: 2px solid var(--border-color, #e0e0e0);
        font-size: 13px;
        color: var(--text-secondary, #666);
        transition: all 0.3s ease;
      }

      .guidance-step.active {
        border-color: var(--primary-color, #1976d2);
        background: var(--info-bg, #e3f2fd);
        color: var(--primary-color, #1976d2);
        animation: pulse-border 1.5s infinite;
      }

      .guidance-step.completed {
        border-color: var(--success-color, #4caf50);
        background: var(--success-bg, #e8f5e9);
        color: var(--success-color, #4caf50);
      }

      .step-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: var(--text-tertiary, #999);
        color: white;
        border-radius: 50%;
        font-size: 12px;
        font-weight: 600;
      }

      .guidance-step.active .step-number {
        background: var(--primary-color, #1976d2);
      }

      .guidance-step.completed .step-number {
        background: var(--success-color, #4caf50);
      }

      .step-check {
        color: var(--success-color, #4caf50);
        font-size: 20px !important;
        width: 20px !important;
        height: 20px !important;
      }

      .step-arrow {
        color: var(--text-tertiary, #999);
      }

      /* Blinking attention for equipment tab */
      .ze-tab.needs-attention {
        animation: blink-attention 1s infinite;
      }

      .attention-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        background: var(--warning-color, #ff9800);
        color: white;
        border-radius: 50%;
        font-size: 12px;
        font-weight: 700;
        margin-left: 4px;
      }

      @keyframes blink-attention {
        0%, 100% {
          background: transparent;
        }
        50% {
          background: rgba(255, 152, 0, 0.15);
        }
      }

      @keyframes pulse-border {
        0%, 100% {
          box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
        }
        50% {
          box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.1);
        }
      }

      /* Equipment selection prompt */
      .equipment-prompt {
        display: flex;
        gap: 12px;
        padding: 16px;
        background: var(--warning-bg, #fff3e0);
        border: 1px solid var(--warning-color, #ff9800);
        border-radius: 8px;
        margin-top: 16px;
      }

      .equipment-prompt mat-icon {
        color: var(--warning-color, #ff9800);
        flex-shrink: 0;
      }

      .prompt-content {
        flex: 1;
      }

      .prompt-content strong {
        display: block;
        margin-bottom: 4px;
        color: var(--text-primary, #333);
      }

      .prompt-content p {
        margin: 0 0 12px;
        font-size: 13px;
        color: var(--text-secondary, #666);
      }
    `,
  ],
})
export class GuideTutorialStepComponent implements OnInit {
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private counterpartService = inject(LotoPointCounterpartService);
  private lotoPointApi = inject(RfLotoPointApiService);
  private valueService = inject(RfValueService);

  @ViewChild('tagNumberDialog') tagNumberDialogTemplate!: TemplateRef<any>;
  @ViewChild('namingConventionDialog') namingConventionDialogTemplate!: TemplateRef<any>;
  @ViewChild('positionsDialog') positionsDialogTemplate!: TemplateRef<any>;
  @ViewChild('zeroEnergyDialog') zeroEnergyDialogTemplate!: TemplateRef<any>;
  @ViewChild('equipmentBrowserDialog') equipmentBrowserDialogTemplate!: TemplateRef<any>;
  @ViewChild('fileConnectionDialog') fileConnectionDialogTemplate!: TemplateRef<any>;
  @ViewChild('counterpartDialog') counterpartDialogTemplate!: TemplateRef<any>;

  step = input.required<GuideFormStep>();
  state = input.required<GuideFormState>();

  onValueChange = output<{ field: string; value: any }>();
  onSkip = output<void>();
  onComplete = output<void>();

  private dialogRef: any = null;
  private equipmentBrowserRef: any = null;

  // Dialog state
  manualDescription = '';
  selectedNormPos: { id: number; name: string } | null = null;
  selectedIsoPos: { id: number; name: string } | null = null;

  // Zero energy state
  zeroEnergyTab = signal<'phrase' | 'equipment'>('phrase');
  selectedZeroEnergyEquipment = signal<EquipmentDto[]>([]);
  selectedZeroEnergyPhrase = signal<any>(null);
  requiredPlaceholderCount = signal<number>(0);

  // File connection state
  fileConnectionTab = signal<'browse' | 'draw'>('browse');
  linkedEquipment = signal<EquipmentDto[]>([]);

  // Counterpart state - no longer using generated counterpart, using dual form instead
  isLoadingCounterpart = signal(false);
  generatedCounterpart = signal<LotoPointDto | null>(null);

  // Position options (would normally come from a service)
  positionOptions = [
    { id: 1, name: 'OPEN' },
    { id: 2, name: 'CLOSED' },
    { id: 3, name: 'LOCKED OPEN' },
    { id: 4, name: 'LOCKED CLOSED' },
    { id: 5, name: 'ENERGIZED' },
    { id: 6, name: 'DE-ENERGIZED' },
    { id: 7, name: 'RACKED IN' },
    { id: 8, name: 'RACKED OUT' },
  ];

  // Computed: Create LotoPointDto for dual form from current state
  primaryLotoPointForDualForm = computed(() => {
    const lotoData = this.state().lotoPointData;
    if (!lotoData?.tagNumber) return null;

    return new LotoPointDto({
      tagNumber: lotoData.tagNumber,
      description: lotoData.description,
      unit: lotoData.unit,
      specificLocation: lotoData.specificLocation,
      normPos: lotoData.normPos as any,
      isoPos: lotoData.isoPos as any,
      location: lotoData.location as any,
      eqType: lotoData.eqType as any,
      zeroEnergy: lotoData.zeroEnergy,
    });
  });

  ngOnInit(): void {
    // Force reload zero energy phrase category to ensure options are available
    this.valueService.refreshCategory('zeroEnergyTemplate');
  }

  // Compute current value based on topic
  currentValue = computed(() => {
    const topic = this.step().tutorialTopic;
    const lotoData = this.state().lotoPointData;
    if (!lotoData) return null;

    switch (topic) {
      case 'tag-number':
        return lotoData.tagNumber || null;
      case 'description':
        return lotoData.description || null;
      case 'positions':
        if (lotoData.normPos && lotoData.isoPos) {
          return `Normal: ${lotoData.normPos.name}, Isolated: ${lotoData.isoPos.name}`;
        }
        return null;
      case 'zero-energy':
        return lotoData.zeroEnergy?.zeroEnergyTemplate?.name || null;
      case 'file-connection':
        return lotoData.equipmentIds?.length
          ? `${lotoData.equipmentIds.length} equipment linked`
          : null;
      case 'counterpart':
        return lotoData.counterpartId ? `Linked to #${lotoData.counterpartId}` : null;
      default:
        return null;
    }
  });

  onAction(): void {
    const topic = this.step().tutorialTopic;

    switch (topic) {
      case 'tag-number':
        this.openTagNumberDialog();
        break;
      case 'description':
        this.openNamingConventionDialog();
        break;
      case 'positions':
        this.openPositionsDialog();
        break;
      case 'zero-energy':
        this.openZeroEnergyDialog();
        break;
      case 'file-connection':
        this.openFileConnectionDialog();
        break;
      case 'counterpart':
        this.openCounterpartDialog();
        break;
      default:
        this.onComplete.emit();
    }
  }

  private openTagNumberDialog(): void {
    this.dialogRef = this.dialog.open(this.tagNumberDialogTemplate, {
      width: '500px',
      maxHeight: '80vh',
      panelClass: 'guide-dialog',
    });
  }

  private openNamingConventionDialog(): void {
    this.manualDescription = this.state().lotoPointData?.description || '';
    this.dialogRef = this.dialog.open(this.namingConventionDialogTemplate, {
      width: '90vw',
      maxWidth: '900px',
      height: '85vh',
      panelClass: 'guide-dialog',
    });
  }

  private openPositionsDialog(): void {
    const lotoData = this.state().lotoPointData;
    this.selectedNormPos = lotoData?.normPos || null;
    this.selectedIsoPos = lotoData?.isoPos || null;

    this.dialogRef = this.dialog.open(this.positionsDialogTemplate, {
      width: '450px',
      maxHeight: '80vh',
      panelClass: 'guide-dialog',
    });
  }

  private openZeroEnergyDialog(): void {
    // Use the new dedicated guide zero energy dialog
    const lotoData = this.state().lotoPointData;

    this.dialogRef = this.dialog.open(GuideZeroEnergyDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '85vh',
      panelClass: 'guide-dialog',
      data: {
        initialPhraseId: lotoData?.zeroEnergy?.zeroEnergyTemplate?.id || null,
        initialEquipment: lotoData?.zeroEnergy?.templateEquipment || []
      }
    });

    this.dialogRef.componentInstance.confirmed.subscribe((result: GuideZeroEnergyResult) => {
      this.onZeroEnergyConfirmed(result);
    });

    this.dialogRef.componentInstance.cancelled.subscribe(() => {
      this.closeDialog();
    });
  }

  private onZeroEnergyConfirmed(result: GuideZeroEnergyResult): void {
    const zeroEnergy = {
      zeroEnergyTemplate: { id: result.phraseId, name: result.phraseName },
      templateEquipment: result.templateEquipment,
      templateEquipmentIds: result.templateEquipmentIds
    };
    this.onValueChange.emit({ field: 'zeroEnergy', value: zeroEnergy });
    this.closeDialog();
    this.onComplete.emit();
  }

  private openFileConnectionDialog(): void {
    // Use the new dedicated guide file connection dialog
    this.dialogRef = this.dialog.open(GuideFileConnectionDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '85vh',
      panelClass: 'guide-dialog',
    });

    this.dialogRef.componentInstance.confirmed.subscribe((result: GuideFileConnectionResult) => {
      this.onFileConnectionConfirmed(result);
    });

    this.dialogRef.componentInstance.cancelled.subscribe(() => {
      this.closeDialog();
    });
  }

  private onFileConnectionConfirmed(result: GuideFileConnectionResult): void {
    // Add the equipment ID to the list
    const lotoData = this.state().lotoPointData;
    const currentIds = lotoData?.equipmentIds || [];
    const newIds = currentIds.includes(result.equipment.id)
      ? currentIds
      : [...currentIds, result.equipment.id];

    this.onValueChange.emit({ field: 'equipmentIds', value: newIds });
    this.closeDialog();
    this.onComplete.emit();
  }

  private openCounterpartDialog(): void {
    this.generatedCounterpart.set(null);
    this.isLoadingCounterpart.set(false);

    this.dialogRef = this.dialog.open(this.counterpartDialogTemplate, {
      width: '95vw',
      maxWidth: '1400px',
      height: '90vh',
      panelClass: 'guide-dialog',
    });
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
  }

  // Tag Number
  onTagGenerated(tagNumber: string): void {
    this.onValueChange.emit({ field: 'tagNumber', value: tagNumber });
    // Also extract unit from tag number
    const unit = this.counterpartService.getSourceUnit({ tagNumber } as LotoPointDto);
    if (unit) {
      this.onValueChange.emit({ field: 'unit', value: unit });
    }
    this.closeDialog();
    this.onComplete.emit();
  }

  // Description
  async pasteFromClipboard(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        this.manualDescription = text;
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  }

  useDescription(): void {
    if (this.manualDescription) {
      this.onValueChange.emit({ field: 'description', value: this.manualDescription });
      this.closeDialog();
      this.onComplete.emit();
    }
  }

  // Positions
  savePositions(): void {
    if (this.selectedNormPos && this.selectedIsoPos) {
      this.onValueChange.emit({ field: 'normPos', value: this.selectedNormPos });
      this.onValueChange.emit({ field: 'isoPos', value: this.selectedIsoPos });
      this.closeDialog();
      this.onComplete.emit();
    }
  }

  // Zero Energy
  onZeroEnergyClipboardSelected(event: { phraseId: number; templateEquipment: any[]; templateEquipmentIds: number[] }): void {
    this.selectedZeroEnergyPhrase.set(event);
    if (event.templateEquipment) {
      this.selectedZeroEnergyEquipment.set(event.templateEquipment);
    }
  }

  openEquipmentBrowserForZeroEnergy(): void {
    this.equipmentBrowserRef = this.dialog.open(this.equipmentBrowserDialogTemplate, {
      width: '700px',
      maxHeight: '85vh',
      panelClass: 'guide-dialog',
    });
  }

  onEquipmentSelected(equipment: EquipmentDto): void {
    const current = this.selectedZeroEnergyEquipment();
    if (!current.find(e => e.id === equipment.id)) {
      this.selectedZeroEnergyEquipment.set([...current, equipment]);
    }
    this.closeEquipmentBrowser();
  }

  closeEquipmentBrowser(): void {
    if (this.equipmentBrowserRef) {
      this.equipmentBrowserRef.close();
      this.equipmentBrowserRef = null;
    }
  }

  removeZeroEnergyEquipment(index: number): void {
    const current = this.selectedZeroEnergyEquipment();
    this.selectedZeroEnergyEquipment.set(current.filter((_, i) => i !== index));
  }

  saveZeroEnergy(): void {
    const equipment = this.selectedZeroEnergyEquipment();
    const zeroEnergy = {
      templateEquipment: equipment,
      templateEquipmentIds: equipment.map(e => e.id),
      zeroEnergyTemplate: this.selectedZeroEnergyPhrase()?.phraseId
        ? { id: this.selectedZeroEnergyPhrase().phraseId }
        : null,
    };
    this.onValueChange.emit({ field: 'zeroEnergy', value: zeroEnergy });
    this.closeDialog();
    this.onComplete.emit();
  }

  // Zero Energy helper methods
  needsMoreEquipment(): boolean {
    const required = this.requiredPlaceholderCount();
    const selected = this.selectedZeroEnergyEquipment().length;
    return required > 0 && selected < required;
  }

  getRequiredPlaceholderCount(): number {
    return this.requiredPlaceholderCount();
  }

  updateRequiredPlaceholderCount(count: number): void {
    this.requiredPlaceholderCount.set(count);
  }

  // File Connection
  onFileEquipmentSelected(equipment: EquipmentDto): void {
    const current = this.linkedEquipment();
    if (!current.find(e => e.id === equipment.id)) {
      this.linkedEquipment.set([...current, equipment]);
    }
  }

  onShapeDrawn(equipment: EquipmentDto | null): void {
    if (equipment) {
      const current = this.linkedEquipment();
      if (!current.find(e => e.id === equipment.id)) {
        this.linkedEquipment.set([...current, equipment]);
      }
      // Switch back to browse tab after drawing
      this.fileConnectionTab.set('browse');
    }
  }

  removeLinkedEquipment(index: number): void {
    const current = this.linkedEquipment();
    this.linkedEquipment.set(current.filter((_, i) => i !== index));
  }

  saveFileConnection(): void {
    const equipment = this.linkedEquipment();
    this.onValueChange.emit({
      field: 'equipmentIds',
      value: equipment.map(e => e.id),
    });
    this.closeDialog();
    this.onComplete.emit();
  }

  // Counterpart
  canCreateCounterpart(): boolean {
    const tagNumber = this.state().lotoPointData?.tagNumber;
    if (!tagNumber) return false;
    return this.counterpartService.isUnitSpecific({ tagNumber } as LotoPointDto);
  }

  generateCounterpart(): void {
    const lotoData = this.state().lotoPointData;
    if (!lotoData?.tagNumber) return;

    this.isLoadingCounterpart.set(true);

    // Create a LotoPointDto from the current state
    // Note: LotoPointDto constructor handles plain objects via setNestedObjectById
    const primaryLotoPoint = new LotoPointDto({
      tagNumber: lotoData.tagNumber,
      description: lotoData.description,
      unit: lotoData.unit,
      specificLocation: lotoData.specificLocation,
      normPos: lotoData.normPos as any,
      isoPos: lotoData.isoPos as any,
      location: lotoData.location as any,
      eqType: lotoData.eqType as any,
      zeroEnergy: lotoData.zeroEnergy,
    });

    // Generate counterpart synchronously first
    const counterpart = this.counterpartService.generateCounterpart(primaryLotoPoint);
    this.generatedCounterpart.set(counterpart);
    this.isLoadingCounterpart.set(false);
  }

  saveCounterpart(): void {
    const counterpart = this.generatedCounterpart();
    if (!counterpart) return;

    // Store the counterpart data - it will be created when the main LOTO point is saved
    this.onValueChange.emit({
      field: 'generatedCounterpart',
      value: {
        tagNumber: counterpart.tagNumber,
        description: counterpart.description,
        unit: counterpart.unit,
        specificLocation: counterpart.specificLocation,
        normPos: counterpart.normPos,
        isoPos: counterpart.isoPos,
        location: counterpart.location,
        eqType: counterpart.eqType,
        zeroEnergy: counterpart.zeroEnergy,
      },
    });
    this.closeDialog();
    this.onComplete.emit();
  }

  // Counterpart saved from dual form
  onCounterpartSaved(counterpart: LotoPointDto): void {
    // Store the counterpart ID
    this.onValueChange.emit({
      field: 'counterpartId',
      value: counterpart.id,
    });
    this.closeDialog();
    this.onComplete.emit();
  }

  // Both primary and counterpart saved from dual form
  onBothSavedFromDualForm(event: { primary: LotoPointDto; counterpart: LotoPointDto }): void {
    // Store the counterpart ID
    this.onValueChange.emit({
      field: 'counterpartId',
      value: event.counterpart.id,
    });
    this.closeDialog();
    this.onComplete.emit();
  }

  // Utility
  getEquipmentDisplay(equipment: EquipmentDto): string {
    if (equipment.lotoPoints && equipment.lotoPoints.length > 0) {
      return equipment.lotoPoints[0].tagNumber || equipment.name || `Equipment #${equipment.id}`;
    }
    return equipment.tagNumber || equipment.name || `Equipment #${equipment.id}`;
  }
}
