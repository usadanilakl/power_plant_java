import { Component, computed, inject, input, output, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfReactiveFormComponent } from '../../reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { LotoPointMapperService } from '../../../features/loto-points/refactored/services/rf-loto-point-mapper.service';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { RfFormField } from '../../../models/ui/form-field.model';

/**
 * Modal that hosts the full, existing Zero Energy editor (verification phrase +
 * equipment-on-P&ID picker + clipboard + edit-shared) by reusing the very same
 * `zeroEnergy` group field the LOTO point form uses. It does NOT persist — it
 * emits the group value on Save so the host can decide where to write it:
 *  - LOTO Standard → the global LotoPoint (shared)
 *  - LOTO Permit   → the snapshot copy (local)
 *
 * Single vs bulk is purely the host's concern: pass `targetCount > 1` to relabel
 * the action; the emitted value is applied by the host to each selected point.
 */
@Component({
  selector: 'app-zero-energy-editor-dialog',
  standalone: true,
  imports: [CommonModule, RfReactiveFormComponent],
  template: `
    <div class="ze-backdrop" (click)="cancelled.emit()">
      <div class="ze-dialog" (click)="$event.stopPropagation()">
        <div class="ze-header">
          <strong>{{ headerText() }}</strong>
          <button type="button" class="ze-close" (click)="cancelled.emit()">×</button>
        </div>
        <div class="ze-body">
          @if (fields().length) {
            <app-rf-reactive-form
              [fields]="fields()"
              [entity]="point()"
              [layout]="'column'"
              [showSubmitButton]="false">
            </app-rf-reactive-form>
          } @else {
            <p class="ze-empty">Zero energy editor unavailable.</p>
          }
        </div>
        <div class="ze-footer">
          <button type="button" class="ze-save" (click)="onSave()">{{ saveText() }}</button>
          <button type="button" class="ze-cancel" (click)="cancelled.emit()">Cancel</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ze-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1100; }
    .ze-dialog { background: #1f1f1f; border: 1px solid #333; border-radius: 8px; min-width: 460px; max-width: 760px; width: 70%; max-height: 85vh; display: flex; flex-direction: column; }
    .ze-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #2a2a2a; color: #ddd; }
    .ze-close { background: none; border: none; color: #aaa; font-size: 20px; cursor: pointer; padding: 0 6px; }
    .ze-close:hover { color: #e57373; }
    .ze-body { padding: 12px 16px; overflow-y: auto; flex: 1; }
    .ze-empty { color: #888; font-style: italic; }
    .ze-footer { padding: 10px 16px; border-top: 1px solid #2a2a2a; display: flex; gap: 8px; justify-content: flex-end; }
    .ze-save { background: var(--accent-color, #2196F3); color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .ze-cancel { background: none; color: #aaa; border: 1px solid #444; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
  `],
})
export class ZeroEnergyEditorDialogComponent {
  private mapper = inject(LotoPointMapperService);

  /** Seed point: the actual point for single edit, or a blank LotoPointDto for bulk. */
  point = input.required<LotoPointDto>();
  /** Number of points this edit will apply to (drives header/button text). */
  targetCount = input<number>(1);
  tagLabel = input<string>('');

  /** Emits the zeroEnergy group value: { zeroEnergyTemplate: number|null, templateEquipment: EquipmentDto[], editShared: boolean }. */
  saved = output<any>();
  cancelled = output<void>();

  private formRef = viewChild(RfReactiveFormComponent);

  fields = computed<RfFormField[]>(() => {
    const ze = this.mapper.toFormFields(this.point()).find(f => f.name === 'zeroEnergy');
    return ze ? [ze] : [];
  });

  headerText = computed(() => {
    const n = this.targetCount();
    if (n > 1) return `Zero Energy — apply to ${n} selected points`;
    const tag = this.tagLabel();
    return tag ? `Zero Energy — ${tag}` : 'Zero Energy';
  });

  saveText = computed(() => this.targetCount() > 1 ? `Apply to ${this.targetCount()} points` : 'Save');

  onSave(): void {
    const raw = this.formRef()?.getCurrentFormValues();
    this.saved.emit(raw?.zeroEnergy ?? null);
  }
}
