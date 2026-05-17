import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { PointPrerequisiteDto } from '../../../../../models/loto/loto-standard.model';

type Side = 'INSTALL' | 'REMOVAL';

interface RowState {
  pointId: number;
  tagNumber: string;
  description: string;
  // active-side projection — what the current tab renders
  predecessorIds: number[];
  safetyConditions: string[];
  notes: string;
  removalOrder: number | null; // only meaningful on REMOVAL tab
  inheritingFromInstall: boolean; // removal-only flag — true when removal fields are empty
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
        @if (side() === 'REMOVAL') {
          <p class="hint">
            Empty rows inherit from the install side. Use the per-point overrides only when removal needs to differ.
          </p>
        }
        <table class="prereq-table">
          <thead>
            <tr>
              <th style="width: 10%">Tag #</th>
              <th style="width: 18%">Description</th>
              @if (side() === 'REMOVAL') {
                <th style="width: 6%" title="Removal order — lower numbers come first. Leave blank to follow install order.">Rem. Order</th>
              }
              <th style="width: 18%">Required predecessors</th>
              <th style="width: 22%">Safety conditions to acknowledge</th>
              <th style="width: 22%">{{ side() === 'INSTALL' ? 'Install notes' : 'Removal notes' }}</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.pointId) {
              <tr [class.inheriting]="row.inheritingFromInstall">
                <td>{{ row.tagNumber }}</td>
                <td>{{ row.description }}</td>
                @if (side() === 'REMOVAL') {
                  <td>
                    <input type="number" class="order-input"
                           [ngModel]="row.removalOrder"
                           (ngModelChange)="onRemovalOrderChange(row.pointId, $event)"
                           placeholder="—">
                  </td>
                }
                <td>
                  <div class="pred-chips">
                    @for (predId of row.predecessorIds; track predId) {
                      <span class="chip" [class.inherited]="row.inheritingFromInstall">
                        <span class="chip-label">{{ tagFor(predId) }}</span>
                        @if (!row.inheritingFromInstall) {
                          <button type="button" class="chip-remove"
                                  (click)="togglePredecessor(row.pointId, predId)"
                                  title="Remove">×</button>
                        }
                      </span>
                    }
                    @if (points().length > 1) {
                      <button type="button" class="add-pred-btn"
                              (click)="openPredecessorPicker(row.pointId)"
                              [title]="side() === 'REMOVAL' && row.inheritingFromInstall ? 'Override removal predecessors' : 'Add predecessor'">+</button>
                    } @else {
                      <span class="pred-empty">No other points</span>
                    }
                  </div>
                </td>
                <td>
                  <div class="conditions">
                    @for (cond of row.safetyConditions; track $index) {
                      <div class="cond-row">
                        @if (row.inheritingFromInstall) {
                          <span class="cond-inherited">{{ cond }}</span>
                        } @else {
                          <input type="text" class="cond-input"
                                 [ngModel]="cond"
                                 (ngModelChange)="onConditionChange(row.pointId, $index, $event)"
                                 placeholder="e.g. MOV must be Open">
                          <button type="button" class="remove-cond" (click)="onRemoveCondition(row.pointId, $index)">×</button>
                        }
                      </div>
                    }
                    @if (!row.inheritingFromInstall) {
                      <button type="button" class="add-cond" (click)="onAddCondition(row.pointId)">+ Add condition</button>
                    } @else if (row.safetyConditions.length > 0) {
                      <button type="button" class="add-cond" (click)="overrideRemovalConditions(row.pointId)">Override for removal</button>
                    } @else {
                      <button type="button" class="add-cond" (click)="overrideRemovalConditions(row.pointId)">+ Add removal condition</button>
                    }
                  </div>
                </td>
                <td>
                  <textarea class="notes-input"
                            [ngModel]="row.notes"
                            (ngModelChange)="onNotesChange(row.pointId, $event)"
                            [placeholder]="side() === 'INSTALL' ? 'Steps to follow when hanging this point' : 'Steps to follow when removing this point'"></textarea>
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

      @if (pickerRowId() !== null) {
        <div class="picker-backdrop" (click)="closePicker()">
          <div class="picker-dialog" (click)="$event.stopPropagation()">
            <div class="picker-header">
              <strong>{{ side() === 'INSTALL' ? 'Install' : 'Removal' }} predecessors for {{ activeRowTag() }}</strong>
              <button type="button" class="picker-close" (click)="closePicker()">×</button>
            </div>
            <div class="picker-body">
              @for (other of points(); track other.id) {
                @if (isPickerCandidate(pickerRowId()!, other.id!)) {
                  <div class="picker-row"
                       [class.selected]="isPredecessor(pickerRowId()!, other.id!)"
                       (click)="togglePredecessor(pickerRowId()!, other.id!)">
                    <span class="pred-tag">{{ other.tagNumber }}</span>
                    <span class="pred-desc">{{ other.description }}</span>
                  </div>
                }
              }
            </div>
            <div class="picker-footer">
              <button type="button" class="btn-save" (click)="closePicker()">Done</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .prereq-editor { padding: 12px; }
    .hint { color: #888; font-size: 12px; font-style: italic; margin: 0 0 8px; padding: 4px 8px; background: #1a1a1a; border-left: 3px solid #555; }
    .empty { color: #888; font-style: italic; }
    .prereq-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .prereq-table th, .prereq-table td { padding: 8px; text-align: left; border-bottom: 1px solid #2a2a2a; vertical-align: top; }
    .prereq-table th { color: #aaa; font-weight: 500; background: #181818; }
    .prereq-table tr.inheriting { background: rgba(255, 255, 255, 0.02); }
    .pred-chips { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
    .chip { display: inline-flex; align-items: center; gap: 4px; background: #2a3a50; color: #ddd; border-radius: 12px; padding: 2px 4px 2px 8px; font-size: 12px; }
    .chip.inherited { background: #2a2a2a; color: #888; font-style: italic; }
    .chip-label { line-height: 1; }
    .chip-remove { background: none; border: none; color: #aaa; cursor: pointer; font-size: 14px; line-height: 1; padding: 0 4px; border-radius: 50%; }
    .chip-remove:hover { background: rgba(255,255,255,0.1); color: #e57373; }
    .add-pred-btn { background: none; border: 1px dashed #555; color: #82b1ff; width: 22px; height: 22px; line-height: 1; border-radius: 50%; cursor: pointer; font-size: 14px; }
    .add-pred-btn:hover { background: #1f2937; border-color: #82b1ff; }
    .pred-empty { color: #666; font-style: italic; font-size: 11px; }
    .cond-inherited { color: #888; font-style: italic; font-size: 12px; padding: 4px 6px; }
    .picker-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .picker-dialog { background: #1f1f1f; border: 1px solid #333; border-radius: 8px; min-width: 380px; max-width: 540px; max-height: 70vh; display: flex; flex-direction: column; }
    .picker-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #2a2a2a; color: #ddd; }
    .picker-close { background: none; border: none; color: #aaa; font-size: 20px; cursor: pointer; padding: 0 6px; }
    .picker-close:hover { color: #e57373; }
    .picker-body { padding: 8px 16px; overflow-y: auto; flex: 1; }
    .picker-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; cursor: pointer; font-size: 13px; color: #ddd; border-bottom: 1px solid #232323; border-left: 3px solid transparent; user-select: none; transition: background 0.12s, border-left-color 0.12s; }
    .picker-row:hover { background: #262626; }
    .picker-row.selected { background: #1f3047; border-left-color: #82b1ff; color: #fff; }
    .picker-row.selected:hover { background: #25395a; }
    .pred-tag { font-weight: 600; min-width: 72px; }
    .pred-desc { color: #888; font-size: 12px; }
    .picker-footer { padding: 10px 16px; border-top: 1px solid #2a2a2a; display: flex; justify-content: flex-end; }
    .conditions { display: flex; flex-direction: column; gap: 4px; }
    .cond-row { display: flex; gap: 4px; align-items: center; }
    .cond-input { flex: 1; background: #1a1a1a; color: #ddd; border: 1px solid #333; border-radius: 4px; padding: 4px 6px; }
    .order-input { width: 100%; background: #1a1a1a; color: #ddd; border: 1px solid #333; border-radius: 4px; padding: 4px 6px; text-align: center; }
    .notes-input { width: 100%; min-height: 80px; resize: vertical; background: #1a1a1a; color: #ddd; border: 1px solid #333; border-radius: 4px; padding: 4px 6px; font-family: inherit; font-size: 12px; }
    .remove-cond { background: none; border: none; color: #e57373; font-size: 16px; cursor: pointer; padding: 0 6px; }
    .add-cond { background: none; border: 1px dashed #444; color: #82b1ff; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; align-self: flex-start; }
    .actions { display: flex; gap: 8px; margin-top: 12px; padding-top: 8px; border-top: 1px solid #2a2a2a; }
    .btn-save { background: var(--accent-color, #2196F3); color: white; border: none; padding: 8px 14px; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .btn-cancel { background: none; color: #aaa; border: 1px solid #444; padding: 8px 14px; border-radius: 4px; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class PointPrerequisitesEditorComponent {
  points = input.required<LotoPointDto[]>();
  prerequisites = input<Record<number, PointPrerequisiteDto> | null>(null);
  readonly = input<boolean>(false);
  saving = input<boolean>(false);
  removalReversesOrder = input<boolean>(false);
  /** Parent-controlled side. Defaults to INSTALL; can be bound via [side]. */
  side = input<Side>('INSTALL');

  save = output<Record<number, PointPrerequisiteDto>>();
  removalReverseChange = output<boolean>();

  private working = signal<Record<number, PointPrerequisiteDto>>({});
  private baseline = signal<Record<number, PointPrerequisiteDto>>({});
  private lastSeenInputJson = signal<string | null>(null);

  rows = computed<RowState[]>(() => {
    const w = this.working();
    const s = this.side();
    return this.points().map(p => {
      const spec = w[p.id!];
      if (s === 'INSTALL') {
        return {
          pointId: p.id!,
          tagNumber: p.tagNumber ?? '',
          description: p.description ?? '',
          predecessorIds: spec?.installRequiredPointIds ?? [],
          safetyConditions: spec?.installSafetyConditions ?? [],
          notes: spec?.installNotes ?? '',
          removalOrder: null,
          inheritingFromInstall: false,
        };
      }
      const hasRemovalPreds = (spec?.removalRequiredPointIds?.length ?? 0) > 0;
      const hasRemovalConds = (spec?.removalSafetyConditions?.length ?? 0) > 0;
      // If nothing on the removal side, inherit display from install.
      const inheriting = !hasRemovalPreds && !hasRemovalConds;
      return {
        pointId: p.id!,
        tagNumber: p.tagNumber ?? '',
        description: p.description ?? '',
        predecessorIds: inheriting
          ? this.computeInheritedRemovalPreds(p.id!, spec)
          : (spec?.removalRequiredPointIds ?? []),
        safetyConditions: hasRemovalConds
          ? (spec?.removalSafetyConditions ?? [])
          : (spec?.installSafetyConditions ?? []),
        notes: spec?.removalNotes ?? '',
        removalOrder: spec?.removalOrder ?? null,
        inheritingFromInstall: inheriting,
      };
    });
  });

  /** When a removal row inherits, show install predecessors (optionally reversed). */
  private computeInheritedRemovalPreds(pointId: number, spec: PointPrerequisiteDto | undefined): number[] {
    if (!this.removalReversesOrder()) return spec?.installRequiredPointIds ?? [];
    // Reverse the graph: this point's "removal predecessors" become the points that
    // have THIS point as an install predecessor.
    const all = this.working();
    return Object.entries(all)
      .filter(([k, v]) => Number(k) !== pointId
        && (v.installRequiredPointIds ?? []).includes(pointId))
      .map(([k]) => Number(k));
  }

  dirty = computed(() => JSON.stringify(this.working()) !== JSON.stringify(this.baseline()));

  constructor() {
    effect(() => {
      const incoming = this.prerequisites();
      const incomingJson = JSON.stringify(incoming ?? {});
      const lastJson = this.lastSeenInputJson();
      if (incomingJson === lastJson && lastJson !== null) return;
      if (lastJson !== null && this.dirty()) return;
      const cloned = JSON.parse(incomingJson) as Record<number, PointPrerequisiteDto>;
      this.working.set(this.normalizeIncoming(cloned));
      this.baseline.set(this.normalizeIncoming(JSON.parse(incomingJson)));
      this.lastSeenInputJson.set(incomingJson);
    }, { allowSignalWrites: true });
  }

  /** Defensive: ensure every spec has the new install/removal arrays defined. */
  private normalizeIncoming(map: Record<number, PointPrerequisiteDto>): Record<number, PointPrerequisiteDto> {
    const out: Record<number, PointPrerequisiteDto> = {};
    for (const [k, v] of Object.entries(map ?? {})) {
      out[Number(k)] = {
        installRequiredPointIds: v.installRequiredPointIds ?? [],
        installSafetyConditions: v.installSafetyConditions ?? [],
        installNotes: v.installNotes ?? null,
        removalRequiredPointIds: v.removalRequiredPointIds ?? [],
        removalSafetyConditions: v.removalSafetyConditions ?? [],
        removalNotes: v.removalNotes ?? null,
        removalOrder: v.removalOrder ?? null,
      };
    }
    return out;
  }

  private updateRow(pointId: number, fn: (spec: PointPrerequisiteDto) => PointPrerequisiteDto): void {
    if (this.readonly()) return;
    const w = { ...this.working() };
    const current = w[pointId] ?? this.blankSpec();
    w[pointId] = fn({ ...current });
    this.working.set(w);
  }

  private blankSpec(): PointPrerequisiteDto {
    return {
      installRequiredPointIds: [],
      installSafetyConditions: [],
      installNotes: null,
      removalRequiredPointIds: [],
      removalSafetyConditions: [],
      removalNotes: null,
      removalOrder: null,
    };
  }

  isPredecessor(pointId: number, candidateId: number): boolean {
    const spec = this.working()[pointId];
    const list = this.side() === 'INSTALL'
      ? spec?.installRequiredPointIds
      : (spec?.removalRequiredPointIds?.length ? spec.removalRequiredPointIds : null);
    if (list) return list.includes(candidateId);
    // Inheriting case for REMOVAL: render install preds as "checked" but they're not actually
    // persisted on the removal side — checking still toggles into an override.
    if (this.side() === 'REMOVAL') {
      return (spec?.installRequiredPointIds ?? []).includes(candidateId);
    }
    return false;
  }

  togglePredecessor(pointId: number, candidateId: number): void {
    if (this.side() === 'INSTALL') {
      this.updateRow(pointId, spec => {
        const existing = spec.installRequiredPointIds ?? [];
        const next = existing.includes(candidateId)
          ? existing.filter(id => id !== candidateId)
          : [...existing, candidateId];
        return { ...spec, installRequiredPointIds: next };
      });
      return;
    }
    // REMOVAL side: if inheriting, materialize current displayed list first, then toggle.
    this.updateRow(pointId, spec => {
      const hasOverride = (spec.removalRequiredPointIds?.length ?? 0) > 0;
      const base = hasOverride
        ? spec.removalRequiredPointIds!
        : this.computeInheritedRemovalPreds(pointId, spec);
      const next = base.includes(candidateId)
        ? base.filter(id => id !== candidateId)
        : [...base, candidateId];
      return { ...spec, removalRequiredPointIds: next };
    });
  }

  tagFor(pointId: number): string {
    const p = this.points().find(x => x.id === pointId);
    return p?.tagNumber ?? `#${pointId}`;
  }

  /**
   * Adding {@code candidate} as a predecessor of {@code pickerRow} would create
   * a cycle when {@code pickerRow} is already a (transitive) predecessor of
   * {@code candidate}. The picker hides candidates flagged here.
   */
  private wouldCreateCycle(pickerRow: number, candidate: number): boolean {
    const visited = new Set<number>();
    const stack: number[] = [candidate];
    const w = this.working();
    const useRemoval = this.side() === 'REMOVAL';
    while (stack.length) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      const spec = w[cur];
      if (!spec) continue;
      // Walk the predecessor edges in the same direction the user is editing.
      const preds = useRemoval
        ? (spec.removalRequiredPointIds && spec.removalRequiredPointIds.length > 0
            ? spec.removalRequiredPointIds
            : (spec.installRequiredPointIds ?? []))
        : (spec.installRequiredPointIds ?? []);
      for (const p of preds) {
        if (p === pickerRow) return true;
        if (!visited.has(p)) stack.push(p);
      }
    }
    return false;
  }

  /** Picker visibility: not self, and adding it wouldn't create a cycle. */
  isPickerCandidate(pickerRow: number, candidate: number): boolean {
    if (pickerRow === candidate) return false;
    // Already-selected predecessors always show so the user can de-select.
    if (this.isPredecessor(pickerRow, candidate)) return true;
    return !this.wouldCreateCycle(pickerRow, candidate);
  }

  // ── Picker dialog ─────────────────────────────────────────────────────────
  pickerRowId = signal<number | null>(null);

  openPredecessorPicker(rowId: number): void {
    if (this.readonly()) return;
    this.pickerRowId.set(rowId);
  }

  closePicker(): void { this.pickerRowId.set(null); }

  activeRowTag(): string {
    const id = this.pickerRowId();
    return id == null ? '' : this.tagFor(id);
  }

  // ── Safety conditions ─────────────────────────────────────────────────────

  onAddCondition(pointId: number): void {
    if (this.side() === 'INSTALL') {
      this.updateRow(pointId, spec => ({
        ...spec, installSafetyConditions: [...(spec.installSafetyConditions ?? []), ''],
      }));
    } else {
      this.updateRow(pointId, spec => ({
        ...spec, removalSafetyConditions: [...(spec.removalSafetyConditions ?? []), ''],
      }));
    }
  }

  onRemoveCondition(pointId: number, index: number): void {
    if (this.side() === 'INSTALL') {
      this.updateRow(pointId, spec => ({
        ...spec,
        installSafetyConditions: (spec.installSafetyConditions ?? []).filter((_, i) => i !== index),
      }));
    } else {
      this.updateRow(pointId, spec => ({
        ...spec,
        removalSafetyConditions: (spec.removalSafetyConditions ?? []).filter((_, i) => i !== index),
      }));
    }
  }

  onConditionChange(pointId: number, index: number, value: string): void {
    if (this.side() === 'INSTALL') {
      this.updateRow(pointId, spec => {
        const next = [...(spec.installSafetyConditions ?? [])];
        next[index] = value;
        return { ...spec, installSafetyConditions: next };
      });
    } else {
      this.updateRow(pointId, spec => {
        const next = [...(spec.removalSafetyConditions ?? [])];
        next[index] = value;
        return { ...spec, removalSafetyConditions: next };
      });
    }
  }

  /** Removal-side action: materialize current inherited conditions into a removal override. */
  overrideRemovalConditions(pointId: number): void {
    this.updateRow(pointId, spec => {
      const seed = (spec.removalSafetyConditions?.length ?? 0) > 0
        ? spec.removalSafetyConditions!
        : [...(spec.installSafetyConditions ?? []), ''];
      // If nothing to seed, start with one blank row.
      return { ...spec, removalSafetyConditions: seed.length ? [...seed] : [''] };
    });
  }

  onNotesChange(pointId: number, value: string): void {
    if (this.side() === 'INSTALL') {
      this.updateRow(pointId, spec => ({ ...spec, installNotes: value ?? '' }));
    } else {
      this.updateRow(pointId, spec => ({ ...spec, removalNotes: value ?? '' }));
    }
  }

  onRemovalOrderChange(pointId: number, value: number | string | null): void {
    let next: number | null;
    if (value === null || value === undefined || value === '') {
      next = null;
    } else {
      const n = typeof value === 'string' ? Number(value) : value;
      next = Number.isFinite(n) ? Math.trunc(n as number) : null;
    }
    this.updateRow(pointId, spec => ({ ...spec, removalOrder: next }));
  }

  onSave(): void {
    const cleaned: Record<number, PointPrerequisiteDto> = {};
    for (const [k, v] of Object.entries(this.working())) {
      const iReqs = (v.installRequiredPointIds ?? []).filter(id => Number.isFinite(id));
      const iConds = (v.installSafetyConditions ?? []).map(c => c.trim()).filter(c => c.length > 0);
      const rReqs = (v.removalRequiredPointIds ?? []).filter(id => Number.isFinite(id));
      const rConds = (v.removalSafetyConditions ?? []).map(c => c.trim()).filter(c => c.length > 0);
      const iNotes = (v.installNotes ?? '').trim();
      const rNotes = (v.removalNotes ?? '').trim();
      const rOrder = v.removalOrder ?? null;
      const anything = iReqs.length || iConds.length || rReqs.length || rConds.length
                    || iNotes || rNotes || rOrder !== null;
      if (!anything) continue;
      cleaned[Number(k)] = {
        installRequiredPointIds: iReqs,
        installSafetyConditions: iConds,
        installNotes: iNotes || null,
        removalRequiredPointIds: rReqs,
        removalSafetyConditions: rConds,
        removalNotes: rNotes || null,
        removalOrder: rOrder,
      };
    }
    this.save.emit(cleaned);
  }

  onReset(): void {
    this.working.set(JSON.parse(JSON.stringify(this.baseline())));
  }
}
