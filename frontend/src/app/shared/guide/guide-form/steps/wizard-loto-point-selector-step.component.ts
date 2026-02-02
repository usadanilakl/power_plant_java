import { Component, input, output, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { WizardStep, StepDataPayload, WizardFlowType } from '../wizard-stack.types';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import {
  LotoPointFinderDialogComponent,
  LotoPointFinderDialogData,
  LotoPointFinderDialogResult,
} from '../dialogs/loto-point-finder-dialog.component';
import { RfValueSelectComponent } from '../../../../features/values/refactored/components/rf-value-select/rf-value-select.component';
import { RfLotoPointApiService } from '../../../../features/loto-points/refactored/services/rf-loto-point-api.service';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';

type SearchStrategy = 'by-file' | 'by-loto-table' | 'by-loto-menu' | 'guided';

interface GuidedSearchFilters {
  unit?: string;
  eqTypeId?: number | null;
  locationId?: number | null;
  tagNumber?: string;
  description?: string;
}

@Component({
  selector: 'app-wizard-loto-point-selector-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatListModule,
    RfValueSelectComponent,
  ],
  template: `
    <div class="loto-selector-container">
      <!-- Selected Items Display -->
      @if (selectedItems().length > 0) {
        <div class="selected-section">
          <div class="selected-header">
            <mat-icon>check_circle</mat-icon>
            <span>Selected LOTO Points ({{ selectedItems().length }})</span>
            <button mat-icon-button (click)="clearAllSelections()" matTooltip="Clear all">
              <mat-icon>clear_all</mat-icon>
            </button>
          </div>
          <div class="selected-list">
            @for (item of selectedItems(); track item.id) {
              <div class="selected-item" [matTooltip]="item.tagNumber + ' - ' + (item.description || 'No description')">
                <div class="item-info">
                  <span class="item-tag">{{ item.tagNumber || 'No Tag' }}</span>
                  <span class="item-desc">{{ item.description || 'No description' }}</span>
                </div>
                <button mat-icon-button (click)="removeItem(item); $event.stopPropagation()" matTooltip="Remove">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }
          </div>
        </div>
        <mat-divider></mat-divider>
      }

      <!-- Search Strategy Selection -->
      <div class="strategy-section">
        <h3 class="section-title">How would you like to find LOTO points?</h3>
        <p class="section-subtitle">Choose a search method or use guided search with filters</p>

        <div class="strategy-cards">
          <!-- Guided Search Card (Expandable) -->
          <mat-card
            class="strategy-card guided-card"
            [class.expanded]="showGuidedSearch()"
            (click)="toggleGuidedSearch()"
          >
            <mat-card-content>
              <mat-icon class="strategy-icon" [class.active]="showGuidedSearch()">help_outline</mat-icon>
              <div class="strategy-text">
                <span class="strategy-label">Guided Search</span>
                <span class="strategy-desc">Not sure? Filter by what you know (unit, type, location, tag...)</span>
              </div>
              <mat-icon class="arrow-icon">{{ showGuidedSearch() ? 'expand_less' : 'expand_more' }}</mat-icon>
            </mat-card-content>

            <!-- Guided Search Filters (Expandable) -->
            @if (showGuidedSearch()) {
              <div class="guided-filters" (click)="$event.stopPropagation()">
                <p class="filter-hint">
                  <mat-icon>lightbulb</mat-icon>
                  Fill in what you know, then click "Search" to find matching LOTO points
                </p>

                <div class="filter-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Unit</mat-label>
                    <mat-select [(ngModel)]="guidedFilters.unit">
                      <mat-option value="">Any</mat-option>
                      <mat-option value="01">Unit 01</mat-option>
                      <mat-option value="02">Unit 02</mat-option>
                      <mat-option value="common">Common</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <div class="value-select-field">
                    <app-rf-value-select
                      [categoryAlias]="'eqType'"
                      [label]="'Equipment Type'"
                      [canManageValues]="false"
                      [(ngModel)]="guidedFilters.eqTypeId"
                    ></app-rf-value-select>
                  </div>

                  <div class="value-select-field">
                    <app-rf-value-select
                      [categoryAlias]="'location'"
                      [label]="'Location'"
                      [canManageValues]="false"
                      [(ngModel)]="guidedFilters.locationId"
                    ></app-rf-value-select>
                  </div>

                  <mat-form-field appearance="outline">
                    <mat-label>Tag Number (partial or full)</mat-label>
                    <input matInput [(ngModel)]="guidedFilters.tagNumber" placeholder="e.g., 01-FW-VLV">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width-field">
                    <mat-label>Description (partial or full)</mat-label>
                    <input matInput [(ngModel)]="guidedFilters.description" placeholder="e.g., isolation valve">
                  </mat-form-field>
                </div>

                <div class="filter-actions">
                  <button mat-stroked-button (click)="clearGuidedFilters()">
                    <mat-icon>clear</mat-icon>
                    Clear Filters
                  </button>
                  <button mat-flat-button color="primary" (click)="searchWithFilters()" [disabled]="isSearching()">
                    @if (isSearching()) {
                      <mat-spinner diameter="18"></mat-spinner>
                    } @else {
                      <mat-icon>search</mat-icon>
                    }
                    Search LOTO Points
                  </button>
                </div>

                <!-- Search Results -->
                @if (searchResults().length > 0 || hasSearched()) {
                  <div class="search-results">
                    <div class="results-header">
                      <span class="results-count">{{ searchResults().length }} result{{ searchResults().length !== 1 ? 's' : '' }} found</span>
                      @if (searchResults().length > 0) {
                        <button mat-stroked-button color="primary" (click)="addAllResults()">
                          <mat-icon>add_circle</mat-icon>
                          Add All
                        </button>
                      }
                    </div>
                    @if (searchResults().length === 0 && hasSearched()) {
                      <div class="no-results">
                        <mat-icon>search_off</mat-icon>
                        <span>No LOTO points match your criteria</span>
                      </div>
                    } @else {
                      <mat-selection-list class="results-list">
                        @for (item of searchResults(); track item.id) {
                          <mat-list-option
                            [value]="item"
                            [selected]="isItemSelected(item)"
                            (click)="toggleResultSelection(item)"
                            [matTooltip]="item.tagNumber + ' - ' + (item.description || '') + ' | ' + (item.eqType?.name || '') + ' • ' + (item.location?.name || '')"
                          >
                            <div class="result-item">
                              <span class="result-tag">{{ item.tagNumber || 'No Tag' }}</span>
                              <span class="result-desc">{{ item.description || 'No description' }}</span>
                              <span class="result-meta">
                                {{ item.eqType?.name || '' }}
                                @if (item.eqType?.name && item.location?.name) { • }
                                {{ item.location?.name || '' }}
                              </span>
                            </div>
                          </mat-list-option>
                        }
                      </mat-selection-list>
                    }
                  </div>
                }
              </div>
            }
          </mat-card>

          <mat-card
            class="strategy-card"
            (click)="openFinder('by-file')"
          >
            <mat-card-content>
              <mat-icon class="strategy-icon">insert_drive_file</mat-icon>
              <div class="strategy-text">
                <span class="strategy-label">By P&ID File</span>
                <span class="strategy-desc">Browse files, view P&ID drawings, and click on equipment</span>
              </div>
              <mat-icon class="arrow-icon">arrow_forward</mat-icon>
            </mat-card-content>
          </mat-card>

          <mat-card
            class="strategy-card"
            (click)="openFinder('by-loto-table')"
          >
            <mat-card-content>
              <mat-icon class="strategy-icon">table_chart</mat-icon>
              <div class="strategy-text">
                <span class="strategy-label">LOTO Point Table</span>
                <span class="strategy-desc">Search and filter in a full-featured table with column sorting</span>
              </div>
              <mat-icon class="arrow-icon">arrow_forward</mat-icon>
            </mat-card-content>
          </mat-card>

          <mat-card
            class="strategy-card"
            (click)="openFinder('by-loto-menu')"
          >
            <mat-card-content>
              <mat-icon class="strategy-icon">account_tree</mat-icon>
              <div class="strategy-text">
                <span class="strategy-label">LOTO Point Menu</span>
                <span class="strategy-desc">Browse by category tree (type, location, system)</span>
              </div>
              <mat-icon class="arrow-icon">arrow_forward</mat-icon>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Quick Search Hint -->
      <div class="quick-search-hint">
        <mat-icon>lightbulb</mat-icon>
        <span>
          <strong>Tip:</strong> Use "Guided Search" if you're unsure where to start.
          Use "By P&ID File" if you know which drawing the equipment is on.
          The table and menu views offer different ways to browse all LOTO points.
        </span>
      </div>

      <mat-divider></mat-divider>

      <!-- Helper Actions -->
      <div class="helper-actions">
        <span class="helper-label">Can't find what you need?</span>
        <div class="helper-buttons">
          <button mat-stroked-button color="primary" (click)="onCreateNewLotoPoint()">
            <mat-icon>add</mat-icon>
            Create New LOTO Point
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loto-selector-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .selected-section {
      background: var(--success-background, #e8f5e9);
      border-radius: 8px;
      padding: 12px;
    }

    .selected-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: var(--primary-text, #2e7d32);
      font-weight: 500;
    }

    .selected-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
    }

    .selected-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: var(--card-background, white);
      border-radius: 6px;
      border: 1px solid var(--border-color, #c8e6c9);
      min-width: 0;
      gap: 8px;
    }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
      overflow: hidden;
    }

    .item-tag {
      font-weight: 600;
      font-family: monospace;
      color: var(--accent-color, #1976d2);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-desc {
      font-size: 12px;
      color: var(--secondary-text, #666);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .section-title {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-text, #333);
    }

    .section-subtitle {
      margin: 0 0 16px 0;
      font-size: 13px;
      color: var(--secondary-text, #666);
    }

    .strategy-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .strategy-card {
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid transparent;
      background: var(--card-background, white);
    }

    .strategy-card:hover {
      border-color: var(--accent-color, #1976d2);
      transform: translateX(4px);
    }

    .strategy-card.guided-card {
      border-color: var(--border-color, #e0e0e0);
    }

    .strategy-card.guided-card.expanded {
      border-color: #ff9800;
      transform: none;
    }

    .strategy-card.guided-card:hover {
      border-color: #ff9800;
    }

    .strategy-card mat-card-content {
      display: flex;
      align-items: center;
      padding: 16px;
      gap: 16px;
    }

    .strategy-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--accent-color, #1976d2);
      flex-shrink: 0;
    }

    .strategy-icon.active {
      color: #ff9800;
    }

    .guided-card .strategy-icon {
      color: #ff9800;
    }

    .strategy-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .strategy-label {
      font-weight: 500;
      font-size: 15px;
      color: var(--primary-text, #333);
    }

    .strategy-desc {
      font-size: 13px;
      color: var(--secondary-text, #666);
    }

    .arrow-icon {
      color: var(--accent-color, #1976d2);
      opacity: 0.5;
      flex-shrink: 0;
    }

    .strategy-card:hover .arrow-icon {
      opacity: 1;
    }

    /* Guided Filters */
    .guided-filters {
      padding: 16px;
      border-top: 1px solid var(--border-color, #e0e0e0);
      background: var(--secondary-background, #fffbf0);
    }

    .filter-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      font-size: 13px;
      color: #f57c00;
    }

    .filter-hint mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px 12px;
    }

    .filter-grid .tag-field {
      grid-column: span 2;
    }

    .filter-grid .full-width-field {
      grid-column: span 2;
    }

    .filter-grid mat-form-field {
      width: 100%;
    }

    .filter-grid .value-select-field {
      width: 100%;
      min-height: 56px;
      overflow: visible;
    }

    .filter-grid .value-select-field app-rf-value-select {
      display: block;
      width: 100%;
    }

    :host ::ng-deep .filter-grid .value-select-field .mat-mdc-form-field {
      width: 100%;
    }

    :host ::ng-deep .filter-grid .value-select-field .mdc-floating-label {
      overflow: visible;
      text-overflow: clip;
    }

    .filter-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
    }

    .filter-actions mat-spinner {
      margin-right: 8px;
    }

    /* Search Results */
    .search-results {
      margin-top: 16px;
      border-top: 1px solid var(--border-color, #e0e0e0);
      padding-top: 16px;
    }

    .results-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .results-count {
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text, #333);
    }

    .no-results {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 24px;
      color: var(--secondary-text, #999);
      font-size: 14px;
    }

    .results-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid var(--border-color, #e0e0e0);
      border-radius: 8px;
    }

    :host ::ng-deep .results-list .mat-mdc-list-option {
      height: auto !important;
      min-height: 56px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--border-color, #e0e0e0);
    }

    :host ::ng-deep .results-list .mat-mdc-list-option:last-child {
      border-bottom: none;
    }

    :host ::ng-deep .results-list .mdc-list-item__primary-text {
      white-space: normal;
      overflow: visible;
      width: 100%;
    }

    .result-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      width: 100%;
      padding: 4px 0;
    }

    .result-tag {
      font-weight: 600;
      font-family: monospace;
      color: var(--accent-color, #1976d2);
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-desc {
      font-size: 13px;
      color: var(--primary-text, #333);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-meta {
      font-size: 11px;
      color: var(--secondary-text, #888);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .quick-search-hint {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      background: var(--warning-background, #fff8e1);
      border-radius: 8px;
      border-left: 4px solid #ffc107;
    }

    .quick-search-hint mat-icon {
      color: #ffc107;
      flex-shrink: 0;
    }

    .quick-search-hint span {
      font-size: 13px;
      color: var(--primary-text, #5d4037);
      line-height: 1.5;
    }

    .helper-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
    }

    .helper-label {
      font-size: 13px;
      color: var(--secondary-text, #666);
    }

    .helper-buttons {
      display: flex;
      gap: 12px;
    }

    mat-divider {
      margin: 8px 0;
    }
  `],
})
export class WizardLotoPointSelectorStepComponent {
  private dialog = inject(MatDialog);
  private lotoPointApiService = inject(RfLotoPointApiService);

  step = input.required<WizardStep>();
  currentValue = input<LotoPointDto[]>([]);

  valueChange = output<StepDataPayload>();
  createNew = output<{ flowType: WizardFlowType; field: string; initialData?: any }>();

  // State
  selectedItems = signal<LotoPointDto[]>([]);
  showGuidedSearch = signal<boolean>(false);

  // Guided search state
  searchResults = signal<LotoPointDto[]>([]);
  isSearching = signal<boolean>(false);
  hasSearched = signal<boolean>(false);

  // Guided search filters
  guidedFilters: GuidedSearchFilters = {
    unit: '',
    eqTypeId: null,
    locationId: null,
    tagNumber: '',
    description: '',
  };

  constructor() {
    // React to currentValue changes (including initial value after input binding)
    effect(() => {
      const current = this.currentValue();
      if (current && Array.isArray(current)) {
        // Compare arrays to avoid redundant updates
        const currentSelected = this.selectedItems();
        const isSame = current.length === currentSelected.length &&
          current.every((item, idx) => item.id === currentSelected[idx]?.id);
        if (!isSame) {
          this.selectedItems.set([...current]);
        }
      }
    });
  }

  toggleGuidedSearch(): void {
    this.showGuidedSearch.update(v => !v);
  }

  clearGuidedFilters(): void {
    this.guidedFilters = {
      unit: '',
      eqTypeId: null,
      locationId: null,
      tagNumber: '',
      description: '',
    };
  }

  searchWithFilters(): void {
    // Build search criteria from guided filters
    const filters: { [key: string]: string } = {};

    if (this.guidedFilters.unit) {
      filters['tagNumber'] = this.guidedFilters.unit; // Unit is part of tag number
    }
    if (this.guidedFilters.eqTypeId) {
      filters['eqType.id'] = this.guidedFilters.eqTypeId.toString();
    }
    if (this.guidedFilters.locationId) {
      filters['location.id'] = this.guidedFilters.locationId.toString();
    }
    if (this.guidedFilters.tagNumber) {
      filters['tagNumber'] = this.guidedFilters.tagNumber;
    }
    if (this.guidedFilters.description) {
      filters['description'] = this.guidedFilters.description;
    }

    const searchCriteria: SearchCriteria = {
      type: 'column',
      filters: filters,
      page: 1,
      pageSize: 50,
    };

    this.isSearching.set(true);
    this.hasSearched.set(false);

    this.lotoPointApiService.searchLotoPoints(searchCriteria, 50).subscribe({
      next: (response) => {
        const results = response.responseData?.content?.map((item: any) => LotoPointDto.fromJson(item)) || [];
        this.searchResults.set(results);
        this.isSearching.set(false);
        this.hasSearched.set(true);
      },
      error: (error) => {
        console.error('Error searching LOTO points:', error);
        this.searchResults.set([]);
        this.isSearching.set(false);
        this.hasSearched.set(true);
      }
    });
  }

  // Guided search result helpers
  isItemSelected(item: LotoPointDto): boolean {
    return this.selectedItems().some(s => s.id === item.id);
  }

  toggleResultSelection(item: LotoPointDto): void {
    if (this.isItemSelected(item)) {
      this.removeItem(item);
    } else {
      this.addToSelection(item);
    }
  }

  addToSelection(item: LotoPointDto): void {
    if (!this.isItemSelected(item)) {
      this.selectedItems.set([...this.selectedItems(), item]);
      this.emitValue();
    }
  }

  addAllResults(): void {
    const results = this.searchResults();
    const newItems = results.filter(r => !this.isItemSelected(r));
    if (newItems.length > 0) {
      this.selectedItems.set([...this.selectedItems(), ...newItems]);
      this.emitValue();
    }
  }

  openFinder(strategy: SearchStrategy): void {
    const dialogData: LotoPointFinderDialogData = {
      mode: 'multi',
      preselectedIds: this.selectedItems().map(i => i.id),
      initialTab: strategy === 'by-file' ? 'file' : 'loto-point',
    };

    const dialogRef = this.dialog.open(LotoPointFinderDialogComponent, {
      data: dialogData,
      panelClass: 'loto-finder-dialog-panel',
      disableClose: false,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result: LotoPointFinderDialogResult) => {
      if (result && !result.cancelled && result.selectedLotoPoints?.length > 0) {
        this.mergeSelections(result.selectedLotoPoints);
      }
    });
  }

  private mergeSelections(newPoints: LotoPointDto[]): void {
    const current = this.selectedItems();
    const newItems = newPoints.filter(
      newItem => !current.some(existing => existing.id === newItem.id)
    );
    this.selectedItems.set([...current, ...newItems]);
    this.emitValue();
  }

  removeItem(item: LotoPointDto): void {
    this.selectedItems.set(this.selectedItems().filter(s => s.id !== item.id));
    this.emitValue();
  }

  clearAllSelections(): void {
    this.selectedItems.set([]);
    this.emitValue();
  }

  private emitValue(): void {
    const fieldName = this.step().tableConfig?.fieldName || 'lotoPoints';
    this.valueChange.emit({
      field: fieldName,
      value: this.selectedItems(),
    });
  }

  onCreateNewLotoPoint(): void {
    const config = this.step().tableConfig;
    this.createNew.emit({
      flowType: 'add-loto-point',
      field: config?.fieldName || 'lotoPoints',
    });
  }
}
