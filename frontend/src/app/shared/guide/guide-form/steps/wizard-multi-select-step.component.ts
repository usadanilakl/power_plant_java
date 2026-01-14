import { Component, input, output, signal, effect, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WizardStep, StepDataPayload, WizardFlowType } from '../wizard-stack.types';
import { RfLotoPointApiService } from '../../../../features/loto-points/refactored/services/rf-loto-point-api.service';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';

interface SelectableItem {
  id: number;
  name?: string | null;
  tagNumber?: string | null;
  description?: string | null;
  [key: string]: any;
}

@Component({
  selector: 'app-wizard-multi-select-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="multi-select-container">
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

      <!-- Selected items chips -->
      @if (selectedItems().length > 0) {
        <div class="selected-chips">
          <span class="selected-label">Selected ({{ selectedItems().length }}):</span>
          <mat-chip-set>
            @for (item of selectedItems(); track item.id) {
              <mat-chip (removed)="removeItem(item)">
                {{ getItemLabel(item) }}
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip>
            }
          </mat-chip-set>
        </div>
      }

      <!-- Available items list -->
      <div class="items-list">
        @if (isLoading()) {
          <div class="loading">Loading...</div>
        } @else if (filteredItems().length === 0) {
          <div class="empty-state">
            <mat-icon>search_off</mat-icon>
            <p>No items found</p>
          </div>
        } @else {
          @for (item of filteredItems(); track item.id) {
            <div
              class="item-row"
              [class.selected]="isSelected(item)"
              (click)="toggleItem(item)"
            >
              <div class="item-content">
                <span class="item-primary">{{ getItemLabel(item) }}</span>
                @if (item.description) {
                  <span class="item-secondary">{{ item.description }}</span>
                }
              </div>
              <mat-icon class="check-icon" [class.visible]="isSelected(item)">
                check_circle
              </mat-icon>
            </div>
          }
        }
      </div>

      <!-- Create new button -->
      @if (step().tableConfig?.allowCreate) {
        <div class="create-new-container">
          <button mat-stroked-button color="primary" (click)="onCreateNewClick()">
            <mat-icon>add</mat-icon>
            Create New
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .multi-select-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .selected-chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .selected-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .items-list {
      max-height: 250px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s;
    }

    .item-row:last-child {
      border-bottom: none;
    }

    .item-row:hover {
      background: #f5f5f5;
    }

    .item-row.selected {
      background: #e3f2fd;
    }

    .item-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-primary {
      font-weight: 500;
    }

    .item-secondary {
      font-size: 12px;
      color: #666;
    }

    .check-icon {
      color: #1976d2;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .check-icon.visible {
      opacity: 1;
    }

    .loading, .empty-state {
      padding: 40px;
      text-align: center;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
    }

    .create-new-container {
      display: flex;
      justify-content: center;
      padding-top: 8px;
    }
  `],
})
export class WizardMultiSelectStepComponent {
  private lotoPointApi = inject(RfLotoPointApiService);
  private destroyRef = inject(DestroyRef);

  step = input.required<WizardStep>();
  currentValue = input<SelectableItem[]>([]);

  valueChange = output<StepDataPayload>();
  createNew = output<{ flowType: WizardFlowType; field: string; initialData?: any }>();

  searchText = '';
  availableItems = signal<SelectableItem[]>([]);
  filteredItems = signal<SelectableItem[]>([]);
  selectedItems = signal<SelectableItem[]>([]);
  isLoading = signal(false);
  private searchTimeout: any = null;

  private hasLoadedInitialData = false;

  constructor() {
    // Effect for currentValue changes
    effect(() => {
      const current = this.currentValue();
      if (current && Array.isArray(current)) {
        this.selectedItems.set([...current]);
      }
    });

    // Effect to load initial data when step input becomes available
    effect(() => {
      const stepValue = this.step();
      if (stepValue && !this.hasLoadedInitialData) {
        this.hasLoadedInitialData = true;
        this.loadItems();
      }
    });
  }

  loadItems(): void {
    const entityType = this.step().tableConfig?.entityType;

    if (entityType === 'loto-point') {
      this.loadLotoPoints();
    } else {
      // Fallback for other entity types
      this.isLoading.set(false);
      this.availableItems.set([]);
      this.filteredItems.set([]);
    }
  }

  private loadLotoPoints(searchText?: string): void {
    this.isLoading.set(true);

    const criteria: SearchCriteria = {
      page: 1,
      filters: searchText ? { tagNumber: searchText } : {},
    };

    this.lotoPointApi.searchLotoPoints(criteria, 50)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const items = response.responseData?.content || [];
          this.availableItems.set(items);
          this.filteredItems.set(items);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load LOTO points:', err);
          this.isLoading.set(false);
          this.availableItems.set([]);
          this.filteredItems.set([]);
        }
      });
  }

  onSearchChange(text: string): void {
    // Debounce search API calls
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    const entityType = this.step().tableConfig?.entityType;

    if (entityType === 'loto-point') {
      // For LOTO points, search via API with debounce
      this.searchTimeout = setTimeout(() => {
        this.loadLotoPoints(text);
      }, 300);
    } else {
      // For other entities, filter locally
      const items = this.availableItems();
      if (!text) {
        this.filteredItems.set(items);
        return;
      }

      const lower = text.toLowerCase();
      const filtered = items.filter(item =>
        this.getItemLabel(item).toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower)
      );
      this.filteredItems.set(filtered);
    }
  }

  getItemLabel(item: SelectableItem): string {
    return item.tagNumber || item.name || `Item ${item.id}`;
  }

  isSelected(item: SelectableItem): boolean {
    return this.selectedItems().some(s => s.id === item.id);
  }

  toggleItem(item: SelectableItem): void {
    const current = this.selectedItems();
    const index = current.findIndex(s => s.id === item.id);

    if (index >= 0) {
      // Remove
      this.selectedItems.set(current.filter(s => s.id !== item.id));
    } else {
      // Add (check max selection)
      const maxSelection = this.step().tableConfig?.maxSelection;
      if (maxSelection && current.length >= maxSelection) {
        return; // Max reached
      }
      this.selectedItems.set([...current, item]);
    }

    this.emitValue();
  }

  removeItem(item: SelectableItem): void {
    this.selectedItems.set(this.selectedItems().filter(s => s.id !== item.id));
    this.emitValue();
  }

  private emitValue(): void {
    const fieldName = this.step().tableConfig?.fieldName;
    if (fieldName) {
      this.valueChange.emit({
        field: fieldName,
        value: this.selectedItems(),
      });
    }
  }

  onCreateNewClick(): void {
    const config = this.step().tableConfig;
    if (config?.createFlowType && config.fieldName) {
      this.createNew.emit({
        flowType: config.createFlowType,
        field: config.fieldName,
      });
    }
  }
}
