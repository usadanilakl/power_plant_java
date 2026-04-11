import { Component, input, output, signal, effect, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BulkCreateCard } from '../services/loto-point-bulk-create.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfValueSelectComponent } from '../../../values/refactored/components/rf-value-select/rf-value-select.component';
import { RfValueDto } from '../../../values/refactored/models/rf-value.model';
import { CharacteristicsEditorComponent } from '../../../../shared/reactive-form/refactored/input-fields/characteristics-editor/characteristics-editor.component';
import { LotoPointCounterpartService } from '../services/loto-point-counterpart.service';

@Component({
  selector: 'app-loto-point-create-card',
  standalone: true,
  imports: [CommonModule, FormsModule, RfValueSelectComponent, CharacteristicsEditorComponent],
  templateUrl: './loto-point-create-card.component.html',
  styleUrls: ['./loto-point-create-card.component.css'],
})
export class LotoPointCreateCardComponent {
  private counterpartService = inject(LotoPointCounterpartService);

  card = input.required<BulkCreateCard>();
  cardIndex = input<number>(0);
  isCounterpart = input<boolean>(false);

  cardChanged = output<LotoPointDto>();
  remove = output<void>();
  selectionToggled = output<void>();
  generateCounterpart = output<void>();
  saveCard = output<void>();

  // Local form state
  tagNumber = signal('');
  description = signal('');
  specificLocation = signal('');
  locationId = signal<number | null>(null);
  normPosId = signal<number | null>(null);
  isoPosId = signal<number | null>(null);
  characteristicsJson = signal('[]');

  private suppressEmit = false;

  constructor() {
    // Sync card input → local signals
    effect(() => {
      const c = this.card();
      this.suppressEmit = true;
      this.tagNumber.set(c.lotoPoint.tagNumber || '');
      this.description.set(c.lotoPoint.description || '');
      this.specificLocation.set(c.lotoPoint.specificLocation || '');
      this.locationId.set(c.lotoPoint.location?.id ?? null);
      this.normPosId.set(c.lotoPoint.normPos?.id ?? null);
      this.isoPosId.set(c.lotoPoint.isoPos?.id ?? null);
      this.characteristicsJson.set(c.lotoPoint.characteristicsJson || '[]');
      this.suppressEmit = false;
    });
  }

  get isDraft(): boolean {
    return this.card().status === 'draft';
  }

  get canGenerateCounterpart(): boolean {
    return this.isDraft
      && !this.card().counterpartUid
      && !this.isCounterpart()
      && this.counterpartService.isUnitSpecific(this.card().lotoPoint);
  }

  get statusLabel(): string {
    switch (this.card().status) {
      case 'saving': return 'Saving...';
      case 'saved': return 'Saved';
      case 'error': return 'Error';
      default: return '';
    }
  }

  get statusClass(): string {
    return 'status-' + this.card().status;
  }

  onFieldChange(): void {
    if (this.suppressEmit) return;
    this.emitCard();
  }

  onLocationSelected(value: RfValueDto | null): void {
    this.locationId.set(value?.id ?? null);
    this.emitCard({ location: value ? { id: value.id, name: value.name } as any : null });
  }

  onNormPosSelected(value: RfValueDto | null): void {
    this.normPosId.set(value?.id ?? null);
    this.emitCard({ normPos: value ? { id: value.id, name: value.name } as any : null });
  }

  onIsoPosSelected(value: RfValueDto | null): void {
    this.isoPosId.set(value?.id ?? null);
    this.emitCard({ isoPos: value ? { id: value.id, name: value.name } as any : null });
  }

  onCharacteristicsChanged(json: string): void {
    this.characteristicsJson.set(json);
    this.emitCard({ characteristicsJson: json });
  }

  private emitCard(overrides: Partial<LotoPointDto> = {}): void {
    const updated = new LotoPointDto({
      ...this.card().lotoPoint,
      tagNumber: this.tagNumber(),
      description: this.description(),
      specificLocation: this.specificLocation(),
      characteristicsJson: this.characteristicsJson(),
      ...overrides,
    });
    this.cardChanged.emit(updated);
  }
}
