import {
  Component, input, inject, signal, effect, ViewChild,
  AfterViewInit, computed, Injector, output, DestroyRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchableSelectInputComponent } from '../../../../../shared/reactive-form/refactored/input-fields/searchable-select-input/searchable-select-input.component';
import { WorkAreaApiService } from '../../services/work-area-api.service';
import { WorkAreaDto } from '../../../../../models/permits/work-area.model';
import { Option } from '../../../../../models/option.model';
import { WorkAreaMapPickerComponent } from '../work-area-map-picker/work-area-map-picker.component';
import { RfPopupProjectionComponent } from '../../../../../shared/popup-projection/rf-popup-projection.component';

@Component({
  selector: 'app-work-area-select',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectInputComponent, WorkAreaMapPickerComponent, RfPopupProjectionComponent],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: WorkAreaSelectComponent,
    multi: true
  }],
  template: `
    <div class="work-area-select">
      @switch (viewMode()) {
        @case ('dropdown') {
          <app-searchable-select-input
            [label]="label()"
            [options]="options()"
            [categoryName]="''"
            #selectInput
          ></app-searchable-select-input>
        }
        @case ('map') {
          <label class="map-label">{{ label() }}</label>
          <app-work-area-map-picker
            #mapPicker
            (workAreaSelected)="onMapWorkAreaSelected($event)"
          ></app-work-area-map-picker>
        }
        @case ('both') {
          <div class="both-wrapper">
            <div class="dropdown-with-map-btn">
              <app-searchable-select-input
                [label]="label()"
                [options]="options()"
                [categoryName]="''"
                #selectInput
              ></app-searchable-select-input>
              <button type="button" class="map-btn" (click)="isMapOpen.set(true)" title="Open map">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
                </svg>
              </button>
            </div>
            <app-rf-popup-projection
              [isOpen]="isMapOpen()"
              title="Select Work Area"
              size="xlarge"
              [fullHeight]="true"
              [zIndex]="99999"
              (close)="isMapOpen.set(false)"
            >
              <app-work-area-map-picker
                #popupMapPicker
                style="--map-height: 80vh"
                (workAreaSelected)="onPopupMapWorkAreaSelected($event)"
              ></app-work-area-map-picker>
            </app-rf-popup-projection>
          </div>
        }
      }
      @if (fallbackText() && !value()) {
        <div class="fallback-location">Old location: {{ fallbackText() }}</div>
      }
    </div>
  `,
  styles: [`
    .work-area-select { width: 100%; }
    .map-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #555;
      margin-bottom: 4px;
    }
    .both-wrapper { width: 100%; position: relative; z-index: 9999; }
    .dropdown-with-map-btn {
      display: flex;
      align-items: flex-end;
      gap: 4px;
    }
    .dropdown-with-map-btn app-searchable-select-input { flex: 1; }
    .map-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid #ccc;
      border-radius: 6px;
      background: #fff;
      color: #1565c0;
      cursor: pointer;
      flex-shrink: 0;
    }
    .map-btn:hover { background: #e3f2fd; }
    .fallback-location {
      margin-top: 4px;
      padding: 4px 8px;
      font-size: 12px;
      color: #666;
      background: #fff3e0;
      border: 1px solid #ffcc80;
      border-radius: 4px;
    }
  `]
})
export class WorkAreaSelectComponent implements ControlValueAccessor, AfterViewInit {
  private api = inject(WorkAreaApiService);
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);

  @ViewChild('selectInput') selectInput!: SearchableSelectInputComponent;
  @ViewChild('mapPicker') mapPicker!: WorkAreaMapPickerComponent;
  @ViewChild('popupMapPicker') popupMapPicker!: WorkAreaMapPickerComponent;

  // Inputs
  label = input<string>('Work Area');
  viewMode = input<'dropdown' | 'map' | 'both'>('dropdown');
  fallbackText = input<string | null>(null);

  // Outputs - emits full WorkAreaDto so parent can read constantHazards
  workAreaSelected = output<WorkAreaDto | null>();

  // State
  value = signal<any>(null);
  disabled = signal<boolean>(false);
  isMapOpen = signal(false);
  private workAreas = signal<WorkAreaDto[]>([]);

  // Options computed from loaded work areas
  options = computed<Option[]>(() => {
    return this.workAreas().map(wa => ({
      value: wa.id,
      label: wa.name,
    }));
  });

  // CVA internals
  private onChange = (value: any) => {};
  private onTouched = () => {};
  private pendingValue: any = undefined;
  private hasPendingValue = false;

  constructor() {
    // Load work areas on init
    this.api.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (areas) => this.workAreas.set(areas),
    });
  }

  ngAfterViewInit(): void {
    this.setupDropdown();
    this.setupMapPicker();
  }

  private setupDropdown(): void {
    if (!this.selectInput) return;

    this.selectInput.registerOnChange((val: any) => {
      this.value.set(val);
      this.onChange(val);
      this.emitSelectedWorkArea(val);
    });
    this.selectInput.registerOnTouched(() => this.onTouched());

    if (this.hasPendingValue) {
      this.selectInput.writeValue(this.pendingValue);
      this.hasPendingValue = false;
      this.pendingValue = undefined;
    }

    // Re-apply value when options load
    effect(() => {
      const opts = this.options();
      const val = this.value();
      if (opts.length > 0 && val !== null && val !== undefined && this.selectInput) {
        setTimeout(() => {
          if (this.selectInput) {
            this.selectInput.writeValue(val);
          }
        }, 0);
      }
    }, { injector: this.injector });
  }

  private setupMapPicker(): void {
    if (this.mapPicker && this.hasPendingValue) {
      this.mapPicker.writeValue(this.pendingValue);
      this.hasPendingValue = false;
      this.pendingValue = undefined;
    }
  }

  // --- ControlValueAccessor ---

  writeValue(value: any): void {
    this.value.set(value);
    if (this.selectInput) {
      this.selectInput.writeValue(value);
    } else if (this.mapPicker) {
      this.mapPicker.writeValue(value);
    } else {
      this.pendingValue = value;
      this.hasPendingValue = true;
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (this.selectInput) {
      this.selectInput.setDisabledState(isDisabled);
    }
  }

  // --- Map selection handlers ---

  onMapWorkAreaSelected(workArea: WorkAreaDto | null): void {
    if (!workArea) return;
    this.value.set(workArea.id);
    this.onChange(workArea.id);
    this.onTouched();
    this.workAreaSelected.emit(workArea);
  }

  onPopupMapWorkAreaSelected(workArea: WorkAreaDto | null): void {
    if (!workArea) return;
    this.value.set(workArea.id);
    this.onChange(workArea.id);
    this.onTouched();
    this.workAreaSelected.emit(workArea);

    // Sync dropdown
    if (this.selectInput) {
      this.selectInput.writeValue(workArea.id);
    }
    this.isMapOpen.set(false);
  }

  // --- Helpers ---

  private emitSelectedWorkArea(valueId: any): void {
    if (valueId === null || valueId === undefined) {
      this.workAreaSelected.emit(null);
      return;
    }
    const selected = this.workAreas().find(wa => wa.id === valueId) || null;
    this.workAreaSelected.emit(selected);
  }

  /** Reload work areas (e.g., after creating a new one) */
  refresh(): void {
    this.api.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (areas) => this.workAreas.set(areas),
    });
  }
}
