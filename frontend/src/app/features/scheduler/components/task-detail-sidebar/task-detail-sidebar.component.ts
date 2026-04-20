import {Component, Input, Output, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SchedulerTaskDto} from '../../../../models/scheduler/scheduler-task.model';
import {EntityPickerDialogComponent, PickedEntity} from '../../../../shared/entity-picker/entity-picker-dialog.component';

@Component({
  selector: 'app-task-detail-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, EntityPickerDialogComponent],
  template: `
    <div class="sidebar" [class.open]="task">
      <div class="sidebar-header" *ngIf="task">
        <h3>{{ task.name || 'Unnamed' }}</h3>
        <span class="status-badge" [class]="'status-' + computedStatus">{{ computedStatus }}</span>
        <button class="close-btn" (click)="closed.emit()">x</button>
      </div>

      <!-- ======= EXECUTE MODE ======= -->
      <div class="sidebar-body" *ngIf="task && viewMode === 'execute'">
        <!-- Safety banners first — operator sees these immediately -->
        <div class="safety-banner warning-banner" *ngIf="task.warning">
          <strong>WARNING:</strong> {{ task.warning }}
        </div>
        <div class="safety-banner caution-banner" *ngIf="task.caution">
          <strong>CAUTION:</strong> {{ task.caution }}
        </div>
        <div class="safety-banner signoff-banner" *ngIf="task.requiresSignoff">
          <strong>SIGNOFF REQUIRED</strong> — Supervisor sign-off before completion.
        </div>

        <section>
          <label>Instructions</label>
          <div class="exec-description">{{ task.description || 'No instructions provided.' }}</div>
        </section>

        <section *ngIf="task.expectedDurationMinutes">
          <label>Expected Duration</label>
          <span class="tag tag-duration">{{ task.expectedDurationMinutes }} min</span>
        </section>

        <!-- Steps progress (for parent tasks) -->
        <section *ngIf="task.taskLevel === 'TASK' && task.subTasks.length > 0">
          <label>Steps Progress</label>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="stepProgress"></div>
          </div>
          <span class="progress-text">{{ stepsDone }}/{{ task.subTasks.length }} complete</span>
          <ul class="step-checklist">
            <li *ngFor="let step of task.subTasks" [class.step-done]="isStepDone(step)">
              <span class="step-check-icon">{{ isStepDone(step) ? '\u2713' : '\u25CB' }}</span>
              {{ step.name }}
            </li>
          </ul>
          <button class="btn btn-small btn-view" (click)="drillInto.emit(task)">Open Steps</button>
        </section>

        <!-- Read-only references -->
        <section *ngIf="task.references.length > 0">
          <label>References</label>
          <ul class="item-list">
            <li *ngFor="let ref of task.references">
              <span class="dot" [class]="'dot-' + ref.referenceType.toLowerCase()"></span>
              <span class="ref-label">{{ ref.referenceType }} #{{ ref.referenceId }}</span>
            </li>
          </ul>
        </section>

        <!-- Read-only attachments -->
        <section *ngIf="task.attachments.length > 0">
          <label>Attachments</label>
          <ul class="item-list">
            <li *ngFor="let att of task.attachments">
              <span class="dot dot-file"></span>
              <a class="file-link" [href]="'/' + att.fileLink" target="_blank">{{ att.name }}</a>
            </li>
          </ul>
        </section>

        <!-- Operator notes -->
        <section>
          <label>Notes</label>
          <textarea [(ngModel)]="task.notes" (blur)="taskUpdated.emit(task)" rows="4" placeholder="Add execution notes..."></textarea>
        </section>

        <!-- Execute actions -->
        <section class="actions exec-actions">
          <button class="btn btn-progress btn-large" *ngIf="computedStatus === 'ready'"
                  (click)="statusChanged.emit({task: task, status: 'In Progress'})">
            Start
          </button>
          <button class="btn btn-complete btn-large" *ngIf="computedStatus !== 'completed'"
                  (click)="statusChanged.emit({task: task, status: 'Completed'})">
            Mark Complete
          </button>
          <button class="btn btn-skip" *ngIf="computedStatus !== 'completed' && computedStatus !== 'skipped'"
                  (click)="statusChanged.emit({task: task, status: 'Skipped'})">
            Skip
          </button>
        </section>
      </div>

      <!-- ======= BUILD MODE ======= -->
      <div class="sidebar-body" *ngIf="task && viewMode === 'build'">
        <section>
          <label>Name</label>
          <input [(ngModel)]="task.name" (blur)="taskUpdated.emit(task)" />
        </section>

        <section>
          <label>Description</label>
          <textarea [(ngModel)]="task.description" (blur)="taskUpdated.emit(task)" rows="3"></textarea>
        </section>

        <section>
          <label>Type</label>
          <span class="tag">{{ task.taskLevel }}</span>
          <span class="tag">{{ task.taskType }}</span>
          <span class="tag tag-duration" *ngIf="task.expectedDurationMinutes">{{ task.expectedDurationMinutes }} min</span>
        </section>

        <div class="safety-banner warning-banner" *ngIf="task.warning">
          <strong>WARNING:</strong> {{ task.warning }}
        </div>
        <div class="safety-banner caution-banner" *ngIf="task.caution">
          <strong>CAUTION:</strong> {{ task.caution }}
        </div>
        <div class="safety-banner signoff-banner" *ngIf="task.requiresSignoff">
          <strong>SIGNOFF REQUIRED</strong> — This step requires supervisor sign-off before completion.
        </div>

        <section *ngIf="task.assigneeName">
          <label>Assignee</label>
          <span>{{ task.assigneeName }}</span>
        </section>

        <section *ngIf="task.dueDate">
          <label>Due Date</label>
          <span>{{ task.dueDate }}</span>
        </section>

        <!-- Steps (only for TASK level, not when already drilled in) -->
        <section *ngIf="task.taskLevel === 'TASK' && !isDrilledView">
          <label>Steps ({{ task.subTasks.length }})</label>
          <ul class="item-list" *ngIf="task.subTasks.length > 0">
            <li *ngFor="let step of task.subTasks">
              <span class="dot" [class]="'dot-' + (step.statusName?.toLowerCase() || 'none')"></span>
              {{ step.name }}
            </li>
          </ul>
          <div class="step-actions">
            <button class="btn btn-small btn-add" (click)="addStep.emit(task)">+ Add Step</button>
            <button class="btn btn-small btn-view" *ngIf="task.subTasks.length > 0"
                    (click)="drillInto.emit(task)">View Steps</button>
          </div>
        </section>

        <!-- Prerequisites -->
        <section>
          <label>Prerequisites</label>
          <ul class="item-list" *ngIf="task.prerequisiteIds.length > 0">
            <li *ngFor="let pid of task.prerequisiteIds">
              <span class="dot dot-link"></span>
              {{ getTaskName(pid) }}
              <button class="remove-btn" (click)="removePrerequisite(pid)">x</button>
            </li>
          </ul>
          <div class="add-row" *ngIf="availablePrereqs.length > 0">
            <select [(ngModel)]="newPrereqId">
              <option [ngValue]="null" disabled>Add prerequisite...</option>
              <option *ngFor="let t of availablePrereqs" [ngValue]="t.id">{{ t.name || 'Task #' + t.id }}</option>
            </select>
            <button class="add-btn" [disabled]="!newPrereqId" (click)="addPrerequisite()">+</button>
          </div>
        </section>

        <!-- Dependents -->
        <section *ngIf="task.dependentIds.length > 0">
          <label>Dependents ({{ task.dependentIds.length }})</label>
          <ul class="item-list">
            <li *ngFor="let did of task.dependentIds">
              <span class="dot dot-link"></span>
              {{ getTaskName(did) }}
            </li>
          </ul>
        </section>

        <!-- Attachments -->
        <section>
          <label>Attachments ({{ task.attachments.length }})</label>
          <ul class="item-list" *ngIf="task.attachments.length > 0">
            <li *ngFor="let att of task.attachments">
              <span class="dot dot-file"></span>
              <a class="file-link" [href]="'/' + att.fileLink" target="_blank">{{ att.name }}</a>
              <button class="remove-btn" (click)="onRemoveAttachment(att.id)">x</button>
            </li>
          </ul>
          <div class="file-upload">
            <input type="file" #fileInput (change)="onFileSelected($event)" style="display:none" multiple />
            <button class="btn btn-small btn-add" (click)="fileInput.click()">+ Attach file</button>
          </div>
        </section>

        <!-- References -->
        <section>
          <label>References ({{ task.references.length }})</label>
          <ul class="item-list" *ngIf="task.references.length > 0">
            <li *ngFor="let ref of task.references">
              <span class="dot" [class]="'dot-' + ref.referenceType.toLowerCase()"></span>
              <span class="ref-label">{{ ref.referenceType }} #{{ ref.referenceId }}</span>
              <button class="remove-btn" (click)="onRemoveReference(ref.id)">x</button>
            </li>
          </ul>
          <div class="add-ref-row">
            <select [(ngModel)]="newRefType" class="ref-select">
              <option value="" disabled>Type...</option>
              <option *ngFor="let t of referenceTypes" [value]="t">{{ t }}</option>
            </select>
            <button class="add-btn" [disabled]="!newRefType" (click)="openEntityPicker()">Browse</button>
          </div>

          <app-entity-picker-dialog
            *ngIf="showEntityPicker && newRefType"
            [referenceType]="newRefType"
            (picked)="onEntityPicked($event)"
            (closed)="showEntityPicker = false">
          </app-entity-picker-dialog>
        </section>

        <!-- Notes -->
        <section>
          <label>Notes</label>
          <textarea [(ngModel)]="task.notes" (blur)="taskUpdated.emit(task)" rows="4" placeholder="Add notes..."></textarea>
        </section>

        <!-- Builder Actions -->
        <section class="actions">
          <button class="btn btn-delete" (click)="taskDeleted.emit(task)">Delete</button>
        </section>

        <!-- Save as template (only for TASK level) -->
        <section *ngIf="task.taskLevel === 'TASK' && !isDrilledView">
          <button class="btn btn-template-save" (click)="onSaveAsTemplate()">Save as Template</button>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .sidebar {
      width: 0; height: 100%; background: #1e1e2e;
      border-left: 1px solid #333; display: flex; flex-direction: column;
      overflow: hidden; color: #cdd6f4; transition: width 0.15s ease;
    }
    .sidebar.open {
      width: 320px; overflow-y: auto;
    }
    .sidebar-header {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; border-bottom: 1px solid #333;
    }
    .sidebar-header h3 { flex: 1; margin: 0; font-size: 14px; }
    .close-btn {
      background: none; border: none; color: #888; cursor: pointer;
      font-size: 16px; padding: 4px;
    }
    .close-btn:hover { color: #fff; }
    .sidebar-body { padding: 12px 16px; }
    section { margin-bottom: 16px; }
    label { display: block; font-size: 11px; color: #888; margin-bottom: 4px; text-transform: uppercase; }
    input, textarea, select {
      width: 100%; background: #181825; border: 1px solid #333; color: #cdd6f4;
      padding: 6px 8px; border-radius: 4px; font-size: 13px; box-sizing: border-box;
    }
    input:focus, textarea:focus, select:focus { border-color: #3b82f6; outline: none; }
    .status-badge {
      font-size: 10px; padding: 2px 8px; border-radius: 10px;
      text-transform: uppercase; font-weight: 600;
    }
    .status-ready { background: #3b82f6; color: #fff; }
    .status-blocked { background: #ef4444; color: #fff; }
    .status-completed { background: #22c55e; color: #fff; }
    .status-skipped { background: #9ca3af; color: #fff; }
    .tag {
      font-size: 11px; background: #313244; padding: 2px 6px;
      border-radius: 4px; margin-right: 4px;
    }
    .tag-duration { background: #1e3a5f; color: #7dd3fc; }
    .safety-banner {
      padding: 8px 12px; border-radius: 4px; font-size: 12px;
      margin: 4px 16px;
    }
    .warning-banner { background: #451a03; border-left: 3px solid #ef4444; color: #fca5a5; }
    .caution-banner { background: #451a03; border-left: 3px solid #f59e0b; color: #fde68a; }
    .signoff-banner { background: #1e1b4b; border-left: 3px solid #8b5cf6; color: #c4b5fd; }
    .item-list { list-style: none; padding: 0; margin: 4px 0; }
    .item-list li {
      font-size: 12px; padding: 4px 0; border-bottom: 1px solid #2a2a3c;
      display: flex; align-items: center; gap: 6px;
    }
    .dot {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%;
      background: #6b7280; flex-shrink: 0;
    }
    .dot-link { background: #3b82f6; }
    .dot-completed { background: #22c55e; }
    .dot-none { background: #6b7280; }
    .remove-btn {
      margin-left: auto; background: none; border: none; color: #ef4444;
      cursor: pointer; font-size: 14px; padding: 0 4px;
    }
    .remove-btn:hover { color: #f87171; }
    .add-row { display: flex; gap: 6px; margin-top: 6px; }
    .add-row select { flex: 1; }
    .add-btn {
      background: #3b82f6; color: #fff; border: none; padding: 4px 10px;
      border-radius: 4px; cursor: pointer; font-size: 14px;
    }
    .add-btn:disabled { opacity: 0.4; cursor: default; }
    .dot-file { background: #a78bfa; }
    .file-link { color: #93c5fd; text-decoration: none; font-size: 12px; }
    .file-link:hover { text-decoration: underline; }
    .file-upload { margin-top: 6px; }
    .dot-equipment { background: #f59e0b; }
    .dot-user { background: #8b5cf6; }
    .dot-dailypermitpackage, .dot-safework, .dot-hotwork, .dot-confinedspace { background: #ec4899; }
    .dot-lotopoint { background: #14b8a6; }
    .dot-value { background: #6366f1; }
    .ref-label { font-size: 12px; flex: 1; }
    .add-ref-row { display: flex; gap: 4px; margin-top: 6px; }
    .ref-select { flex: 1; min-width: 0; }
    .ref-id-input { width: 60px; flex: 0 0 60px; }
    .step-actions { display: flex; gap: 6px; margin-top: 6px; }
    .btn-small { padding: 4px 10px; font-size: 11px; }
    .btn-add { background: #22c55e; color: #fff; }
    .btn-view { background: #3b82f6; color: #fff; }
    .actions { display: flex; flex-wrap: wrap; gap: 6px; }
    .btn {
      padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer;
      font-size: 12px; font-weight: 500;
    }
    .btn-complete { background: #22c55e; color: #fff; }
    .btn-progress { background: #eab308; color: #000; }
    .btn-skip { background: #6b7280; color: #fff; }
    .btn-delete { background: #ef4444; color: #fff; }
    .btn-template-save {
      width: 100%; background: #6366f1; color: #fff; border: none;
      padding: 8px; border-radius: 4px; cursor: pointer; font-size: 12px;
    }
    .btn-template-save:hover { background: #4f46e5; }
    /* Execute mode styles */
    .exec-description {
      font-size: 13px; color: #cdd6f4; line-height: 1.5;
      white-space: pre-wrap; background: #181825; padding: 8px 10px;
      border-radius: 4px; border: 1px solid #333;
    }
    .progress-bar {
      height: 6px; background: #313244; border-radius: 3px;
      overflow: hidden; margin: 6px 0 4px;
    }
    .progress-fill {
      height: 100%; background: #22c55e; border-radius: 3px;
      transition: width 0.3s ease;
    }
    .progress-text { font-size: 11px; color: #888; }
    .step-checklist {
      list-style: none; padding: 0; margin: 8px 0;
    }
    .step-checklist li {
      font-size: 12px; padding: 3px 0; display: flex; align-items: center; gap: 6px;
      color: #888;
    }
    .step-checklist li.step-done { color: #22c55e; text-decoration: line-through; }
    .step-check-icon { font-size: 14px; min-width: 16px; }
    .exec-actions { display: flex; flex-direction: column; gap: 8px; }
    .btn-large {
      padding: 12px; font-size: 14px; font-weight: 600;
    }
    .status-in.progress { background: #eab308; color: #000; }
  `]
})
export class TaskDetailSidebarComponent {
  @Input() task: SchedulerTaskDto | null = null;
  @Input() allTasks: SchedulerTaskDto[] = [];
  @Input() isDrilledView = false;
  @Input() viewMode: 'build' | 'execute' = 'build';
  @Output() closed = new EventEmitter<void>();
  @Output() taskUpdated = new EventEmitter<SchedulerTaskDto>();
  @Output() taskDeleted = new EventEmitter<SchedulerTaskDto>();
  @Output() statusChanged = new EventEmitter<{task: SchedulerTaskDto, status: string}>();
  @Output() prerequisitesChanged = new EventEmitter<{taskId: number, prerequisiteIds: number[]}>();
  @Output() addStep = new EventEmitter<SchedulerTaskDto>();
  @Output() drillInto = new EventEmitter<SchedulerTaskDto>();
  @Output() fileUploaded = new EventEmitter<{taskId: number, file: File}>();
  @Output() attachmentRemoved = new EventEmitter<{taskId: number, fileId: number}>();
  @Output() referenceAdded = new EventEmitter<{taskId: number, referenceType: string, referenceId: number}>();
  @Output() referenceRemoved = new EventEmitter<{taskId: number, refId: number}>();
  @Output() saveAsTemplate = new EventEmitter<SchedulerTaskDto>();

  newPrereqId: number | null = null;
  newRefType = '';
  showEntityPicker = false;
  referenceTypes = ['Equipment', 'User', 'DailyPermitPackage', 'SafeWork', 'HotWork', 'ConfinedSpace', 'LotoPoint'];

  get computedStatus(): string {
    if (!this.task) return 'not started';
    const stored = this.task.statusName?.toLowerCase() ?? '';
    if (stored === 'completed' || stored === 'skipped' || stored === 'in progress') return stored;
    if (this.task.prerequisiteIds.length === 0) return 'ready';
    const allDone = this.task.prerequisiteIds.every(pid => {
      const p = this.allTasks.find(t => t.id === pid);
      return p && (p.statusName === 'Completed' || p.statusName === 'Skipped');
    });
    return allDone ? 'ready' : 'blocked';
  }

  get stepsDone(): number {
    if (!this.task) return 0;
    return this.task.subTasks.filter(s => {
      const st = s.statusName?.toLowerCase();
      return st === 'completed' || st === 'skipped';
    }).length;
  }

  get stepProgress(): number {
    if (!this.task || this.task.subTasks.length === 0) return 0;
    return (this.stepsDone / this.task.subTasks.length) * 100;
  }

  isStepDone(step: SchedulerTaskDto): boolean {
    const st = step.statusName?.toLowerCase();
    return st === 'completed' || st === 'skipped';
  }

  get availablePrereqs(): SchedulerTaskDto[] {
    if (!this.task) return [];
    return this.allTasks.filter(t =>
      t.id !== this.task!.id &&
      !this.task!.prerequisiteIds.includes(t.id)
    );
  }

  getTaskName(id: number): string {
    return this.allTasks.find(t => t.id === id)?.name || `Task #${id}`;
  }

  addPrerequisite(): void {
    if (!this.task || !this.newPrereqId) return;
    const updated = [...this.task.prerequisiteIds, this.newPrereqId];
    this.prerequisitesChanged.emit({taskId: this.task.id, prerequisiteIds: updated});
    this.newPrereqId = null;
  }

  removePrerequisite(prereqId: number): void {
    if (!this.task) return;
    const updated = this.task.prerequisiteIds.filter(id => id !== prereqId);
    this.prerequisitesChanged.emit({taskId: this.task.id, prerequisiteIds: updated});
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !this.task) return;
    for (let i = 0; i < input.files.length; i++) {
      this.fileUploaded.emit({taskId: this.task.id, file: input.files[i]});
    }
    input.value = '';
  }

  onRemoveAttachment(fileId: number): void {
    if (!this.task) return;
    this.attachmentRemoved.emit({taskId: this.task.id, fileId});
  }

  openEntityPicker(): void {
    this.showEntityPicker = true;
  }

  onEntityPicked(picked: PickedEntity): void {
    if (!this.task || !this.newRefType) return;
    this.referenceAdded.emit({taskId: this.task.id, referenceType: this.newRefType, referenceId: picked.id});
    this.showEntityPicker = false;
    this.newRefType = '';
  }

  onRemoveReference(refId: number): void {
    if (!this.task) return;
    this.referenceRemoved.emit({taskId: this.task.id, refId});
  }

  onSaveAsTemplate(): void {
    if (!this.task) return;
    this.saveAsTemplate.emit(this.task);
  }
}
