import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {EntityPickerConfig, ENTITY_PICKER_CONFIGS} from './entity-picker.config';

export interface PickedEntity {
  id: number;
  displayName: string;
}

@Component({
  selector: 'app-entity-picker-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="picker-overlay" (click)="close()">
      <div class="picker-dialog" (click)="$event.stopPropagation()">
        <div class="picker-header">
          <h3>Select {{ config?.label || referenceType }}</h3>
          <button class="close-btn" (click)="close()">x</button>
        </div>

        <div class="picker-search">
          <input type="text" [(ngModel)]="searchTerm" (input)="filterItems()" placeholder="Filter..." />
        </div>

        <div class="picker-body">
          <table *ngIf="filteredItems.length > 0">
            <thead>
              <tr>
                <th *ngFor="let col of config?.columns">{{ col.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredItems"
                  (click)="selectItem(item)"
                  [class.selected]="selectedId === item.id">
                <td *ngFor="let col of config?.columns">{{ getNestedValue(item, col.key) }}</td>
              </tr>
            </tbody>
          </table>
          <div class="empty" *ngIf="filteredItems.length === 0 && !loading">No items found</div>
          <div class="loading" *ngIf="loading">Loading...</div>
        </div>

        <div class="picker-footer">
          <span class="selected-label" *ngIf="selectedId">Selected: {{ selectedName }}</span>
          <div class="footer-actions">
            <button class="btn btn-cancel" (click)="close()">Cancel</button>
            <button class="btn btn-confirm" [disabled]="!selectedId" (click)="confirm()">Add Reference</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .picker-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
    }
    .picker-dialog {
      background: #1e1e2e; border: 1px solid #444; border-radius: 8px;
      width: 600px; max-height: 70vh; display: flex; flex-direction: column;
      color: #cdd6f4;
    }
    .picker-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid #333;
    }
    .picker-header h3 { margin: 0; font-size: 14px; }
    .close-btn {
      background: none; border: none; color: #888; cursor: pointer;
      font-size: 16px; padding: 2px 6px;
    }
    .close-btn:hover { color: #cdd6f4; }
    .picker-search { padding: 8px 16px; }
    .picker-search input {
      width: 100%; padding: 6px 10px; background: #313244;
      border: 1px solid #444; border-radius: 4px; color: #cdd6f4;
      font-size: 13px; box-sizing: border-box;
    }
    .picker-body {
      flex: 1; overflow-y: auto; padding: 0 16px;
      min-height: 200px; max-height: 400px;
    }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th {
      text-align: left; padding: 6px 8px; border-bottom: 1px solid #444;
      color: #888; font-weight: 500;
    }
    tbody tr { cursor: pointer; }
    tbody tr:hover { background: #313244; }
    tbody tr.selected { background: #3b82f6; color: #fff; }
    tbody td { padding: 6px 8px; border-bottom: 1px solid #2a2a3a; }
    .empty, .loading { padding: 24px; text-align: center; color: #666; }
    .picker-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px; border-top: 1px solid #333; gap: 12px;
    }
    .selected-label { font-size: 12px; color: #89b4fa; }
    .footer-actions { display: flex; gap: 8px; }
    .btn {
      padding: 6px 14px; border: none; border-radius: 4px;
      cursor: pointer; font-size: 12px;
    }
    .btn-cancel { background: #444; color: #cdd6f4; }
    .btn-confirm { background: #3b82f6; color: #fff; }
    .btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
  `]
})
export class EntityPickerDialogComponent implements OnInit {
  @Input() referenceType = '';
  @Output() picked = new EventEmitter<PickedEntity>();
  @Output() closed = new EventEmitter<void>();

  config: EntityPickerConfig | null = null;
  items: any[] = [];
  filteredItems: any[] = [];
  loading = false;
  searchTerm = '';
  selectedId: number | null = null;
  selectedName = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.config = ENTITY_PICKER_CONFIGS[this.referenceType] || null;
    if (this.config) this.loadItems();
  }

  loadItems(): void {
    if (!this.config) return;
    this.loading = true;
    const url = this.config.paginated
      ? `${this.config.endpoint}?page=1&pageSize=200`
      : this.config.endpoint;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        // Handle paginated (content array) or direct array
        const data = res.responseData;
        if (data?.content) {
          this.items = data.content;
        } else if (Array.isArray(data)) {
          this.items = data;
        } else {
          this.items = [];
        }
        this.filteredItems = [...this.items];
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.filteredItems = [];
        this.loading = false;
      }
    });
  }

  filterItems(): void {
    if (!this.searchTerm.trim()) {
      this.filteredItems = [...this.items];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredItems = this.items.filter(item =>
      this.config?.columns.some(col => {
        const val = this.getNestedValue(item, col.key);
        return val && String(val).toLowerCase().includes(term);
      })
    );
  }

  selectItem(item: any): void {
    this.selectedId = item.id;
    this.selectedName = this.getNestedValue(item, this.config?.nameKey || 'name') || `#${item.id}`;
  }

  confirm(): void {
    if (this.selectedId) {
      this.picked.emit({id: this.selectedId, displayName: this.selectedName});
    }
  }

  close(): void {
    this.closed.emit();
  }

  getNestedValue(obj: any, key: string): any {
    if (!obj || !key) return '';
    // Support dotted keys like 'equipment.name'
    const parts = key.split('.');
    let val = obj;
    for (const p of parts) {
      val = val?.[p];
      if (val == null) return '';
    }
    // If val is an object with a 'name' field, return that
    if (typeof val === 'object' && val !== null && val.name) return val.name;
    return val ?? '';
  }
}
