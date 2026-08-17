import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Option } from '../../../../../models/option.model';
import { SearchableSelectInputComponent } from '../searchable-select-input/searchable-select-input.component';

/** Unit a location link can be pinned to. `both` is the default and is never sent to the server. */
export type LocationUnit = 'both' | '01' | '02';

/** Control value: `{ [locationId]: unit }`. Its KEY SET is the location selection. */
export type LocationUnitSelection = Record<string, LocationUnit>;

interface SelectedRow {
  id: string;
  label: string;
  unit: LocationUnit;
}

/**
 * Location picker with a per-location unit filter.
 *
 * Location Values are shared between units on purpose (one "Duct Burner" covers both), while a work
 * area is unit-specific. So selecting a location here is two decisions at once — WHICH location, and
 * WHICH unit's equipment it should surface — and they live in one control so the unit selector can
 * never drift out of sync with the selection.
 *
 * Unit is matched downstream against the LOTO-point tag prefix (01* = Unit 1, 02* = Unit 2).
 */
@Component({
  selector: 'app-location-unit-select',
  standalone: true,
  imports: [CommonModule, SearchableSelectInputComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LocationUnitSelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="lus-container">
      <label class="lus-label">{{ label() }}</label>

      @if (rows().length > 0) {
        <div class="lus-rows">
          @for (row of rows(); track row.id) {
            <div class="lus-row">
              <span class="lus-row-name" [title]="row.label">{{ row.label }}</span>
              <div class="lus-unit-group" role="group" [attr.aria-label]="'Unit filter for ' + row.label">
                @for (choice of unitChoices; track choice.value) {
                  <button
                    type="button"
                    class="lus-unit-btn"
                    [class.active]="row.unit === choice.value"
                    [title]="choice.title"
                    (click)="setUnit(row.id, choice.value)"
                  >{{ choice.label }}</button>
                }
              </div>
              <button
                type="button"
                class="lus-remove"
                title="Remove location"
                (click)="remove(row.id)"
              >&#10005;</button>
            </div>
          }
        </div>
      } @else {
        <div class="lus-empty">No locations selected</div>
      }

      <app-searchable-select-input
        [label]="''"
        [options]="availableOptions()"
        [closeOnSelect]="true"
        (valueChange)="add($event)"
      ></app-searchable-select-input>

      <p class="lus-hint">
        Picking a unit hides the other unit's tags only (U1 hides 02*, U2 hides 01*). Tags that
        aren't 01/02 &mdash; 00* and unnumbered &mdash; always show.
      </p>
    </div>
  `,
  styles: [`
    .lus-container { display: flex; flex-direction: column; gap: 6px; width: 100%; }

    .lus-label { font-size: 13px; font-weight: 500; color: var(--secondary-text, #555); }

    .lus-rows { display: flex; flex-direction: column; gap: 4px; }

    .lus-row {
      display: flex; align-items: center; gap: 8px;
      padding: 4px 6px;
      background: var(--secondary-background, #f5f5f5);
      border: 1px solid var(--border-color, #e0e0e0);
      border-radius: 4px;
    }

    .lus-row-name {
      flex: 1; min-width: 0;
      font-size: 13px; color: var(--primary-text, #333);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    .lus-unit-group { display: flex; flex-shrink: 0; }

    .lus-unit-btn {
      padding: 2px 8px;
      border: 1px solid var(--border-color, #d1d5db);
      background: var(--primary-background, #fff);
      color: var(--secondary-text, #6b7280);
      font-size: 11px; font-weight: 500;
      cursor: pointer;
    }

    .lus-unit-btn:first-child { border-radius: 4px 0 0 4px; }
    .lus-unit-btn:last-child { border-radius: 0 4px 4px 0; }
    .lus-unit-btn + .lus-unit-btn { border-left: none; }
    .lus-unit-btn:hover { background: var(--hover-color, #f3f4f6); }

    .lus-unit-btn.active {
      background: var(--primary-color, #2196F3);
      border-color: var(--primary-color, #2196F3);
      color: #fff;
    }

    .lus-remove {
      flex-shrink: 0;
      background: none; border: none; cursor: pointer;
      color: #ef4444; font-size: 13px; padding: 0 4px;
      line-height: 1;
    }

    .lus-empty { font-size: 12px; color: #9ca3af; padding: 2px 0; }

    .lus-hint { margin: 0; font-size: 11px; color: #9ca3af; }
  `],
})
export class LocationUnitSelectComponent implements ControlValueAccessor {
  options = input<Option[]>([]);
  label = input<string>('');

  readonly unitChoices: { value: LocationUnit; label: string; title: string }[] = [
    { value: 'both', label: 'Both', title: 'No filter — show all equipment at this location' },
    { value: '01', label: 'U1', title: 'Unit 1 — hides 02 tags. 01, 00 and unnumbered tags still show.' },
    { value: '02', label: 'U2', title: 'Unit 2 — hides 01 tags. 02, 00 and unnumbered tags still show.' },
  ];

  selection = signal<LocationUnitSelection>({});

  /** Selected locations in the order chosen, resolved to their labels. */
  rows = computed<SelectedRow[]>(() => {
    const opts = this.options();
    return Object.entries(this.selection()).map(([id, unit]) => ({
      id,
      // Fall back to the raw id so a location whose Value is missing from the option
      // list still shows (and can be removed) rather than rendering as a blank row.
      label: opts.find(o => String(o.value) === id)?.label ?? `Location ${id}`,
      unit,
    }));
  });

  availableOptions = computed<Option[]>(() => {
    const selected = this.selection();
    return this.options().filter(o => selected[String(o.value)] === undefined);
  });

  private onChangeFn: (value: LocationUnitSelection) => void = () => {};
  private onTouchedFn: () => void = () => {};

  writeValue(value: LocationUnitSelection | number[] | null): void {
    this.selection.set(this.normalize(value));
  }

  registerOnChange(fn: (value: LocationUnitSelection) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  add(locationId: any): void {
    if (locationId === null || locationId === undefined || locationId === '') return;
    const key = String(locationId);
    if (this.selection()[key] !== undefined) return;
    this.commit({ ...this.selection(), [key]: 'both' });
  }

  setUnit(locationId: string, unit: LocationUnit): void {
    if (this.selection()[locationId] === undefined) return;
    this.commit({ ...this.selection(), [locationId]: unit });
  }

  remove(locationId: string): void {
    const next = { ...this.selection() };
    delete next[locationId];
    this.commit(next);
  }

  private commit(next: LocationUnitSelection): void {
    this.selection.set(next);
    this.onChangeFn(next);
    this.onTouchedFn();
  }

  /**
   * Accepts either this control's own map shape or a bare `locationIds` array, so a caller that has
   * not been migrated to the map shape still renders its selection (every entry as "both").
   */
  private normalize(value: LocationUnitSelection | number[] | null): LocationUnitSelection {
    if (Array.isArray(value)) {
      return value.reduce<LocationUnitSelection>((acc, id) => {
        if (id !== null && id !== undefined) acc[String(id)] = 'both';
        return acc;
      }, {});
    }
    if (value && typeof value === 'object') {
      return Object.entries(value).reduce<LocationUnitSelection>((acc, [id, unit]) => {
        acc[id] = unit === '01' || unit === '02' ? unit : 'both';
        return acc;
      }, {});
    }
    return {};
  }
}
