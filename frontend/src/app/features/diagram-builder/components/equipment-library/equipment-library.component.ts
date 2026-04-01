import { Component, inject, signal, computed, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimEquipmentApiService } from '../../services/sim-equipment-api.service';
import { SimEquipmentDto, SimRole, SYMBOL_ROLE_MAP, defaultSimParams, serializeSimParams } from '../../models/sim-equipment.model';
import { PIDSymbolsService, PIDSymbol } from '../../../../shared/image/refactored/services/pid-symbols.service';
import { RfToggleMenuComponent } from '../../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';
import { NestedItem, NestedItemImpl } from '../../../../models/ui/nested-item.model';
import { ContextMenuComponent, ContextMenuAction } from '../../../../shared/menu/context-menu/context-menu.component';

@Component({
  selector: 'app-equipment-library',
  standalone: true,
  imports: [CommonModule, RfToggleMenuComponent, ContextMenuComponent],
  template: `
    <div class="library-panel">
      <h3>Equipment Library</h3>

      <!-- Search -->
      <input
        class="search-input"
        type="text"
        placeholder="Search symbols..."
        [value]="searchQuery()"
        (input)="searchQuery.set($any($event.target).value)"
      />

      <!-- Section A: P&ID Symbols — Visual Cards -->
      <details class="section" open>
        <summary class="section-header">
          P&ID Symbols
          <span class="section-count">{{ allSymbols.length }}</span>
        </summary>
        <div class="section-body">
          <div class="categories-container">
            @for (cat of categoryMeta; track cat.id) {
              @let symbols = getFilteredSymbols(cat.id);
              @if (symbols.length > 0) {
                <div class="category-section">
                  <button
                    class="category-toggle"
                    [class.expanded]="expandedCategory() === cat.id"
                    [style.border-left-color]="cat.color"
                    (click)="toggleCategory(cat.id)">
                    <span>{{ cat.label }}</span>
                    <span class="cat-count">{{ symbols.length }}</span>
                  </button>
                  @if (expandedCategory() === cat.id) {
                    <div class="symbol-grid">
                      @for (sym of symbols; track sym.id) {
                        <div
                          class="symbol-card"
                          [class.selected]="selectedSymbolId() === sym.id"
                          [title]="sym.name"
                          (click)="onSymbolClick(sym)"
                          (dblclick)="placeSymbolOnCanvas(sym.id)"
                          (contextmenu)="onSymbolRightClick($event, sym)">
                          <svg
                            class="symbol-preview"
                            [attr.viewBox]="'0 0 ' + sym.originalWidth + ' ' + sym.originalHeight"
                            width="36" height="36">
                            <path [attr.d]="sym.svgPath" fill="none" [attr.stroke]="selectedSymbolId() === sym.id ? '#4fc3f7' : '#ccc'" stroke-width="2"/>
                          </svg>
                          <span class="symbol-name">{{ sym.name }}</span>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            }
          </div>
        </div>
      </details>

      <!-- Section B: Saved Templates -->
      <details class="section">
        <summary class="section-header">
          Saved Templates
          <span class="section-count">{{ allEquipment().length }}</span>
          @if (isLoading()) {
            <span class="loading-dot"></span>
          }
        </summary>
        <div class="section-body templates-body">
          <app-rf-toggle-menu
            [menuItems]="templateMenuItems()"
            [enableSearch]="true"
            [searchPlaceholder]="'Search templates...'"
            (itemClick)="onTemplateClick($event)"
            (itemDblClick)="onTemplateDblClick($event)"
            (itemRightClick)="onTemplateRightClick($event)"
          />
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
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }
    .library-panel {
      width: 240px;
      height: 100%;
      background: #1a1a1a;
      border-right: 1px solid #333;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
      box-sizing: border-box;
    }
    h3 { margin: 0 0 4px; font-size: 13px; color: #aaa; }

    .search-input {
      width: 100%;
      padding: 6px 8px;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 4px;
      color: #ccc;
      font-size: 12px;
      margin-bottom: 4px;
      box-sizing: border-box;
    }
    .search-input::placeholder { color: #666; }
    .search-input:focus {
      outline: none;
      border-color: #2196f3;
    }

    .section {
      display: flex;
      flex-direction: column;
      min-height: 0;
      border-top: 1px solid #333;
    }
    .section[open] { flex: 1; }
    .section-header {
      font-size: 11px;
      color: #999;
      cursor: pointer;
      padding: 6px 2px;
      list-style: none;
      user-select: none;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-header::-webkit-details-marker { display: none; }
    .section-header::before {
      content: '\\25B6';
      display: inline-block;
      font-size: 7px;
      transition: transform 0.15s ease;
    }
    details[open] > .section-header::before {
      transform: rotate(90deg);
    }
    .section-count {
      font-size: 10px;
      color: #666;
      margin-left: auto;
    }
    .loading-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #4caf50;
      animation: pulse 1s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
    .section-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
    .section-body app-rf-toggle-menu {
      display: block;
      height: 100%;
    }
    .templates-body {
      overflow: hidden;
    }

    /* Categories */
    .categories-container {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .category-toggle {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 8px;
      background: #222;
      border: none;
      border-left: 3px solid #444;
      color: #bbb;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
    }
    .category-toggle:hover {
      background: #2a2a2a;
      color: #ddd;
    }
    .category-toggle.expanded {
      background: #2a2a2a;
      color: #fff;
    }
    .cat-count {
      font-size: 10px;
      color: #666;
      font-weight: 400;
    }

    /* Symbol Grid */
    .symbol-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
      padding: 6px 4px;
      background: #1e1e1e;
    }
    .symbol-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 6px 2px 4px;
      background: #252525;
      border: 1px solid #333;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s;
      min-height: 54px;
    }
    .symbol-card:hover {
      background: #2d2d2d;
      border-color: #555;
      transform: translateY(-1px);
    }
    .symbol-card.selected {
      background: #1a3a5c;
      border-color: #2196f3;
    }
    .symbol-preview {
      flex-shrink: 0;
      margin-bottom: 2px;
    }
    .symbol-name {
      font-size: 9px;
      color: #888;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      line-height: 1.2;
    }
    .symbol-card:hover .symbol-name {
      color: #bbb;
    }
    .symbol-card.selected .symbol-name {
      color: #4fc3f7;
    }

    /* Scrollbar */
    .section-body::-webkit-scrollbar { width: 5px; }
    .section-body::-webkit-scrollbar-track { background: transparent; }
    .section-body::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
    .section-body::-webkit-scrollbar-thumb:hover { background: #666; }
  `],
})
export class EquipmentLibraryComponent implements OnInit {
  private api = inject(SimEquipmentApiService);
  private pidSymbols = inject(PIDSymbolsService);

  onEquipmentClick = output<SimEquipmentDto>();
  onEquipmentAddToCanvas = output<SimEquipmentDto>();

  allEquipment = signal<SimEquipmentDto[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');
  expandedCategory = signal<string | null>('valve');
  selectedSymbolId = signal<string | null>(null);

  ctxMenuVisible = signal(false);
  ctxMenuPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  ctxMenuItem = signal<any>(null);
  ctxMenuActions: ContextMenuAction[] = [];

  private templateMap = new Map<number, SimEquipmentDto>();

  allSymbols = this.pidSymbols.getAllSymbols();

  categoryMeta = [
    { id: 'valve', label: 'Valves', color: '#4caf50' },
    { id: 'pump', label: 'Pumps', color: '#ff9800' },
    { id: 'vessel', label: 'Vessels', color: '#00bcd4' },
    { id: 'instrument', label: 'Instruments', color: '#cddc39' },
    { id: 'electrical', label: 'Electrical', color: '#ff5722' },
    { id: 'rotating-equipment', label: 'Rotating Equip', color: '#42a5f5' },
  ];

  private static readonly ROLE_COLORS: Record<string, string> = {
    source: '#2196f3', sink: '#9c27b0', valve: '#4caf50', pump: '#ff9800',
    pipe: '#795548', vessel: '#00bcd4', instrument: '#cddc39', motor: '#ff5722',
  };

  private static readonly ROLE_ORDER = ['source', 'valve', 'pump', 'vessel', 'instrument', 'motor', 'junction', 'pipe', 'sink'];

  getFilteredSymbols(category: string): PIDSymbol[] {
    const query = this.searchQuery().toLowerCase().trim();
    const symbols = this.pidSymbols.getSymbolsByCategory(category);
    if (!query) return symbols;
    return symbols.filter(s => s.name.toLowerCase().includes(query));
  }

  toggleCategory(categoryId: string): void {
    this.expandedCategory.set(this.expandedCategory() === categoryId ? null : categoryId);
  }

  // --- Symbol events ---

  onSymbolClick(sym: PIDSymbol): void {
    this.selectedSymbolId.set(sym.id);
  }

  onSymbolRightClick(event: MouseEvent, sym: PIDSymbol): void {
    event.preventDefault();
    event.stopPropagation();
    this.ctxMenuItem.set(sym.id);
    this.ctxMenuPosition.set({ x: event.clientX, y: event.clientY });
    this.ctxMenuActions = [
      {
        id: 'add-to-diagram',
        label: 'Add to Diagram',
        action: () => this.placeSymbolOnCanvas(sym.id),
      },
    ];
    this.ctxMenuVisible.set(true);
  }

  placeSymbolOnCanvas(symbolId: string): void {
    const symbol = this.pidSymbols.getSymbolById(symbolId);
    if (!symbol) return;

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
          this.onEquipmentAddToCanvas.emit(res.responseData);
          this.loadAll();
        }
      },
    });
  }

  // --- Saved Templates (unchanged) ---

  templateMenuItems = computed((): NestedItem[] => {
    const equipment = this.allEquipment();
    const grouped = new Map<string, SimEquipmentDto[]>();
    for (const eq of equipment) {
      const role = eq.simRole || 'junction';
      if (!grouped.has(role)) grouped.set(role, []);
      grouped.get(role)!.push(eq);
    }

    this.templateMap.clear();
    for (const eq of equipment) {
      if (eq.id != null) this.templateMap.set(eq.id, eq);
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
  }

  onTemplateClick(item: NestedItem): void {
    if (item.objectType !== 'SimEquipment') return;
    const eq = this.templateMap.get(item.id as number);
    if (eq) this.onEquipmentClick.emit(eq);
  }

  onTemplateDblClick(item: NestedItem): void {
    if (item.objectType !== 'SimEquipment') return;
    const eq = this.templateMap.get(item.id as number);
    if (eq) this.onEquipmentAddToCanvas.emit(eq);
  }

  onTemplateRightClick(event: { event: MouseEvent; item: NestedItem }): void {
    event.event.preventDefault();
    event.event.stopPropagation();
    if (event.item.objectType !== 'SimEquipment') return;

    const eq = this.templateMap.get(event.item.id as number);
    if (!eq) return;

    this.ctxMenuItem.set(eq);
    this.ctxMenuPosition.set({ x: event.event.clientX, y: event.event.clientY });
    this.ctxMenuActions = [
      {
        id: 'add-to-diagram',
        label: 'Add to Diagram',
        action: () => this.onEquipmentAddToCanvas.emit(eq),
      },
      { id: 'div1', label: '', divider: true, action: () => {} },
      {
        id: 'rename',
        label: 'Rename',
        action: () => this.renameEquipment(eq),
      },
      {
        id: 'delete',
        label: 'Delete Template',
        action: () => this.deleteEquipment(eq),
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
