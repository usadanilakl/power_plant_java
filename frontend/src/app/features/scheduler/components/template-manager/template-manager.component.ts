import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {SchedulerStateService} from '../../../../services/scheduler/scheduler-state.service';
import {TaskTemplateDto, StepTemplate, StepTemplateReference} from '../../../../models/scheduler/task-template.model';

@Component({
  selector: 'app-template-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="tmpl-container">
      <div class="tmpl-header">
        <h2>Task Templates</h2>
        <div class="header-actions">
          <button class="btn btn-add" (click)="startCreate()">+ New Template</button>
          <button class="btn btn-import" (click)="excelInput.click()">Import Excel</button>
          <input type="file" #excelInput accept=".xlsx,.xls" (change)="onImportExcel($event)" style="display:none" />
          <button class="btn btn-import-word" (click)="wordInput.click()">Import Word</button>
          <input type="file" #wordInput accept=".docx" (change)="onImportWord($event)" style="display:none" />
          <button class="btn btn-seed" (click)="seedProcedures()">Seed Procedures</button>
          <a class="btn btn-nav" routerLink="/scheduler/flow">Back to Flow</a>
        </div>
      </div>

      <div class="tmpl-hint">
        Tip: Build a task with steps in the Flow view, then click it and use "Save as Template" for visual building.
      </div>

      <div class="tmpl-body">
        <!-- Template list -->
        <div class="tmpl-list">
          <div class="tmpl-card" *ngFor="let t of state.templates()"
               [class.active]="editing?.id === t.id" (click)="startEdit(t)">
            <div class="card-header">
              <strong>{{ t.name }}</strong>
              <span class="tag">{{ t.taskType }}</span>
            </div>
            <div class="card-desc">{{ t.description || 'No description' }}</div>
            <div class="card-meta">
              {{ t.stepTemplates.length }} step(s)
            </div>
          </div>

          <div class="empty" *ngIf="state.templates().length === 0">
            No templates yet.
          </div>
        </div>

        <!-- Edit / Create form -->
        <div class="tmpl-form" *ngIf="editing">
          <h3>{{ isNew ? 'New Template' : 'Edit Template' }}</h3>

          <label>Name</label>
          <input [(ngModel)]="editing.name" />

          <label>Description</label>
          <textarea [(ngModel)]="editing.description" rows="2"></textarea>

          <label>Task Type</label>
          <select [(ngModel)]="editing.taskType">
            <option value="RECURRING">Recurring</option>
            <option value="OCCASIONAL">Occasional</option>
            <option value="ONE_TIME">One-time</option>
          </select>

          <label>Steps ({{ steps.length }})</label>
          <div class="step-card" *ngFor="let step of steps; let i = index"
               [class.expanded]="expandedStep === i">
            <!-- Step header row -->
            <div class="step-header" (click)="toggleStepExpand(i)">
              <span class="step-num">{{ i + 1 }}</span>
              <input [(ngModel)]="step.name" placeholder="Step name" class="step-name"
                     (click)="$event.stopPropagation()" />
              <span class="step-badges">
                <span class="badge badge-warn" *ngIf="step.warning">W</span>
                <span class="badge badge-caution" *ngIf="step.caution">C</span>
                <span class="badge badge-signoff" *ngIf="step.requiresSignoff">S</span>
                <span class="badge badge-ref" *ngIf="step.references?.length">{{ step.references.length }} ref</span>
              </span>
              <button class="remove-btn" (click)="removeStep(i); $event.stopPropagation()">x</button>
            </div>

            <!-- Expanded detail -->
            <div class="step-detail" *ngIf="expandedStep === i">
              <label>Description</label>
              <textarea [(ngModel)]="step.description" rows="2" placeholder="What the operator does in this step"></textarea>

              <div class="step-row-pair">
                <div class="step-field">
                  <label>Step Key</label>
                  <input [(ngModel)]="step.stepKey" placeholder="e.g. step-001" />
                </div>
                <div class="step-field">
                  <label>Duration (min)</label>
                  <input type="number" [(ngModel)]="step.expectedDurationMinutes" placeholder="--" />
                </div>
              </div>

              <div class="step-row-pair">
                <div class="step-field">
                  <label>Prerequisites (step keys, comma-separated)</label>
                  <input [ngModel]="step.prerequisiteStepKeys?.join(', ')"
                         (ngModelChange)="updatePrereqKeys(step, $event)"
                         placeholder="e.g. step-001, step-002 (empty = sequential)" />
                </div>
              </div>

              <label>Warning</label>
              <input [(ngModel)]="step.warning" placeholder="Safety warning (shown prominently)" class="input-warn" />

              <label>Caution</label>
              <input [(ngModel)]="step.caution" placeholder="Caution text" class="input-caution" />

              <div class="step-check">
                <input type="checkbox" [(ngModel)]="step.requiresSignoff" id="signoff-{{i}}" />
                <label for="signoff-{{i}}">Requires supervisor sign-off</label>
              </div>

              <!-- Step references -->
              <label>References ({{ step.references?.length || 0 }})</label>
              <ul class="ref-list" *ngIf="step.references?.length">
                <li *ngFor="let ref of step.references; let ri = index">
                  <span class="ref-tag">{{ ref.referenceType }}</span>
                  <span>#{{ ref.referenceId }}</span>
                  <span class="ref-label-text" *ngIf="ref.label">{{ ref.label }}</span>
                  <button class="remove-btn" (click)="removeStepRef(step, ri)">x</button>
                </li>
              </ul>
              <div class="add-ref-row">
                <select [(ngModel)]="newStepRefType" class="ref-select">
                  <option value="" disabled>Type...</option>
                  <option *ngFor="let t of referenceTypes" [value]="t">{{ t }}</option>
                </select>
                <input type="number" [(ngModel)]="newStepRefId" placeholder="ID" class="ref-id-input" />
                <input [(ngModel)]="newStepRefLabel" placeholder="Label (optional)" class="ref-label-input" />
                <button class="add-btn" [disabled]="!newStepRefType || !newStepRefId"
                        (click)="addStepRef(step)">+</button>
              </div>
            </div>
          </div>
          <button class="btn btn-small btn-add-step" (click)="addStepDef()">+ Add Step</button>

          <div class="form-actions">
            <button class="btn btn-save" (click)="save()">{{ isNew ? 'Create' : 'Save' }}</button>
            <button class="btn btn-cancel" (click)="cancel()">Cancel</button>
            <button class="btn btn-export" *ngIf="!isNew" (click)="exportExcel()">Export Excel</button>
            <button class="btn btn-delete" *ngIf="!isNew" (click)="deleteTemplate()">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tmpl-container {
      display: flex; flex-direction: column; height: calc(100vh - 120px);
      background: #11111b; color: #cdd6f4; padding: 16px;
    }
    .tmpl-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 8px;
    }
    .tmpl-header h2 { margin: 0; font-size: 16px; }
    .header-actions { display: flex; gap: 8px; }
    .tmpl-hint {
      font-size: 11px; color: #666; margin-bottom: 12px;
      padding: 6px 10px; background: #1a1a2e; border-radius: 4px;
      border-left: 3px solid #6366f1;
    }
    .tmpl-body { display: flex; gap: 16px; flex: 1; min-height: 0; }
    .tmpl-list { flex: 1; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; }
    .tmpl-card {
      background: #1e1e2e; border: 1px solid #333; border-radius: 6px;
      padding: 10px 14px; cursor: pointer;
    }
    .tmpl-card:hover { border-color: #555; }
    .tmpl-card.active { border-color: #3b82f6; }
    .card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .card-desc { font-size: 12px; color: #888; }
    .card-meta { font-size: 11px; color: #666; margin-top: 4px; }
    .tag {
      font-size: 10px; background: #313244; padding: 2px 6px;
      border-radius: 4px;
    }
    .empty { color: #555; font-size: 13px; padding: 20px 0; text-align: center; }
    .tmpl-form {
      flex: 1; padding: 12px; background: #1e1e2e; border-radius: 6px;
      border: 1px solid #333; overflow-y: auto;
    }
    .tmpl-form h3 { margin: 0 0 12px 0; font-size: 14px; }
    .tmpl-form label {
      display: block; font-size: 11px; color: #888; margin: 10px 0 4px;
      text-transform: uppercase;
    }
    .tmpl-form input, .tmpl-form textarea, .tmpl-form select {
      width: 100%; background: #181825; border: 1px solid #333; color: #cdd6f4;
      padding: 6px 8px; border-radius: 4px; font-size: 13px; box-sizing: border-box;
    }
    .step-card {
      background: #181825; border: 1px solid #333; border-radius: 4px;
      margin-bottom: 4px; overflow: hidden;
    }
    .step-card.expanded { border-color: #3b82f6; }
    .step-header {
      display: flex; align-items: center; gap: 6px; padding: 6px 8px; cursor: pointer;
    }
    .step-header:hover { background: #1a1a2e; }
    .step-num {
      font-size: 10px; color: #888; min-width: 18px; text-align: center;
      background: #313244; border-radius: 3px; padding: 1px 4px;
    }
    .step-name { flex: 1; }
    .step-badges { display: flex; gap: 3px; }
    .badge {
      font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: 600;
    }
    .badge-warn { background: #ef4444; color: #fff; }
    .badge-caution { background: #f59e0b; color: #000; }
    .badge-signoff { background: #8b5cf6; color: #fff; }
    .badge-ref { background: #313244; color: #cdd6f4; }
    .step-detail { padding: 8px 10px 10px; border-top: 1px solid #333; }
    .step-detail label {
      display: block; font-size: 10px; color: #888; margin: 8px 0 3px;
      text-transform: uppercase;
    }
    .step-detail textarea, .step-detail input, .step-detail select {
      width: 100%; background: #11111b; border: 1px solid #333; color: #cdd6f4;
      padding: 5px 7px; border-radius: 3px; font-size: 12px; box-sizing: border-box;
    }
    .step-row-pair { display: flex; gap: 8px; }
    .step-field { flex: 1; }
    .input-warn { border-color: #ef4444 !important; }
    .input-caution { border-color: #f59e0b !important; }
    .step-check {
      display: flex; align-items: center; gap: 6px; margin: 6px 0;
    }
    .step-check input[type="checkbox"] { width: auto; }
    .step-check label { display: inline; margin: 0; font-size: 12px; color: #cdd6f4; text-transform: none; }
    .ref-list { list-style: none; padding: 0; margin: 0; }
    .ref-list li {
      display: flex; align-items: center; gap: 6px; padding: 3px 0;
      font-size: 12px;
    }
    .ref-tag {
      font-size: 9px; background: #313244; padding: 1px 5px; border-radius: 3px;
    }
    .ref-label-text { color: #888; font-size: 11px; }
    .add-ref-row {
      display: flex; gap: 4px; margin-top: 4px;
    }
    .ref-select { flex: 1; }
    .ref-id-input { width: 60px; flex: 0 0 60px; }
    .ref-label-input { flex: 1; }
    .add-btn {
      background: #22c55e; color: #fff; border: none; border-radius: 3px;
      padding: 4px 8px; cursor: pointer; font-size: 12px; flex-shrink: 0;
    }
    .add-btn:disabled { opacity: 0.4; cursor: default; }
    .remove-btn {
      background: none; border: none; color: #ef4444; cursor: pointer;
      font-size: 14px; padding: 0 4px; flex-shrink: 0;
    }
    .btn-add-step {
      background: #313244; color: #cdd6f4; border: none; padding: 4px 10px;
      border-radius: 4px; cursor: pointer; font-size: 11px; margin-top: 4px;
    }
    .form-actions { display: flex; gap: 8px; margin-top: 14px; }
    .btn {
      padding: 6px 14px; border: none; border-radius: 4px; cursor: pointer;
      font-size: 12px; font-weight: 500; text-decoration: none;
    }
    .btn-add { background: #22c55e; color: #fff; }
    .btn-import { background: #f59e0b; color: #000; }
    .btn-import-word { background: #3b82f6; color: #fff; }
    .btn-seed { background: #8b5cf6; color: #fff; }
    .btn-export { background: #06b6d4; color: #fff; }
    .btn-nav { background: #313244; color: #cdd6f4; }
    .btn-save { background: #3b82f6; color: #fff; }
    .btn-cancel { background: #6b7280; color: #fff; }
    .btn-delete { background: #ef4444; color: #fff; }
    .btn-small { font-size: 11px; padding: 4px 10px; }
  `]
})
export class TemplateManagerComponent implements OnInit {
  editing: TaskTemplateDto | null = null;
  isNew = false;
  steps: StepTemplate[] = [];
  expandedStep: number | null = null;

  // Reference add form state
  newStepRefType = '';
  newStepRefId: number | null = null;
  newStepRefLabel = '';

  referenceTypes = ['Equipment', 'User', 'DailyPermitPackage', 'SafeWork', 'HotWork',
    'ConfinedSpace', 'LotoPoint', 'FileObject', 'Value'];

  constructor(public state: SchedulerStateService) {}

  ngOnInit(): void {
    this.state.loadTemplates();
  }

  startCreate(): void {
    this.editing = new TaskTemplateDto({name: '', taskType: 'RECURRING'});
    this.steps = [];
    this.expandedStep = null;
    this.isNew = true;
  }

  startEdit(t: TaskTemplateDto): void {
    this.editing = new TaskTemplateDto({...t});
    this.steps = t.stepTemplates.map(s => ({
      stepKey: s.stepKey || `step-${String(s.sortOrder + 1).padStart(3, '0')}`,
      name: s.name || '',
      description: s.description || '',
      sortOrder: s.sortOrder,
      prerequisiteStepKeys: s.prerequisiteStepKeys || [],
      references: s.references || [],
      warning: s.warning || '',
      caution: s.caution || '',
      requiresSignoff: s.requiresSignoff || false,
      expectedDurationMinutes: s.expectedDurationMinutes ?? null,
    }));
    this.expandedStep = null;
    this.isNew = false;
  }

  toggleStepExpand(i: number): void {
    this.expandedStep = this.expandedStep === i ? null : i;
  }

  addStepDef(): void {
    const order = this.steps.length;
    this.steps.push({
      stepKey: `step-${String(order + 1).padStart(3, '0')}`,
      name: '',
      description: '',
      sortOrder: order,
      prerequisiteStepKeys: [],
      references: [],
      warning: '',
      caution: '',
      requiresSignoff: false,
      expectedDurationMinutes: null,
    });
    this.expandedStep = this.steps.length - 1;
  }

  removeStep(i: number): void {
    const removedKey = this.steps[i].stepKey;
    this.steps.splice(i, 1);
    // Clean up any prerequisiteStepKeys referencing the removed step
    for (const step of this.steps) {
      step.prerequisiteStepKeys = step.prerequisiteStepKeys.filter(k => k !== removedKey);
    }
    if (this.expandedStep === i) this.expandedStep = null;
    else if (this.expandedStep !== null && this.expandedStep > i) this.expandedStep--;
  }

  updatePrereqKeys(step: StepTemplate, value: string): void {
    step.prerequisiteStepKeys = value ? value.split(',').map(k => k.trim()).filter(k => k) : [];
  }

  addStepRef(step: StepTemplate): void {
    if (!this.newStepRefType || !this.newStepRefId) return;
    if (!step.references) step.references = [];
    step.references.push({
      referenceType: this.newStepRefType,
      referenceId: this.newStepRefId,
      label: this.newStepRefLabel || undefined,
    });
    this.newStepRefType = '';
    this.newStepRefId = null;
    this.newStepRefLabel = '';
  }

  removeStepRef(step: StepTemplate, refIndex: number): void {
    step.references.splice(refIndex, 1);
  }

  save(): void {
    if (!this.editing) return;
    // Re-assign sortOrders and ensure unique stepKeys
    const usedKeys = new Set<string>();
    this.steps.forEach((s, i) => {
      s.sortOrder = i;
      // Auto-generate key if empty or duplicate
      if (!s.stepKey || usedKeys.has(s.stepKey)) {
        s.stepKey = `step-${String(i + 1).padStart(3, '0')}`;
      }
      // Still a duplicate after auto-gen? Add suffix
      while (usedKeys.has(s.stepKey)) {
        s.stepKey = s.stepKey + '-' + (i + 1);
      }
      usedKeys.add(s.stepKey);
    });
    // Strip any prerequisiteStepKeys that reference non-existent keys
    const allKeys = new Set(this.steps.map(s => s.stepKey));
    for (const step of this.steps) {
      step.prerequisiteStepKeys = step.prerequisiteStepKeys.filter(k => allKeys.has(k));
    }
    this.editing.stepTemplatesJson = JSON.stringify(this.steps);
    if (this.isNew) {
      this.state.createTemplate(this.editing);
    } else {
      this.state.updateTemplate(this.editing);
    }
    this.editing = null;
  }

  cancel(): void {
    this.editing = null;
  }

  deleteTemplate(): void {
    if (!this.editing || this.isNew) return;
    if (confirm(`Delete template "${this.editing.name}"?`)) {
      this.state.deleteTemplate(this.editing.id);
      this.editing = null;
    }
  }

  onImportExcel(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const name = prompt('Template name:', file.name.replace(/\.[^.]+$/, ''));
    if (!name) return;
    this.state.importExcelTemplate(file, name);
    input.value = '';
  }

  onImportWord(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const name = prompt('Template name:', file.name.replace(/\.[^.]+$/, ''));
    if (!name) return;
    this.state.importWordTemplate(file, name);
    input.value = '';
  }

  exportExcel(): void {
    if (!this.editing || this.isNew) return;
    window.open(this.state.getExportExcelUrl(this.editing.id), '_blank');
  }

  seedProcedures(): void {
    this.state.seedProcedures();
  }
}
