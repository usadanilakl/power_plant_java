import { Component, inject, signal, computed, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimEquipmentApiService } from '../../services/sim-equipment-api.service';
import { SimEquipmentDto, SimRole, SYMBOL_ROLE_MAP, defaultSimParams, serializeSimParams } from '../../models/sim-equipment.model';
import { PIDSymbolsService, PIDSymbol } from '../../../../shared/image/refactored/services/pid-symbols.service';
import { Subject, debounceTime, switchMap, of } from 'rxjs';
import { RfToggleMenuComponent } from '../../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';
import { NestedItem, NestedItemImpl } from '../../../../models/ui/nested-item.model';
import { ContextMenuComponent, ContextMenuAction } from '../../../../shared/menu/context-menu/context-menu.component';

@Component({
  selector: 'app-equipment-library',
  standalone: true,
  imports: [CommonModule, FormsModule, RfToggleMenuComponent, ContextMenuComponent],
  template: `
    <div class="library-panel">
      <h3>Equipment Library</h3>
      <p class="library-note">Click to select. Right-click for actions.</p>

      @if (isLoading()) {
        <p class="info">Loading...</p>
      } @else {
        <div class="menu-container">
          <app-rf-toggle-menu
            [menuItems]="menuItems()"
            [enableSearch]="true"
            [searchPlaceholder]="'Search equipment...'"
            (itemClick)="onMenuItemClick($event)"
            (itemDblClick)="onMenuItemDblClick($event)"
            (itemRightClick)="onMenuItemRightClick($event)"
          />
        </div>
      }

      <!-- Create actions -->
      <details class="create-section">
        <summary class="create-header">Create Template</summary>
        <div class="create-body">
          @if (showSymbolPicker()) {
            <div class="symbol-picker">
              @for (sym of allSymbols; track sym.id) {
                <div class="symbol-item" (click)="createFromSymbol(sym)">
                  <span class="sym-name">{{ sym.name }}</span>
                  <span class="sym-category">{{ sym.category }}</span>
                </div>
              }
              <button class="btn-sm" (click)="showSymbolPicker.set(false)">Cancel</button>
            </div>
          } @else {
            <button class="btn-create" (click)="showSymbolPicker.set(true)">
              + New Symbol Template
            </button>
          }

          <button class="btn-create" (click)="createBlank('source')">+ Source</button>
          <button class="btn-create" (click)="createBlank('sink')">+ Sink</button>
          <button class="btn-create" (click)="createBlank('junction')">+ Junction</button>
          <button class="btn-create" (click)="createBlank('pipe')">+ Pipe</button>
        </div>
      </details>
    </div>

    <app-context-menu
      [isVisible]="ctxMenuVisible()"
      [position]="ctxMenuPosition()"
      [selectedItem]="ctxMenuItem()"
      [actions]="ctxMenuActions"
      (closeMenu)="ctxMenuVisible.set(false)"
    />
  `,
  styles: [`
    .library-panel {
      width: 220px;
      background: #1a1a1a;
      border-right: 1px solid #333;
      padding: 8px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    h3 { margin: 0 0 4px; font-size: 13px; color: #aaa; }
    .library-note {
      margin: 0 0 4px;
      color: #777;
      font-size: 10px;
      line-height: 1.3;
    }
    .menu-container {
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .menu-container app-rf-toggle-menu {
      display: block;
      height: 100%;
    }
    .create-section {
      border-top: 1px solid #333;
      padding-top: 4px;
    }
    .create-header {
      font-size: 10px;
      color: #888;
      text-transform: uppercase;
      cursor: pointer;
      padding: 4px 0;
      list-style: none;
      user-select: none;
    }
    .create-header::-webkit-details-marker { display: none; }
    .create-header::before {
      content: '\\25B6';
      display: inline-block;
      font-size: 8px;
      margin-right: 6px;
      transition: transform 0.15s ease;
    }
    details[open] > .create-header::before {
      transform: rotate(90deg);
    }
    .create-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 6px;
    }
    .btn-create {
      display: block;
      width: 100%;
      padding: 6px 8px;
      background: #2a2a2a;
      border: 1px solid #444;
      color: #ccc;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      text-align: left;
    }
    .btn-create:hover { background: #3a3a3a; border-color: #666; }
    .symbol-picker {
      background: #222;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 6px;
      max-height: 200px;
      overflow-y: auto;
    }
    .symbol-item {
      padding: 4px 6px;
      cursor: pointer;
      border-radius: 3px;
      display: flex;
      justify-content: space-between;
    }
    .symbol-item:hover { background: #2a3a4a; }
    .sym-name { font-size: 11px; color: #ddd; }
    .sym-category { font-size: 9px; color: #666; }
    .btn-sm {
      padding: 4px 8px;
      background: #333;
      border: 1px solid #555;
      color: #aaa;
      border-radius: 3px;
      cursor: pointer;
      font-size: 10px;
      margin-top: 4px;
    }
    .info { font-size: 11px; color: #666; text-align: center; padding: 12px 0; }
  `],
})
export class EquipmentLibraryComponent implements OnInit {
  private api = inject(SimEquipmentApiService);
  private pidSymbols = inject(PIDSymbolsService);

  onEquipmentClick = output<SimEquipmentDto>();
  onEquipmentAddToCanvas = output<SimEquipmentDto>();

  allEquipment = signal<SimEquipmentDto[]>([]);
  isLoading = signal(true);
  showSymbolPicker = signal(false);

  // Context menu state
  ctxMenuVisible = signal(false);
  ctxMenuPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  ctxMenuItem = signal<SimEquipmentDto | null>(null);
  ctxMenuActions: ContextMenuAction[] = [];

  private searchSubject = new Subject<string>();
  private equipmentMap = new Map<string | number, SimEquipmentDto>();

  allSymbols = this.pidSymbols.getAllSymbols();

  private static readonly ROLE_COLORS: Record<string, string> = {
    source: '#2196f3', sink: '#9c27b0', valve: '#4caf50', pump: '#ff9800',
    pipe: '#795548', vessel: '#00bcd4', instrument: '#cddc39', motor: '#ff5722',
  };

  private static readonly ROLE_ORDER = ['source', 'valve', 'pump', 'vessel', 'instrument', 'motor', 'junction', 'pipe', 'sink'];

  menuItems = computed((): NestedItem[] => {
    const equipment = this.allEquipment();
    const grouped = new Map<string, SimEquipmentDto[]>();
    for (const eq of equipment) {
      const role = eq.simRole || 'junction';
      if (!grouped.has(role)) grouped.set(role, []);
      grouped.get(role)!.push(eq);
    }

    this.equipmentMap.clear();
    for (const eq of equipment) {
      if (eq.id != null) this.equipmentMap.set(eq.id, eq);
    }

    return EquipmentLibraryComponent.ROLE_ORDER
      .filter(role => grouped.has(role))
      .map(role => new NestedItemImpl({
        id: `role-${role}`,
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} (${grouped.get(role)!.length})`,
        objectType: 'Group',
        color: EquipmentLibraryComponent.ROLE_COLORS[role] || '#888',
        isExpanded: true,
        values: grouped.get(role)!.map(eq => new NestedItemImpl({
          id: eq.id!,
          name: eq.name || 'Unnamed',
          subtitle: eq.sourceEntityType ? `${eq.sourceEntityType}:${eq.sourceEntityId}` : undefined,
          objectType: 'SimEquipment',
          color: EquipmentLibraryComponent.ROLE_COLORS[role] || '#888',
        })),
      }));
  });

  ngOnInit(): void {
    this.loadAll();

    this.searchSubject.pipe(
      debounceTime(300),
      switchMap(q => q.length >= 2 ? this.api.search(q) : of(null))
    ).subscribe(res => {
      if (res?.responseData) {
        this.allEquipment.set(res.responseData);
        for (const eq of res.responseData) this.api.upsertCached(eq);
      }
    });
  }

  onMenuItemClick(item: NestedItem): void {
    if (item.objectType !== 'SimEquipment') return;
    const eq = this.equipmentMap.get(item.id);
    if (eq) this.onEquipmentClick.emit(eq);
  }

  onMenuItemDblClick(item: NestedItem): void {
    if (item.objectType !== 'SimEquipment') return;
    const eq = this.equipmentMap.get(item.id);
    if (eq) this.onEquipmentAddToCanvas.emit(eq);
  }

  onMenuItemRightClick(event: { event: MouseEvent; item: NestedItem }): void {
    event.event.preventDefault();
    event.event.stopPropagation();

    const item = event.item;
    if (item.objectType === 'Group') return;

    const eq = this.equipmentMap.get(item.id);
    if (!eq) return;

    this.ctxMenuItem.set(eq);
    this.ctxMenuPosition.set({ x: event.event.clientX, y: event.event.clientY });

    this.ctxMenuActions = [
      {
        id: 'add-to-canvas',
        label: 'Add to Diagram',
        icon: '',
        action: () => this.onEquipmentAddToCanvas.emit(eq),
      },
      { id: 'div1', label: '', divider: true, action: () => {} },
      {
        id: 'rename',
        label: 'Rename',
        icon: '',
        action: (item: any) => this.renameEquipment(item as SimEquipmentDto),
      },
      {
        id: 'delete',
        label: 'Delete Template',
        icon: '',
        action: (item: any) => this.deleteEquipment(item as SimEquipmentDto),
      },
    ];

    this.ctxMenuVisible.set(true);
  }

  loadAll(): void {
    this.isLoading.set(true);
    this.api.getAll().subscribe({
      next: (res) => {
        const items = res.responseData || [];
        this.allEquipment.set(items);
        for (const eq of items) this.api.upsertCached(eq);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  createFromSymbol(symbol: PIDSymbol): void {
    const role: SimRole = SYMBOL_ROLE_MAP[symbol.id] ?? 'junction';
    const dto: SimEquipmentDto = {
      name: symbol.name,
      symbolId: symbol.id,
      svgPath: symbol.svgPath,
      defaultWidth: symbol.width,
      defaultHeight: symbol.height,
      simRole: role,
      simParamsJson: serializeSimParams(defaultSimParams(role)),
    };
    this.api.create(dto).subscribe({
      next: (res) => {
        if (res.responseData) {
          this.api.upsertCached(res.responseData);
          this.showSymbolPicker.set(false);
          this.loadAll();
        }
      },
    });
  }

  createBlank(role: SimRole): void {
    const names: Record<string, string> = {
      source: 'New Source', sink: 'New Sink', junction: 'New Junction', pipe: 'New Pipe',
    };
    const dto: SimEquipmentDto = {
      name: names[role] || 'New Equipment',
      simRole: role,
      simParamsJson: serializeSimParams(defaultSimParams(role)),
      defaultWidth: role === 'pipe' ? 100 : 60,
      defaultHeight: role === 'pipe' ? 4 : 60,
    };
    this.api.create(dto).subscribe({
      next: (res) => {
        if (res.responseData) this.api.upsertCached(res.responseData);
        this.loadAll();
      },
    });
  }

  private renameEquipment(eq: SimEquipmentDto): void {
    const newName = prompt('Rename equipment template:', eq.name || '');
    if (newName == null || newName.trim() === '' || newName === eq.name) return;
    if (eq.id == null) return;

    this.api.update(eq.id, { ...eq, name: newName.trim() }).subscribe({
      next: (res) => {
        if (res.responseData) this.api.upsertCached(res.responseData);
        this.loadAll();
      },
    });
  }

  private deleteEquipment(eq: SimEquipmentDto): void {
    if (eq.id == null) return;
    if (!confirm(`Delete template "${eq.name || 'Unnamed'}"?`)) return;

    this.api.delete(eq.id).subscribe({
      next: () => this.loadAll(),
    });
  }
}
