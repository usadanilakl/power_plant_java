import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoTableComponent } from '../maximo-table/maximo-table.component';
import { INVENTORY_COLUMNS } from '../maximo-table-configs';
import { MaximoInventoryItem, MaximoInventoryStock, MaximoInventoryUsage } from '../../../models/maximo/maximo.models';

/**
 * Inventory stock-lookup: word-bucket item search (itemnum/description) → results table with on-hand qty →
 * select an item to see its full stock detail (balance, reserved, reorder levels, unit cost, usage stats)
 * + material-use history (which WOs consumed it). "Check out" jumps into the parts-checkout flow.
 */
@Component({
  selector: 'app-maximo-inventory-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, MaximoTableComponent],
  templateUrl: './maximo-inventory-page.component.html',
  styleUrl: './maximo-inventory-page.component.css'
})
export class MaximoInventoryPageComponent {
  private api = inject(MaximoApiService);
  private router = inject(Router);

  readonly columns = INVENTORY_COLUMNS;

  searchQuery = '';
  filterStoreroom = '';                       // '' = all warehouses
  searchSize = 50;
  storerooms = signal<string[]>([]);
  searching = signal(false);
  searchError = signal<string | null>(null);
  results = signal<MaximoInventoryItem[]>([]);

  constructor() {
    firstValueFrom(this.api.getStorerooms()).then(s => this.storerooms.set(s)).catch(() => {});
  }

  selected = signal<MaximoInventoryItem | null>(null);
  stock = signal<MaximoInventoryStock | null>(null);
  usage = signal<MaximoInventoryUsage[]>([]);
  detailLoading = signal(false);
  detailError = signal<string | null>(null);

  async search() {
    this.searching.set(true); this.searchError.set(null);
    try {
      this.results.set(await firstValueFrom(
        this.api.searchInventory(this.searchQuery, this.searchSize, this.filterStoreroom || undefined)));
    } catch (e: any) {
      this.searchError.set(this.msg(e)); this.results.set([]);
    } finally {
      this.searching.set(false);
    }
  }

  async select(it: MaximoInventoryItem) {
    this.selected.set(it);
    this.stock.set(null); this.usage.set([]);
    this.detailLoading.set(true); this.detailError.set(null);
    try {
      // Scope stock + usage to the item's own warehouse (each row is one item×warehouse line).
      const [stock, usage] = await Promise.all([
        firstValueFrom(this.api.getInventoryItem(it.itemnum, it.storeroom)),
        firstValueFrom(this.api.getInventoryUsage(it.itemnum, 50, it.storeroom)),
      ]);
      this.stock.set(stock);
      this.usage.set(usage);
    } catch (e: any) {
      this.detailError.set(this.msg(e));
    } finally {
      this.detailLoading.set(false);
    }
  }

  /** Jump into the parts-checkout flow seeded with this item. */
  checkout(it: MaximoInventoryItem) {
    this.router.navigate(['/maximo/parts-checkout'], { queryParams: { item: it.itemnum } });
  }

  private msg(e: any): string { return e?.error?.message ?? e?.message ?? String(e); }
}
