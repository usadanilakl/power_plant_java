import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {SchedulerStateService} from '../../../../services/scheduler/scheduler-state.service';
import {TaskTemplateDto, StepTemplate} from '../../../../models/scheduler/task-template.model';

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

          <label>Steps</label>
          <div class="step-row" *ngFor="let step of steps; let i = index">
            <input [(ngModel)]="step.name" placeholder="Step name" class="step-name" />
            <input [(ngModel)]="step.description" placeholder="Description" class="step-desc" />
            <button class="remove-btn" (click)="removeStep(i)">x</button>
          </div>
          <button class="btn btn-small btn-add-step" (click)="addStepDef()">+ Add Step</button>

          <div class="form-actions">
            <button class="btn btn-save" (click)="save()">{{ isNew ? 'Create' : 'Save' }}</button>
            <button class="btn btn-cancel" (click)="cancel()">Cancel</button>
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
    .step-row { display: flex; gap: 6px; margin-bottom: 4px; }
    .step-name { flex: 1; }
    .step-desc { flex: 2; }
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

  constructor(public state: SchedulerStateService) {}

  ngOnInit(): void {
    this.state.loadTemplates();
  }

  startCreate(): void {
    this.editing = new TaskTemplateDto({name: '', taskType: 'RECURRING'});
    this.steps = [];
    this.isNew = true;
  }

  startEdit(t: TaskTemplateDto): void {
    this.editing = new TaskTemplateDto({...t});
    this.steps = [...t.stepTemplates];
    this.isNew = false;
  }

  addStepDef(): void {
    this.steps.push({name: '', description: '', sortOrder: this.steps.length});
  }

  removeStep(i: number): void {
    this.steps.splice(i, 1);
  }

  save(): void {
    if (!this.editing) return;
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
}
