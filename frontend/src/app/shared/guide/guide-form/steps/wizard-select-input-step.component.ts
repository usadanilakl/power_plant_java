import { Component, input, output, signal, effect, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { HttpClient } from '@angular/common/http';
import { WizardStep, StepDataPayload, WizardFlowType } from '../wizard-stack.types';
import { ValueDto } from '../../../../models/value.model';

interface SelectOption {
  value: any;
  label: string;
}

@Component({
  selector: 'app-wizard-select-input-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatInputModule,
  ],
  template: `
    <div class="select-input-container">
      @if (step().selectConfig?.searchable) {
        <!-- Searchable autocomplete -->
        <mat-form-field appearance="outline" class="full-width">
          <input
            matInput
            [placeholder]="'Search or select...'"
            [(ngModel)]="searchText"
            [matAutocomplete]="auto"
            (ngModelChange)="onSearchChange($event)"
          />
          <mat-autocomplete
            #auto="matAutocomplete"
            [displayWith]="displayFn"
            (optionSelected)="onOptionSelected($event.option.value)"
          >
            @for (option of filteredOptions(); track option.value) {
              <mat-option [value]="option">
                {{ option.label }}
              </mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>
      } @else {
        <!-- Standard select -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-select
            [(ngModel)]="selectedValue"
            (ngModelChange)="onSelectionChange($event)"
            [placeholder]="'Select an option...'"
          >
            @for (option of options(); track option.value) {
              <mat-option [value]="option.value">
                {{ option.label }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      @if (step().selectConfig?.allowCreate) {
        <div class="create-new-container">
          <span class="or-text">or</span>
          <button mat-stroked-button (click)="onCreateNewClick()">
            <mat-icon>add</mat-icon>
            Create New
          </button>
        </div>
      }

      @if (isLoading()) {
        <div class="loading-indicator">Loading options...</div>
      }
    </div>
  `,
  styles: [`
    .select-input-container {
      padding: 10px 0;
    }

    .full-width {
      width: 100%;
    }

    .create-new-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px dashed #e0e0e0;
    }

    .or-text {
      color: #999;
      font-size: 14px;
    }

    .loading-indicator {
      text-align: center;
      color: #666;
      padding: 10px;
    }
  `],
})
export class WizardSelectInputStepComponent implements OnInit {
  private http = inject(HttpClient);

  step = input.required<WizardStep>();
  currentValue = input<any>(null);

  valueChange = output<StepDataPayload>();
  createNew = output<{ flowType: WizardFlowType; field: string; initialData?: any }>();

  options = signal<SelectOption[]>([]);
  filteredOptions = signal<SelectOption[]>([]);
  isLoading = signal(false);

  selectedValue: any = null;
  searchText = '';

  constructor() {
    effect(() => {
      const current = this.currentValue();
      if (current) {
        if (typeof current === 'object' && current.id) {
          if (this.selectedValue !== current.id) {
            this.selectedValue = current.id;
            this.searchText = current.name || '';
          }
        } else {
          if (this.selectedValue !== current) {
            this.selectedValue = current;
          }
        }
      } else {
        // Reset when no value
        if (this.selectedValue !== null) {
          this.selectedValue = null;
          this.searchText = '';
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadOptions();
  }

  loadOptions(): void {
    const config = this.step().selectConfig;
    if (!config) return;

    if (config.optionsSource === 'static' && config.staticOptions) {
      this.options.set(config.staticOptions);
      this.filteredOptions.set(config.staticOptions);
    } else if (config.optionsSource === 'api' && config.apiEndpoint) {
      this.isLoading.set(true);
      // TODO: Use actual API service
      // Simulating API call for now
      setTimeout(() => {
        const mockOptions: SelectOption[] = [
          { value: { id: 1, name: 'Option 1' }, label: 'Option 1' },
          { value: { id: 2, name: 'Option 2' }, label: 'Option 2' },
          { value: { id: 3, name: 'Option 3' }, label: 'Option 3' },
        ];
        this.options.set(mockOptions);
        this.filteredOptions.set(mockOptions);
        this.isLoading.set(false);
      }, 300);
    }
  }

  onSearchChange(text: string): void {
    const filtered = this.options().filter(opt =>
      opt.label.toLowerCase().includes(text.toLowerCase())
    );
    this.filteredOptions.set(filtered);
  }

  onSelectionChange(value: any): void {
    this.emitValue(value);
  }

  onOptionSelected(option: SelectOption): void {
    this.searchText = option.label;
    this.emitValue(option.value);
  }

  private emitValue(value: any): void {
    const fieldName = this.step().selectConfig?.fieldName;
    if (fieldName) {
      this.valueChange.emit({
        field: fieldName,
        value: value,
      });
    }
  }

  onCreateNewClick(): void {
    const config = this.step().selectConfig;
    if (config?.createFlowType && config.fieldName) {
      this.createNew.emit({
        flowType: config.createFlowType,
        field: config.fieldName,
        initialData: config.createInitialData,
      });
    }
  }

  displayFn = (option: SelectOption): string => {
    return option?.label || '';
  };
}
