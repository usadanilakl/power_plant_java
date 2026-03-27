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

      <!-- Section A: P&ID Symbols -->
      <details class="section" open>
        <summary class="section-header">
          P&ID Symbols
          <span class="section-count">{{ allSymbols.length }}</span>
        </summary>
        <div class="section-body symbols-body">
          <app-rf-toggle-menu
            [menuItems]="symbolMenuItems()"
            [enableSearch]="true"
            [searchPlaceholder]="'Search symbols...'"
            (itemDblClick)="onSymbolDblClick($event)"
            (itemRightClick)="onSymbolRightClick($event)"
          />
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
      width: 220px;
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
      overflow: hidden;
    }
    .section-body app-rf-toggle-menu {
      display: block;
      height: 100%;
    }
  `],
})
export class EquipmentLibraryComponent implements OnInit {
  private api = inject(SimEquipmentApiService);
  private pidSymbols = inject(PIDSymbolsService);

  onEquipmentClick = output<SimEquipmentDto>();
  onEquipmentAddToCanvas = output<SimEquipmentDto>();

  allEquipment = signal<SimEquipmentDto[]>([]);
  isLoading = signal(true);

  ctxMenuVisible = signal(false);
  ctxMenuPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  ctxMenuItem = signal<any>(null);
  ctxMenuActions: ContextMenuAction[] = [];

  private templateMap = new Map<number, SimEquipmentDto>();

  allSymbols = this.pidSymbols.getAllSymbols();

  private static readonly CATEGORY_META: { id: string; label: string; color: string }[] = [
    { id: 'valve', label: 'Valves', color: '#4caf50' },
    { id: 'pump', label: 'Pumps', color: '#ff9800' },
    { id: 'vessel', label: 'Vessels', color: '#00bcd4' },
    { id: 'instrument', label: 'Instruments', color: '#cddc39' },
    { id: 'electrical', label: 'Electrical', color: '#ff5722' },
  ];

  private static readonly ROLE_COLORS: Record<string, string> = {
    source: '#2196f3', sink: '#9c27b0', valve: '#4caf50', pump: '#ff9800',
    pipe: '#795548', vessel: '#00bcd4', instrument: '#cddc39', motor: '#ff5722',
  };

  private static readonly ROLE_ORDER = ['source', 'valve', 'pump', 'vessel', 'instrument', 'motor', 'junction', 'pipe', 'sink'];

  // --- P&ID Symbols menu (grouped by category) ---

  symbolMenuItems = computed((): NestedItem[] => {
    return EquipmentLibraryComponent.CATEGORY_META.map(cat => {
      const symbols = this.pidSymbols.getSymbolsByCategory(cat.id);
      if (symbols.length === 0) return null;
      return new NestedItemImpl({
        id: `cat-${cat.id}`,
        name: `${cat.label} (${symbols.length})`,
        objectType: 'Group',
        color: cat.color,
        isExpanded: false,
        values: symbols.map(sym => new NestedItemImpl({
          id: sym.id,
          name: sym.name,
          objectType: 'PIDSymbol',
          color: cat.color,
        })),
      });
    }).filter((item): item is NestedItemImpl => item != null);
  });

  // --- Saved Templates menu (grouped by role) ---

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

  // --- Symbol events ---

  onSymbolDblClick(item: NestedItem): void {
    if (item.objectType !== 'PIDSymbol') return;
    this.placeSymbolOnCanvas(item.id as string);
  }

  onSymbolRightClick(event: { event: MouseEvent; item: NestedItem }): void {
    event.event.preventDefault();
    event.event.stopPropagation();
    if (event.item.objectType !== 'PIDSymbol') return;

    const symbolId = event.item.id as string;
    this.ctxMenuItem.set(symbolId);
    this.ctxMenuPosition.set({ x: event.event.clientX, y: event.event.clientY });
    this.ctxMenuActions = [
      {
        id: 'add-to-diagram',
        label: 'Add to Diagram',
        action: () => this.placeSymbolOnCanvas(symbolId),
      },
    ];
    this.ctxMenuVisible.set(true);
  }

  // --- Template events ---

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

  // --- Actions ---

  private placeSymbolOnCanvas(symbolId: string): void {
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
