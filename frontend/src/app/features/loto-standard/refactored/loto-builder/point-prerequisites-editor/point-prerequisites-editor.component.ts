import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { PointPrerequisiteDto } from '../../../../../models/loto/loto-standard.model';

interface RowState {
  pointId: number;
  tagNumber: string;
  description: string;
  requiredPointIds: number[];
  safetyConditions: string[];
}

@Component({
  selector: 'app-point-prerequisites-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="prereq-editor">
      @if (rows().length === 0) {
        <p class="empty">Add LOTO points first to configure their prerequisites.</p>
      } @else {
        <table class="prereq-table">
          <thead>
            <tr>
              <th style="width: 14%">Tag #</th>
              <th style="width: 26%">Description</th>
              <th style="width: 26%">Required predecessors</th>
              <th style="width: 34%">Safety conditions to acknowledge</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.pointId) {
              <tr>
                <td>{{ row.tagNumber }}</td>
                <td>{{ row.description }}</td>
                <td>
                  <select multiple
                          class="multi-select"
                          [ngModel]="row.requiredPointIds"
                          (ngModelChange)="onRequiredChange(row.pointId, $event)">
                    @for (other of points(); track other.id) {
                      @if (other.id !== row.pointId) {
                        <option [value]="other.id">{{ other.tagNumber }} — {{ other.description }}</option>
                      }
                    }
                  </select>
                </td>
                <td>
                  <div class="conditions">
                    @for (cond of row.safetyConditions; track $index) {
                      <div class="cond-row">
                        <input type="text" class="cond-input"
                               [ngModel]="cond"
                               (ngModelChange)="onConditionChange(row.pointId, $index, $event)"
                               placeholder="e.g. MOV must be Open">
                        <button type="button" class="remove-cond" (click)="onRemoveCondition(row.pointId, $index)">×</button>
                      </div>
                    }
                    <button type="button" class="add-cond" (click)="onAddCondition(row.pointId)">+ Add condition</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (dirty()) {
          <div class="actions">
            <button type="button" class="btn-save" (click)="onSave()" [disabled]="saving()">
              {{ saving() ? 'Saving…' : 'Save Prerequisites' }}
            </button>
            <button type="button" class="btn-cancel" (click)="onReset()" [disabled]="saving()">Discard Changes</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .prereq-editor { padding: 12px; }
    .empty { color: #888; font-style: italic; }
    .prereq-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .prereq-table th, .prereq-table td { padding: 8px; text-align: left; border-bottom: 1px solid #2a2a2a; vertical-align: top; }
    .prereq-table th { color: #aaa; font-weight: 500; background: #181818; }
    .multi-select { width: 100%; min-height: 80px; background: #1a1a1a; color: #ddd; border: 1px solid #333; border-radius: 4px; padding: 4px; }
    .conditions { display: flex; flex-direction: column; gap: 4px; }
    .cond-row { display: flex; gap: 4px; align-items: center; }
    .cond-input { flex: 1; background: #1a1a1a; color: #ddd; border: 1px solid #333; border-radius: 4px; padding: 4px 6px; }
    .remove-cond { background: none; border: none; color: #e57373; font-size: 16px; cursor: pointer; padding: 0 6px; }
    .add-cond { background: none; border: 1px dashed #444; color: #82b1ff; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; align-self: flex-start; }
    .actions { display: flex; gap: 8px; margin-top: 12px; padding-top: 8px; border-top: 1px solid #2a2a2a; }
    .btn-save { background: var(--accent-color, #2196F3); color: white; border: none; padding: 8px 14px; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .btn-cancel { background: none; color: #aaa; border: 1px solid #444; padding: 8px 14px; border-radius: 4px; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class PointPrerequisitesEditorComponent {
  /** All loto points the standard owns, in install order. */
  points = input.required<LotoPointDto[]>();
  /** Existing prereq map (from server). Edits are local until Save. */
  prerequisites = input<Record<number, PointPrerequisiteDto> | null>(null);
  /** Optional: disable editing (read-only mode). */
  readonly = input<boolean>(false);
  /** Saving state from parent. */
  saving = input<boolean>(false);

  /** Emits the new map when the user clicks Save. */
  save = output<Record<number, PointPrerequisiteDto>>();

  // Internal working copy (cloned from input on load + on reset).
  private working = signal<Record<number, PointPrerequisiteDto>>({});
  private baseline = signal<Record<number, PointPrerequisiteDto>>({});

  rows = computed<RowState[]>(() => {
    const w = this.working();
    return this.points().map(p => ({
      pointId: p.id!,
      tagNumber: p.tagNumber ?? '',
      description: p.description ?? '',
      requiredPointIds: w[p.id!]?.requiredPointIds ?? [],
      safetyConditions: w[p.id!]?.safetyConditions ?? [],
    }));
  });

  dirty = computed(() => JSON.stringify(this.working()) !== JSON.stringify(this.baseline()));

  constructor() {
    // Sync local working/baseline whenever the parent passes a new prerequisites map.
    effect(() => {
      const incoming = this.prerequisites();
      const cloned = JSON.parse(JSON.stringify(incoming ?? {}));
      this.working.set(cloned);
      this.baseline.set(JSON.parse(JSON.stringify(cloned)));
    }, { allowSignalWrites: true });
  }

  private updateRow(pointId: number, fn: (spec: PointPrerequisiteDto) => PointPrerequisiteDto): void {
    if (this.readonly()) return;
    const w = { ...this.working() };
    const current = w[pointId] ?? { requiredPointIds: [], safetyConditions: [] };
    w[pointId] = fn({ ...current });
    this.working.set(w);
  }

  onRequiredChange(pointId: number, ids: (number | string)[]): void {
    const numericIds = (ids ?? []).map(v => typeof v === 'string' ? Number(v) : v);
    this.updateRow(pointId, spec => ({ ...spec, requiredPointIds: numericIds }));
  }

  onAddCondition(pointId: number): void {
    this.updateRow(pointId, spec => ({ ...spec, safetyConditions: [...(spec.safetyConditions ?? []), ''] }));
  }

  onRemoveCondition(pointId: number, index: number): void {
    this.updateRow(pointId, spec => ({
      ...spec,
      safetyConditions: (spec.safetyConditions ?? []).filter((_, i) => i !== index),
    }));
  }

  onConditionChange(pointId: number, index: number, value: string): void {
    this.updateRow(pointId, spec => {
      const next = [...(spec.safetyConditions ?? [])];
      next[index] = value;
      return { ...spec, safetyConditions: next };
    });
  }

  onSave(): void {
    // Drop entries that are empty (no required points + no conditions) so we don't
    // clutter the persisted map.
    const cleaned: Record<number, PointPrerequisiteDto> = {};
    const w = this.working();
    for (const [k, v] of Object.entries(w)) {
      const reqs = (v.requiredPointIds ?? []).filter(id => Number.isFinite(id));
      const conds = (v.safetyConditions ?? []).map(c => c.trim()).filter(c => c.length > 0);
      if (reqs.length || conds.length) {
        cleaned[Number(k)] = { requiredPointIds: reqs, safetyConditions: conds };
      }
    }
    this.save.emit(cleaned);
  }

  onReset(): void {
    this.working.set(JSON.parse(JSON.stringify(this.baseline())));
  }
}
