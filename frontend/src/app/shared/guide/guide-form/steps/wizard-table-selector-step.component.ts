import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WizardStep, StepDataPayload, WizardFlowType } from '../wizard-stack.types';

interface TableItem {
  id: number;
  [key: string]: any;
}

@Component({
  selector: 'app-wizard-table-selector-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="table-selector-container">
      <!-- Search -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-icon matPrefix>search</mat-icon>
        <input
          matInput
          [(ngModel)]="searchText"
          placeholder="Search..."
          (ngModelChange)="onSearchChange($event)"
        />
      </mat-form-field>

      <!-- Table -->
      <div class="table-container">
        <table class="selector-table">
          <thead>
            <tr>
              @for (col of columns(); track col) {
                <th>{{ formatColumnHeader(col) }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @if (isLoading()) {
              <tr>
                <td [attr.colspan]="columns().length" class="loading-cell">
                  Loading...
                </td>
              </tr>
            } @else if (filteredItems().length === 0) {
              <tr>
                <td [attr.colspan]="columns().length" class="empty-cell">
                  No items found
                </td>
              </tr>
            } @else {
              @for (item of filteredItems(); track item.id) {
                <tr
                  [class.selected]="isSelected(item)"
                  (click)="toggleSelection(item)"
                >
                  @for (col of columns(); track col) {
                    <td>{{ getCellValue(item, col) }}</td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Selection info -->
      @if (selectedItems().length > 0) {
        <div class="selection-info">
          <span>{{ selectedItems().length }} selected</span>
          <button mat-button (click)="clearSelection()">Clear</button>
        </div>
      }

      <!-- Create new -->
      @if (step().tableConfig?.allowCreate) {
        <div class="create-section">
          <button mat-stroked-button color="primary" (click)="onCreateNew()">
            <mat-icon>add</mat-icon>
            Create New
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .table-selector-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .table-container {
      max-height: 300px;
      overflow: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .selector-table {
      width: 100%;
      border-collapse: collapse;
    }

    .selector-table th {
      position: sticky;
      top: 0;
      background: #f5f5f5;
      padding: 12px;
      text-align: left;
      font-weight: 500;
      border-bottom: 1px solid #e0e0e0;
    }

    .selector-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f0f0f0;
    }

    .selector-table tbody tr {
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .selector-table tbody tr:hover {
      background: #f5f5f5;
    }

    .selector-table tbody tr.selected {
      background: #e3f2fd;
    }

    .loading-cell, .empty-cell {
      text-align: center;
      padding: 40px !important;
      color: #666;
    }

    .selection-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #e3f2fd;
      border-radius: 8px;
      color: #1976d2;
    }

    .create-section {
      display: flex;
      justify-content: center;
    }
  `],
})
export class WizardTableSelectorStepComponent {
  step = input.required<WizardStep>();
  currentValue = input<TableItem | TableItem[] | null>(null);

  valueChange = output<StepDataPayload>();
  createNew = output<{ flowType: WizardFlowType; field: string; initialData?: any }>();

  searchText = '';
  items = signal<TableItem[]>([]);
  filteredItems = signal<TableItem[]>([]);
  selectedItems = signal<TableItem[]>([]);
  isLoading = signal(false);

  columns = signal<string[]>(['tagNumber', 'description']);

  constructor() {
    effect(() => {
      const cols = this.step().tableConfig?.columns;
      if (cols && cols.length > 0) {
        this.columns.set(cols);
      }
    });

    effect(() => {
      const current = this.currentValue();
      if (current) {
        if (Array.isArray(current)) {
          this.selectedItems.set([...current]);
        } else {
          this.selectedItems.set([current]);
        }
      }
    });

    this.loadItems();
  }

  loadItems(): void {
    this.isLoading.set(true);
    // TODO: Use actual API based on step().tableConfig?.entityType
    setTimeout(() => {
      const mockItems: TableItem[] = [
        { id: 1, tagNumber: '01-MV-001', description: 'Main Isolation Valve A', unit: '01', eqType: 'MV' },
        { id: 2, tagNumber: '01-MV-002', description: 'Main Isolation Valve B', unit: '01', eqType: 'MV' },
        { id: 3, tagNumber: '01-CB-001', description: 'Circuit Breaker Main', unit: '01', eqType: 'CB' },
        { id: 4, tagNumber: '02-MV-001', description: 'Unit 2 Main Valve', unit: '02', eqType: 'MV' },
      ];
      this.items.set(mockItems);
      this.filteredItems.set(mockItems);
      this.isLoading.set(false);
    }, 300);
  }

  onSearchChange(text: string): void {
    if (!text) {
      this.filteredItems.set(this.items());
      return;
    }

    const lower = text.toLowerCase();
    const filtered = this.items().filter(item => {
      return this.columns().some(col => {
        const val = this.getCellValue(item, col);
        return val?.toLowerCase().includes(lower);
      });
    });
    this.filteredItems.set(filtered);
  }

  getCellValue(item: TableItem, column: string): string {
    const value = item[column];
    if (value === null || value === undefined) return '';
    if (typeof value === 'object' && value.name) return value.name;
    return String(value);
  }

  formatColumnHeader(col: string): string {
    return col
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  isSelected(item: TableItem): boolean {
    return this.selectedItems().some(s => s.id === item.id);
  }

  toggleSelection(item: TableItem): void {
    const maxSelection = this.step().tableConfig?.maxSelection ?? Infinity;
    const current = this.selectedItems();

    if (this.isSelected(item)) {
      this.selectedItems.set(current.filter(s => s.id !== item.id));
    } else {
      if (maxSelection === 1) {
        this.selectedItems.set([item]);
      } else if (current.length < maxSelection) {
        this.selectedItems.set([...current, item]);
      }
    }

    this.emitValue();
  }

  clearSelection(): void {
    this.selectedItems.set([]);
    this.emitValue();
  }

  private emitValue(): void {
    const fieldName = this.step().tableConfig?.fieldName;
    const maxSelection = this.step().tableConfig?.maxSelection;

    if (fieldName) {
      const value = maxSelection === 1
        ? this.selectedItems()[0] ?? null
        : this.selectedItems();

      this.valueChange.emit({
        field: fieldName,
        value,
      });
    }
  }

  onCreateNew(): void {
    const config = this.step().tableConfig;
    if (config?.createFlowType && config.fieldName) {
      this.createNew.emit({
        flowType: config.createFlowType,
        field: config.fieldName,
      });
    }
  }
}
