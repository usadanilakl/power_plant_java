import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ServerApiService } from '../../services/server-api.service';
import { ServerStatusService } from '../../services/server-status.service';
import { SubmissionOrchestratorService } from '../../services/submission-orchestrator.service';
import { UserSetupService } from '../../services/user-setup.service';
import { GlobalMessageService } from '../../services/global-message.service';
import { AuthService } from '../../auth/auth.service';
import { ReactiveFormComponent } from '../../shared/forms/reactive-form/reactive-form.component';
import { FormField } from '../../models/inputs/form-field.model';
import { fieldListFormFields } from '../../models/field-list/field-list-item.model';
import { Option } from '../../models/inputs/option.model';
import { SupabaseDataService } from '../../services/supabase-data.service';

type ViewMode = 'select' | 'new' | 'edit' | 'open-items';

interface OpenItem {
  id: number;
  title: string;
  listTypeName: string;
  statusName: string;
  dateObserved: string;
  timeObserved: string;
  locationName: string;
  specificLocation: string;
  equipmentTag: string;
  notes: string;
  submitterName: string;
  createdBy: string;
  attachmentCount: number;
}

@Component({
  selector: 'app-field-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormComponent],
  template: `
    <!-- Mode selector -->
    @if (mode() === 'select') {
      <div class="action-selector">
        <h2 class="action-title">Field Lists</h2>
        <p class="action-subtitle">Track insulation, leaks, winterization, and more</p>
        <div class="action-cards">
          <button class="action-card card-insulation" (click)="selectNewWithType('Insulation Removal')">
            <svg class="card-icon" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="#e65100" stroke-width="2"/><path d="M3 10h18M7 6v12M12 6v12M17 6v12" stroke="#e65100" stroke-width="1.5" fill="none"/></svg>
            <span class="action-card-label">Insulation Removal</span>
            <span class="action-card-desc">Report insulation removal</span>
          </button>
          <button class="action-card card-leaks" (click)="selectNewWithType('Leaks')">
            <svg class="card-icon" viewBox="0 0 24 24"><path d="M12 2C12 2 5 11 5 15a7 7 0 0014 0c0-4-7-13-7-13z" fill="#ffcdd2" stroke="#c62828" stroke-width="2"/></svg>
            <span class="action-card-label">Leaks</span>
            <span class="action-card-desc">Report a leak</span>
          </button>
          <button class="action-card card-winterization" (click)="selectNewWithType('Winterization')">
            <svg class="card-icon" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="22" stroke="#1565c0" stroke-width="2"/><line x1="2" y1="12" x2="22" y2="12" stroke="#1565c0" stroke-width="2"/><line x1="5" y1="5" x2="19" y2="19" stroke="#1565c0" stroke-width="1.5"/><line x1="19" y1="5" x2="5" y2="19" stroke="#1565c0" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="#bbdefb" stroke="#1565c0" stroke-width="1"/></svg>
            <span class="action-card-label">Winterization</span>
            <span class="action-card-desc">Report winterization item</span>
          </button>
          <button class="action-card card-open" (click)="openItemsList()">
            <svg class="card-icon" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 3v3h6V3M9 11h6M9 15h4" stroke="currentColor" stroke-width="2" fill="none"/></svg>
            <span class="action-card-label">View Open Items</span>
            <span class="action-card-desc">
              {{ serverStatus.isOnline() ? 'View all open items from server' : 'View locally saved items' }}
            </span>
          </button>
        </div>
      </div>
    }

    <!-- New submission form -->
    @if (mode() === 'new') {
      <div class="form-wrapper">
        <div class="sticky-header">
          <button class="back-button" (click)="backToSelect()">&#x2190; Back</button>
          <span class="header-title">New {{ presetListType() }} Item</span>
        </div>
        @if (fields().length > 0) {
          <app-reactive-form
            [fields]="fields()"
            [entity]="draftEntity()"
            [layout]="'column'"
            [submitButtonText]="'Submit'"
            (formValueChange)="onDraftChange($event)"
            (formSubmit)="onSubmit($event)">
          </app-reactive-form>
        }
      </div>

      <!-- Area active items: minimized button or expanded popup -->
      @if (areaName()) {
        @if (!areaPopupExpanded()) {
          <button class="area-fab" (click)="areaPopupExpanded.set(true)">
            @if (loadingAreaItems()) {
              &#x231B;
            } @else {
              &#x1F4CB; {{ areaItems().length }} item(s) in {{ areaName() }}
            }
          </button>
        } @else {
          <div class="area-popup">
            <div class="area-popup-header">
              <span class="area-popup-title">Active {{ presetListType() }} items in {{ areaName() }}</span>
              <button class="area-popup-close" (click)="areaPopupExpanded.set(false)">&#x2212;</button>
            </div>
            @if (loadingAreaItems()) {
              <div class="area-popup-loading">Loading...</div>
            } @else if (areaItems().length === 0) {
              <div class="area-popup-empty">No active items in this area</div>
            } @else {
              <div class="area-popup-list">
                @for (item of areaItems(); track item.id) {
                  <div class="area-popup-item" (click)="detailItem.set(item)">
                    <div class="area-popup-item-title">{{ item.title }}</div>
                    <div class="area-popup-item-meta">
                      <span class="status-badge" [attr.data-status]="item.statusName">{{ item.statusName }}</span>
                      <span>{{ item.dateObserved }}</span>
                      @if (item.equipmentTag) { <span>{{ item.equipmentTag }}</span> }
                    </div>
                  </div>
                }
              </div>
              <div class="area-popup-count">{{ areaItems().length }} active item(s)</div>
            }
          </div>
        }
      }
    }

    <!-- Edit form -->
    @if (mode() === 'edit') {
      <div class="form-wrapper">
        <div class="sticky-header">
          <button class="back-button" (click)="openItemsList()">&#x2190; Back to List</button>
          <span class="header-title">Edit: {{ editingItem()?.title }}</span>
        </div>
        @if (editFields().length > 0) {
          <app-reactive-form
            [fields]="editFields()"
            [entity]="editEntity()"
            [layout]="'column'"
            [submitButtonText]="editingSubmitted() ? 'Update' : 'Submit'"
            (formSubmit)="onUpdate($event)">
          </app-reactive-form>
        }
      </div>
    }

    <!-- Open items list -->
    @if (mode() === 'open-items') {
      <div class="form-wrapper" style="max-width: 900px;">
        <div class="sticky-header">
          <button class="back-button" (click)="backToSelect()">&#x2190; Back</button>
          <span class="header-title">Open Items</span>
          <div class="filter-tabs">
            <button [class.active]="openItemsFilter() === null" (click)="filterOpenItems(null)">All</button>
            <button [class.active]="openItemsFilter() === 'Insulation Removal'" (click)="filterOpenItems('Insulation Removal')">Insulation</button>
            <button [class.active]="openItemsFilter() === 'Leaks'" (click)="filterOpenItems('Leaks')">Leaks</button>
            <button [class.active]="openItemsFilter() === 'Winterization'" (click)="filterOpenItems('Winterization')">Winter.</button>
          </div>
        </div>

        @if (loadingOpenItems()) {
          <div class="loading-row"><div class="spinner"></div> Loading items...</div>
        } @else if (filteredOpenItems().length === 0) {
          <div class="empty-history">No open items found.</div>
        } @else {
          <div class="items-table">
            <div class="table-header">
              <span class="col-type">Type</span>
              <span class="col-status">Status</span>
              <span class="col-title">Title</span>
              <span class="col-date">Date</span>
              <span class="col-location">Location</span>
              <span class="col-equip">Equipment</span>
            </div>
            @for (item of filteredOpenItems(); track item.id || $index) {
              <button class="table-row" (click)="viewOpenItem(item)">
                <span class="col-type">
                  <span class="type-badge" [attr.data-type]="item.listTypeName">{{ item.listTypeName }}</span>
                </span>
                <span class="col-status">
                  <span class="status-badge" [attr.data-status]="item.statusName">{{ item.statusName }}</span>
                </span>
                <span class="col-title">{{ item.title }}</span>
                <span class="col-date">{{ item.dateObserved }}</span>
                <span class="col-location">{{ item.locationName }}{{ item.specificLocation ? ' — ' + item.specificLocation : '' }}</span>
                <span class="col-equip">{{ item.equipmentTag || '—' }}</span>
              </button>
            }
          </div>
          <div class="items-count">{{ filteredOpenItems().length }} item(s)</div>
        }

        <!-- Local-only items section -->
        @if (localOnlyItems().length > 0) {
          <div class="local-section">
            <h3 class="local-header">Local (not yet submitted)</h3>
            @for (item of localOnlyItems(); track item.localUuid) {
              <button class="history-item" (click)="editLocalItem(item)">
                <div class="history-item-header">
                  <span class="history-item-type">{{ item.listTypeName }}</span>
                  <span class="history-item-status not-submitted">Local only</span>
                </div>
                <div class="history-item-title">{{ item.title }}</div>
              </button>
            }
          </div>
        }
      </div>
    }

    <!-- Item detail popup -->
    @if (detailItem()) {
      <div class="overlay" (click)="detailItem.set(null)">
        <div class="detail-card" (click)="$event.stopPropagation()">
          <div class="detail-header">
            <span class="type-badge" [attr.data-type]="detailItem()!.listTypeName">{{ detailItem()!.listTypeName }}</span>
            <span class="status-badge" [attr.data-status]="detailItem()!.statusName">{{ detailItem()!.statusName }}</span>
            <button class="detail-close" (click)="detailItem.set(null)">&times;</button>
          </div>
          <h3 class="detail-title">{{ detailItem()!.title }}</h3>
          <div class="detail-fields">
            <div class="detail-field"><strong>Date:</strong> {{ detailItem()!.dateObserved }} {{ detailItem()!.timeObserved }}</div>
            <div class="detail-field"><strong>Location:</strong> {{ detailItem()!.locationName }} {{ detailItem()!.specificLocation ? '— ' + detailItem()!.specificLocation : '' }}</div>
            <div class="detail-field"><strong>Equipment:</strong> {{ detailItem()!.equipmentTag || '—' }}</div>
            <div class="detail-field"><strong>Submitter:</strong> {{ detailItem()!.submitterName || detailItem()!.createdBy || '—' }}</div>
            @if (detailItem()!.notes) {
              <div class="detail-notes">{{ detailItem()!.notes }}</div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .action-selector { display: flex; flex-direction: column; align-items: center; padding: 2rem 1rem; }
    .action-title { font-size: 1.6rem; font-weight: 700; margin: 0 0 0.25rem; }
    .action-subtitle { font-size: 1rem; color: var(--secondary-text); margin: 0 0 2rem; }
    .action-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; width: 100%; max-width: 600px; }
    .action-card { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; padding: 1.2rem 0.75rem;
      background: var(--card-background); border: 2px solid var(--border-color);
      border-radius: 12px; cursor: pointer; min-height: 100px; font-family: inherit; color: var(--primary-text); }
    .action-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .card-insulation { border-color: #ff9800; } .card-leaks { border-color: #f44336; }
    .card-winterization { border-color: #2196f3; } .card-open { border-color: var(--accent-color); }
    .card-icon { width: 36px; height: 36px; }
    .action-card-label { font-size: 1rem; font-weight: 600; text-align: center; }
    .action-card-desc { font-size: 0.8rem; color: var(--secondary-text); text-align: center; }
    .form-wrapper { max-width: 600px; margin: 0 auto; padding: 0 16px 16px; box-sizing: border-box; width: 100%; }
    .form-wrapper ::ng-deep form { box-sizing: border-box; max-width: 100%; }
    .form-wrapper ::ng-deep input, .form-wrapper ::ng-deep select,
    .form-wrapper ::ng-deep textarea { box-sizing: border-box; max-width: 100%; width: 100%; }
    .form-wrapper ::ng-deep fieldset { border: none; margin: 0; padding: 0; min-width: 0; }
    .sticky-header { display: flex; align-items: center; gap: 12px; padding: 12px 0; position: sticky; top: 0;
      background: var(--primary-background); z-index: 10; flex-wrap: wrap; }
    .back-button { background: none; border: none; color: var(--accent-color); cursor: pointer; font-size: 14px; font-family: inherit; }
    .header-title { font-size: 16px; font-weight: 600; }
    .filter-tabs { display: flex; gap: 4px; margin-left: auto; }
    .filter-tabs button { padding: 4px 10px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); cursor: pointer; font-size: 12px; font-family: inherit; color: var(--primary-text); }
    .filter-tabs button.active { background: var(--accent-color); color: white; border-color: var(--accent-color); }
    .loading-row { display: flex; align-items: center; gap: 12px; padding: 24px; justify-content: center; color: var(--secondary-text); }
    .items-table { display: flex; flex-direction: column; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
    .table-header, .table-row { display: grid; grid-template-columns: 110px 80px 1fr 90px 1fr 90px; gap: 8px; padding: 8px 12px; }
    .table-header { background: var(--secondary-background); font-size: 11px; font-weight: 600; text-transform: uppercase;
      color: var(--secondary-text); border-bottom: 1px solid var(--border-color); }
    .table-row { border: none; border-bottom: 1px solid var(--border-color); background: var(--card-background);
      cursor: pointer; font-family: inherit; font-size: 13px; text-align: left; padding: 10px 12px;
      color: var(--primary-text); }
    .table-row:hover { background: var(--secondary-background); }
    .table-row:last-child { border-bottom: none; }
    .col-title, .col-location { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .type-badge { font-size: 10px; font-weight: 600; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; white-space: nowrap; }
    .type-badge[data-type="Insulation Removal"] { background: rgba(255, 152, 0, 0.15); color: #ff9800; }
    .type-badge[data-type="Leaks"] { background: rgba(244, 67, 54, 0.15); color: #f44336; }
    .type-badge[data-type="Winterization"] { background: rgba(33, 150, 243, 0.15); color: #42a5f5; }
    .status-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
    .status-badge[data-status="Open"] { background: rgba(255, 152, 0, 0.15); color: #ff9800; }
    .status-badge[data-status="In Progress"] { background: rgba(33, 150, 243, 0.15); color: #42a5f5; }
    .items-count { text-align: right; font-size: 12px; color: var(--secondary-text); padding: 8px 0; }
    .local-section { margin-top: 16px; }
    .local-header { font-size: 13px; font-weight: 600; color: var(--secondary-text); margin: 0 0 8px; }
    .local-section, .empty-history { display: flex; flex-direction: column; gap: 8px; }
    .empty-history { padding: 32px; text-align: center; color: var(--secondary-text); }
    .history-item { display: flex; flex-direction: column; gap: 4px; padding: 12px 16px;
      border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-background);
      cursor: pointer; text-align: left; font-family: inherit; color: var(--primary-text); }
    .history-item:hover { border-color: var(--accent-color); }
    .history-item-header { display: flex; justify-content: space-between; align-items: center; }
    .history-item-type { font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--accent-color); }
    .history-item-status { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: var(--secondary-background); }
    .not-submitted { background: var(--error-bg); color: var(--error-text); }
    .history-item-title { font-size: 15px; font-weight: 500; }
    .detail-card { background: var(--primary-background); border-radius: 16px; padding: 24px;
      max-width: 500px; width: 90vw; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,.3); }
    .detail-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .detail-close { margin-left: auto; background: none; border: none; font-size: 24px; cursor: pointer; color: var(--primary-text); }
    .detail-title { font-size: 18px; font-weight: 600; margin: 0 0 16px; }
    .detail-fields { display: flex; flex-direction: column; gap: 8px; }
    .detail-field { font-size: 14px; color: var(--primary-text); }
    .detail-field strong { color: var(--secondary-text); display: inline-block; min-width: 80px; }
    .detail-notes { background: var(--secondary-background); padding: 10px 12px; border-radius: 6px;
      white-space: pre-wrap; font-size: 13px; margin-top: 4px; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex;
      align-items: center; justify-content: center; z-index: 9999; }
    .spinner { width: 40px; height: 40px; border: 4px solid var(--border-color);
      border-top-color: var(--accent-color); border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .area-fab { position: fixed; bottom: 16px; right: 16px; padding: 10px 16px; background: var(--accent-color);
      color: white; border: none; border-radius: 24px; font-size: 13px; font-family: inherit; cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25); z-index: 100; white-space: nowrap; }
    .area-fab:hover { opacity: 0.9; }
    .area-popup { position: fixed; bottom: 0; left: 0; right: 0; max-height: 40vh; overflow-y: auto;
      background: var(--primary-background); border-top: 2px solid var(--accent-color);
      box-shadow: 0 -4px 20px rgba(0,0,0,.15); z-index: 100; padding: 12px 16px; border-radius: 16px 16px 0 0; }
    .area-popup-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .area-popup-title { font-size: 14px; font-weight: 600; }
    .area-popup-close { background: none; border: none; font-size: 22px; cursor: pointer; color: var(--secondary-text); }
    .area-popup-loading, .area-popup-empty { font-size: 13px; color: var(--secondary-text); padding: 8px 0; }
    .area-popup-list { display: flex; flex-direction: column; gap: 6px; }
    .area-popup-item { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; color: var(--primary-text); }
    .area-popup-item:hover { border-color: var(--accent-color); }
    .area-popup-item-title { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
    .area-popup-item-meta { display: flex; gap: 10px; font-size: 12px; color: var(--secondary-text); align-items: center; }
    .area-popup-count { font-size: 11px; color: var(--secondary-text); text-align: right; padding-top: 6px; }
    @media (max-width: 768px) {
      .action-cards { grid-template-columns: 1fr 1fr; max-width: 400px; }
      .table-header { display: none; }
      .table-row { grid-template-columns: 1fr 1fr; padding: 12px; }
      .filter-tabs { margin-left: 0; width: 100%; }
    }
    @media (max-width: 400px) { .action-cards { grid-template-columns: 1fr; } }
  `]
})
export class FieldListComponent implements OnInit {
  private serverApi = inject(ServerApiService);
  serverStatus = inject(ServerStatusService);
  private authService = inject(AuthService);
  private orchestrator = inject(SubmissionOrchestratorService);
  private userSetup = inject(UserSetupService);
  private globalMessage = inject(GlobalMessageService);
  private supabaseData = inject(SupabaseDataService);
  private http = inject(HttpClient);

  mode = signal<ViewMode>('select');
  fields = signal<FormField[]>([]);
  editFields = signal<FormField[]>([]);
  editingItem = signal<any>(null);
  editEntity = signal<any>({});
  editingSubmitted = signal(false);
  draftEntity = signal<any>({});
  presetListType = signal('');

  // Open items
  openItems = signal<OpenItem[]>([]);
  loadingOpenItems = signal(false);
  openItemsFilter = signal<string | null>(null);
  detailItem = signal<OpenItem | null>(null);

  // Area items popup
  areaItems = signal<OpenItem[]>([]);
  areaName = signal('');
  areaPopupExpanded = signal(false);
  loadingAreaItems = signal(false);
  private lastAreaId: number | null = null;

  filteredOpenItems = computed(() => {
    const filter = this.openItemsFilter();
    const items = this.openItems();
    return filter ? items.filter(i => i.listTypeName === filter) : items;
  });

  // Local-only items (not submitted to server)
  localOnlyItems = signal<any[]>([]);

  private listTypeOptions: Option[] = [];
  private editingLocalUuid = '';

  private static readonly DRAFT_KEY = 'pwa_field_list_draft';

  ngOnInit(): void {
    this.loadListTypes();
  }

  private loadListTypes(): void {
    const cached = localStorage.getItem('pwa_field_list_types');
    if (cached) {
      try { this.setListTypeOptions(JSON.parse(cached)); } catch { /* ignore */ }
    }
    if (this.listTypeOptions.length === 0) {
      this.setListTypeOptions([
        { id: 0, name: 'Insulation Removal' },
        { id: 0, name: 'Leaks' },
        { id: 0, name: 'Winterization' }
      ]);
    }

    const apply = (types: { id: number; name: string }[]) => {
      this.setListTypeOptions(types);
      localStorage.setItem('pwa_field_list_types', JSON.stringify(types));
    };

    this.serverApi.getFieldListTypes().subscribe({
      next: apply,
      error: () => {
        const fromStatic = () => this.http.get<{ id: number; name: string }[]>('data/field-list-types.json').subscribe({
          next: apply,
          error: () => {}
        });
        this.supabaseData.snapshotOrElse('field_list_types', apply, fromStatic);
      }
    });
  }

  private setListTypeOptions(types: { id: number; name: string }[]): void {
    this.listTypeOptions = types.map(t => ({ value: t.name, label: t.name }));
  }

  // ====================== Navigation ======================

  selectNewWithType(listType: string): void {
    this.presetListType.set(listType);
    this.fields.set(fieldListFormFields(this.listTypeOptions, listType, true));
    this.loadDraft(listType);
    this.mode.set('new');
  }

  openItemsList(): void {
    this.mode.set('open-items');
    this.loadOpenItems();
    this.loadLocalOnlyItems();
  }

  backToSelect(): void {
    this.mode.set('select');
    this.detailItem.set(null);
  }

  // ====================== Open items ======================

  private loadOpenItems(): void {
    if (!this.authService.isLoggedIn()) {
      this.openItems.set([]);
      return;
    }
    this.loadingOpenItems.set(true);
    this.serverApi.getOpenFieldListItems().subscribe({
      next: items => {
        this.openItems.set(items);
        this.loadingOpenItems.set(false);
      },
      error: () => {
        this.openItems.set([]);
        this.loadingOpenItems.set(false);
      }
    });
  }

  filterOpenItems(listType: string | null): void {
    this.openItemsFilter.set(listType);
  }

  viewOpenItem(item: OpenItem): void {
    this.detailItem.set(item);
  }

  private loadLocalOnlyItems(): void {
    const stored = this.getStoredItems();
    this.localOnlyItems.set(stored.filter((i: any) => !i.submitted));
  }

  private loadAreaItems(areaName: string): void {
    if (!this.authService.isLoggedIn() || !this.serverStatus.isOnline()) return;

    this.areaName.set(areaName);
    this.loadingAreaItems.set(true);
    this.areaPopupExpanded.set(true);

    this.serverApi.getOpenFieldListItems(this.presetListType()).subscribe({
      next: items => {
        const filtered = items.filter((i: any) => i.locationName === areaName);
        this.areaItems.set(filtered);
        this.loadingAreaItems.set(false);
        if (filtered.length === 0) {
          // Auto-close after a short delay if no items
          setTimeout(() => { if (this.areaItems().length === 0) this.areaPopupExpanded.set(false); }, 2000);
        }
      },
      error: () => {
        this.areaItems.set([]);
        this.loadingAreaItems.set(false);
        this.areaPopupExpanded.set(false);
      }
    });
  }

  editLocalItem(item: any): void {
    this.editingItem.set(item);
    this.editingLocalUuid = item.localUuid;
    this.editingSubmitted.set(false);
    this.editEntity.set(item);
    this.editFields.set(fieldListFormFields(this.listTypeOptions, item.listTypeName));
    this.mode.set('edit');
  }

  // ====================== Draft ======================

  onDraftChange(formData: any): void {
    try {
      const { attachments, ...draftData } = formData;
      const key = FieldListComponent.DRAFT_KEY + '_' + this.presetListType();
      localStorage.setItem(key, JSON.stringify(draftData));
    } catch { /* ignore */ }

    // Detect area selection change → show active items for that area
    const area = formData.workAreaMap;
    const areaId = area?.id ?? null;
    if (areaId && areaId !== this.lastAreaId) {
      this.lastAreaId = areaId;
      this.loadAreaItems(area.name);
    } else if (!areaId && this.lastAreaId) {
      this.lastAreaId = null;
      this.areaPopupExpanded.set(false);
    }
  }

  private loadDraft(listType: string): void {
    try {
      const raw = localStorage.getItem(FieldListComponent.DRAFT_KEY + '_' + listType);
      if (raw) {
        const draft = JSON.parse(raw);
        draft.listTypeName = listType; // always keep preset type
        this.draftEntity.set(draft);
      } else {
        this.draftEntity.set({ listTypeName: listType });
      }
    } catch {
      this.draftEntity.set({ listTypeName: listType });
    }
  }

  private clearDraft(listType: string): void {
    localStorage.removeItem(FieldListComponent.DRAFT_KEY + '_' + listType);
    this.draftEntity.set({ listTypeName: listType });
  }

  // ====================== Submit new ======================

  onSubmit(formData: any): void {
    this.globalMessage.showLoading('Submitting field list item...');

    const payload = this.buildPayload(formData);
    payload.localUuid = crypto.randomUUID();

    this.orchestrator.submitFieldListItem(payload).subscribe({
      next: (result) => {
        payload.submitted = result.success;
        this.saveToLocalHistory(payload);
        if (result.success) {
          this.clearDraft(this.presetListType());
          this.globalMessage.showSuccess(result.message || `Submitted via ${result.method}`);
          this.backToSelect();
        } else {
          this.globalMessage.showError(result.message || 'Submission failed. Item saved locally.');
        }
      },
      error: () => {
        payload.submitted = false;
        this.saveToLocalHistory(payload);
        this.globalMessage.showError('Submission failed. Item saved locally for retry.');
      }
    });
  }

  // ====================== Edit existing ======================

  onUpdate(formData: any): void {
    this.globalMessage.showLoading('Submitting field list item...');

    const payload = this.buildPayload(formData);
    payload.localUuid = this.editingLocalUuid;

    const wasSubmitted = this.editingSubmitted();
    const action$ = wasSubmitted
      ? this.orchestrator.updateFieldListItem(payload)
      : this.orchestrator.submitFieldListItem(payload);

    action$.subscribe({
      next: (result) => {
        payload.submitted = result.success;
        this.updateLocalHistory(payload);
        if (result.success) {
          this.globalMessage.showSuccess(wasSubmitted
            ? (result.message || 'Updated successfully')
            : (result.message || 'Submitted successfully'));
          this.backToSelect();
        } else {
          this.globalMessage.showError(result.message || 'Failed. Changes saved locally.');
        }
      },
      error: () => {
        payload.submitted = false;
        this.updateLocalHistory(payload);
        this.globalMessage.showError('Failed. Changes saved locally.');
      }
    });
  }

  // ====================== Shared ======================

  private buildPayload(formData: any): any {
    let equipmentTag = '';
    if (formData.equipmentTag && typeof formData.equipmentTag === 'object') {
      equipmentTag = formData.equipmentTag.tagNumber || '';
    } else if (typeof formData.equipmentTag === 'string') {
      equipmentTag = formData.equipmentTag;
    }

    let locationName = '';
    if (formData.workAreaMap && typeof formData.workAreaMap === 'object') {
      locationName = formData.workAreaMap.name || '';
    }

    // Auto-populate submitter details from user profile
    const userData = this.userSetup.getUserData();

    return {
      localUuid: '',
      listTypeName: formData.listTypeName || '',
      statusName: 'Open',
      title: formData.title || '',
      notes: formData.notes || '',
      dateObserved: formData.dateObserved || '',
      timeObserved: formData.timeObserved || '',
      locationName,
      specificLocation: formData.locationDetail || '',
      equipmentTag,
      submitterName: userData?.name || '',
      submitterEmail: userData?.email || '',
      submitterPhone: userData?.phone || '',
      attachments: formData.attachments || []
    };
  }

  // ====================== Local history (localStorage) ======================

  private saveToLocalHistory(payload: any): void {
    try {
      const { attachments, ...storable } = payload;
      const items = this.getStoredItems();
      items.unshift(storable);
      localStorage.setItem('pwa_field_list_history', JSON.stringify(items.slice(0, 50)));
    } catch (e) {
      console.warn('[FieldList] Failed to save to local history:', e);
    }
  }

  private updateLocalHistory(payload: any): void {
    try {
      const { attachments, ...storable } = payload;
      const items = this.getStoredItems();
      const idx = items.findIndex((i: any) => i.localUuid === storable.localUuid);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...storable };
      }
      localStorage.setItem('pwa_field_list_history', JSON.stringify(items));
    } catch (e) {
      console.warn('[FieldList] Failed to update local history:', e);
    }
  }

  private getStoredItems(): any[] {
    try {
      return JSON.parse(localStorage.getItem('pwa_field_list_history') || '[]');
    } catch {
      return [];
    }
  }
}
