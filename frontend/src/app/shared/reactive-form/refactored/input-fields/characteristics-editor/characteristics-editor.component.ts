import { Component, forwardRef, Input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LotoPointCharacteristic } from '../../../../../models/loto/loto-point.model';
import { RfValueSelectComponent } from '../../../../../features/values/refactored/components/rf-value-select/rf-value-select.component';
import { RfValueDto } from '../../../../../features/values/refactored/models/rf-value.model';

@Component({
  selector: 'app-characteristics-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RfValueSelectComponent],
  templateUrl: './characteristics-editor.component.html',
  styleUrls: ['./characteristics-editor.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CharacteristicsEditorComponent),
      multi: true,
    },
  ],
})
export class CharacteristicsEditorComponent implements ControlValueAccessor {
  @Input() label: string = 'Characteristics';
  @Input() categoryAlias: string = 'equipmentCharacteristic';

  characteristics = signal<LotoPointCharacteristic[]>([]);

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: string): void {
    if (!value || value.trim() === '') {
      this.characteristics.set([]);
      return;
    }
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        this.characteristics.set(parsed);
      } else {
        this.characteristics.set([]);
      }
    } catch {
      this.characteristics.set([]);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  addCharacteristic(): void {
    const current = this.characteristics();
    this.characteristics.set([
      ...current,
      { characteristicId: 0, name: '', value: '' },
    ]);
    this.emitChange();
  }

  removeCharacteristic(index: number): void {
    const current = [...this.characteristics()];
    current.splice(index, 1);
    this.characteristics.set(current);
    this.emitChange();
  }

  onCharacteristicSelected(index: number, valueDto: RfValueDto | null): void {
    const current = [...this.characteristics()];
    if (current[index]) {
      current[index] = {
        ...current[index],
        characteristicId: valueDto?.id ?? 0,
        name: valueDto?.name ?? '',
      };
      this.characteristics.set(current);
      this.emitChange();
    }
  }

  onValueChanged(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const current = [...this.characteristics()];
    if (current[index]) {
      current[index] = {
        ...current[index],
        value: input.value,
      };
      this.characteristics.set(current);
      this.emitChange();
    }
  }

  private emitChange(): void {
    const json = JSON.stringify(this.characteristics());
    this.onChange(json);
    this.onTouched();
  }
}
