import { Component, inject, signal, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimEquipmentApiService } from '../../services/sim-equipment-api.service';
import { SimEquipmentDto, SimRole, SYMBOL_ROLE_MAP, defaultSimParams, serializeSimParams } from '../../models/sim-equipment.model';
import { PIDSymbolsService, PIDSymbol } from '../../../../shared/image/refactored/services/pid-symbols.service';
import { Subject, debounceTime, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-equipment-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="library-panel">
      <h3>Equipment Library</h3>
      <p class="library-note">Drag a template onto the canvas to create an independent equipment instance.</p>

      <!-- Search -->
      <input type="text" class="search-input" placeholder="Search equipment..."
        [ngModel]="searchQuery()"
        (ngModelChange)="onSearch($event)" />

      <!-- Equipment list grouped by role -->
      @if (isLoading()) {
        <p class="info">Loading...</p>
      } @else {
        @for (group of groupedEquipment(); track group.role) {
          <div class="group">
            <div class="group-header">{{ group.role | titlecase }}</div>
            @for (eq of group.items; track eq.id) {
              <div class="eq-item"
                draggable="true"
                (dragstart)="onDragStart($event, eq)"
                (click)="onEquipmentClick.emit(eq)">
                <span class="eq-icon" [style.color]="roleColor(eq.simRole)">●</span>
                <div class="eq-info">
                  <span class="eq-name">{{ eq.name || 'Unnamed' }}</span>
                  @if (eq.sourceEntityType) {
                    <span class="eq-source">{{ eq.sourceEntityType }}:{{ eq.sourceEntityId }}</span>
                  }
                </div>
              </div>
            }
          </div>
        }

        @if (groupedEquipment().length === 0 && !isLoading()) {
          <p class="info">No equipment yet</p>
        }
      }

      <!-- Create actions -->
      <div class="create-actions">
        <div class="create-header">Create Template</div>

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

        <button class="btn-create" (click)="createBlank('source')">+ Source Template</button>
        <button class="btn-create" (click)="createBlank('sink')">+ Sink Template</button>
        <button class="btn-create" (click)="createBlank('junction')">+ Junction Template</button>
        <button class="btn-create" (click)="createBlank('pipe')">+ Pipe Template</button>
      </div>
    </div>
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
    h3 { margin: 0 0 8px; font-size: 13px; color: #aaa; }
    .library-note {
      margin: 0 0 8px;
      color: #777;
      font-size: 10px;
      line-height: 1.3;
    }
    .search-input {
      width: 100%;
      box-sizing: border-box;
      padding: 6px 8px;
      background: #2a2a2a;
      border: 1px solid #444;
      color: #ddd;
      border-radius: 3px;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .group { margin-bottom: 8px; }
    .group-header {
      font-size: 10px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 4px 0;
      border-bottom: 1px solid #333;
      margin-bottom: 4px;
    }
    .eq-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 6px;
      border-radius: 3px;
      cursor: grab;
      transition: background 0.15s;
    }
    .eq-item:hover { background: #2a3a4a; }
    .eq-item:active { cursor: grabbing; }
    .eq-icon { font-size: 10px; }
    .eq-info { display: flex; flex-direction: column; overflow: hidden; }
    .eq-name { font-size: 12px; color: #ddd; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .eq-source { font-size: 9px; color: #666; }
    .create-actions {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #333;
    }
    .create-header {
      font-size: 10px;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 6px;
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
      margin-bottom: 4px;
    }
    .btn-create:hover { background: #3a3a3a; border-color: #666; }
    .symbol-picker {
      background: #222;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 6px;
      margin-bottom: 6px;
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
  onEquipmentDrag = output<SimEquipmentDto>();

  allEquipment = signal<SimEquipmentDto[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');
  showSymbolPicker = signal(false);

  private searchSubject = new Subject<string>();

  allSymbols = this.pidSymbols.getAllSymbols();

  groupedEquipment = signal<{ role: string; items: SimEquipmentDto[] }[]>([]);

  ngOnInit(): void {
    this.loadAll();

    this.searchSubject.pipe(
      debounceTime(300),
      switchMap(q => q.length >= 2 ? this.api.search(q) : of(null))
    ).subscribe(res => {
      if (res?.responseData) {
        this.allEquipment.set(res.responseData);
        for (const eq of res.responseData) this.api.upsertCached(eq);
        this.rebuildGroups();
      }
    });
  }

  loadAll(): void {
    this.isLoading.set(true);
    this.api.getAll().subscribe({
      next: (res) => {
        const items = res.responseData || [];
        this.allEquipment.set(items);
        for (const eq of items) this.api.upsertCached(eq);
        this.rebuildGroups();
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    if (query.length < 2) {
      this.loadAll();
    } else {
      this.searchSubject.next(query);
    }
  }

  onDragStart(event: DragEvent, eq: SimEquipmentDto): void {
    event.dataTransfer?.setData('application/sim-equipment', JSON.stringify(eq));
    this.onEquipmentDrag.emit(eq);
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

  roleColor(role?: string): string {
    switch (role) {
      case 'source': return '#2196f3';
      case 'sink': return '#9c27b0';
      case 'valve': return '#4caf50';
      case 'pump': return '#ff9800';
      case 'pipe': return '#795548';
      case 'vessel': return '#00bcd4';
      case 'instrument': return '#cddc39';
      case 'motor': return '#ff5722';
      default: return '#888';
    }
  }

  private rebuildGroups(): void {
    const map = new Map<string, SimEquipmentDto[]>();
    for (const eq of this.allEquipment()) {
      const role = eq.simRole || 'junction';
      if (!map.has(role)) map.set(role, []);
      map.get(role)!.push(eq);
    }
    const order = ['source', 'valve', 'pump', 'vessel', 'instrument', 'motor', 'junction', 'pipe', 'sink'];
    this.groupedEquipment.set(
      order.filter(r => map.has(r)).map(r => ({ role: r, items: map.get(r)! }))
    );
  }
}
