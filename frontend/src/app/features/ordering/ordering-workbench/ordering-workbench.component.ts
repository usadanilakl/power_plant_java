import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { TableComponent } from '../../../shared/table/table.component';
import { Column } from '../../../models/column.model';
import { OrderingService } from '../services/ordering.service';
import {
  OrderCatalogItem,
  OrderLine,
  OrderRecord,
  PlaceOrderRequest,
  ReorderSuggestion,
} from '../models/ordering.model';

type Tab = 'place' | 'history' | 'suggestions' | 'catalog';

@Component({
  selector: 'app-ordering-workbench',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, TableComponent],
  templateUrl: './ordering-workbench.component.html',
  styleUrl: './ordering-workbench.component.css',
})
export class OrderingWorkbenchComponent implements OnInit {
  private api = inject(OrderingService);

  tab = signal<Tab>('place');
  available = signal<boolean | null>(null);
  loading = signal(false);
  toast = signal<string>('');
  error = signal<string>('');

  catalog = signal<OrderCatalogItem[]>([]);
  orders = signal<OrderRecord[]>([]);
  suggestions = signal<ReorderSuggestion[]>([]);

  activeCatalog = computed(() => this.catalog().filter(c => c.active));

  // ── Place Order state ──
  selectedItemKey = signal<string>('');
  lines = signal<OrderLine[]>([]);
  chosenOptions = signal<Record<string, boolean>>({});
  freeNote = signal<string>('');
  orderedBy = signal<string>('');
  sourceSuggestionId = signal<string>('');
  sending = signal(false);

  selectedItem = computed(() => this.catalog().find(c => c.itemKey === this.selectedItemKey()) || null);

  // ── Catalog Admin state ──
  editing = signal<OrderCatalogItem | null>(null);

  /** TableComponent requires a clickCallback; history rows are non-interactive. */
  rowNoop = (_item: unknown, _e: MouseEvent): void => {};

  historyColumns: Column[] = [
    { id: 'orderDate', header: 'Date', accessorFn: (o: OrderRecord) => (o.orderDate || '').replace('T', ' ').slice(0, 16) },
    { id: 'vendor', header: 'Vendor', accessorKey: 'vendor' },
    { id: 'poNumber', header: 'PO#', accessorKey: 'poNumber' },
    { id: 'items', header: 'Items', accessorFn: (o: OrderRecord) => String(o.lines?.length ?? 0) },
    { id: 'sent', header: 'Sent', accessorFn: (o: OrderRecord) => (o.emailSent ? '✓' : '✗') },
    { id: 'orderedBy', header: 'By', accessorKey: 'orderedBy' },
  ];

  catalogColumns: Column[] = [
    { id: 'displayName', header: 'Item', accessorKey: 'displayName' },
    { id: 'vendor', header: 'Vendor', accessorKey: 'vendor' },
    { id: 'contactEmail', header: 'Contact', accessorFn: (c: OrderCatalogItem) => c.contactEmail || '—' },
    { id: 'blanketPoNumber', header: 'PO#', accessorKey: 'blanketPoNumber' },
    { id: 'active', header: 'Active', accessorFn: (c: OrderCatalogItem) => (c.active ? 'Yes' : 'No') },
  ];

  async ngOnInit(): Promise<void> {
    await this.refreshCatalog();
  }

  // ── tabs ──
  async setTab(t: Tab): Promise<void> {
    this.tab.set(t);
    this.toast.set('');
    this.error.set('');
    if (t === 'history') await this.loadOrders();
    if (t === 'suggestions') await this.loadSuggestions();
  }

  async refreshCatalog(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.available.set(await firstValueFrom(this.api.status()));
      this.catalog.set(await firstValueFrom(this.api.listCatalog()));
    } catch (e) {
      this.error.set(this.msg(e));
    } finally {
      this.loading.set(false);
    }
  }

  async loadOrders(): Promise<void> {
    this.loading.set(true);
    try {
      this.orders.set(await firstValueFrom(this.api.listOrders()));
    } catch (e) {
      this.error.set(this.msg(e));
    } finally {
      this.loading.set(false);
    }
  }

  async loadSuggestions(): Promise<void> {
    this.loading.set(true);
    try {
      this.suggestions.set(await firstValueFrom(this.api.listSuggestions(true)));
    } catch (e) {
      this.error.set(this.msg(e));
    } finally {
      this.loading.set(false);
    }
  }

  // ── Place Order ──
  onItemChange(key: string): void {
    this.selectedItemKey.set(key);
    this.chosenOptions.set({});
    this.freeNote.set('');
    const item = this.catalog().find(c => c.itemKey === key);
    const unit = item?.unit || '';
    const lines: OrderLine[] = (item?.defaultQtyPresets || []).map(p => ({
      description: p.label,
      qty: p.defaultQty ?? null,
      unit,
    }));
    if (!lines.length) lines.push({ description: '', qty: null, unit });
    this.lines.set(lines);
  }

  addLine(): void {
    this.lines.update(ls => [...ls, { description: '', qty: null, unit: this.selectedItem()?.unit || '' }]);
  }

  removeLine(i: number): void {
    this.lines.update(ls => ls.filter((_, idx) => idx !== i));
  }

  toggleOption(label: string, checked: boolean): void {
    this.chosenOptions.update(m => ({ ...m, [label]: checked }));
  }

  buildNote(): string {
    const item = this.selectedItem();
    const parts: string[] = [];
    if (item) {
      for (const opt of item.textOptions || []) {
        if (opt.kind !== 'FREE' && this.chosenOptions()[opt.label] && opt.text) parts.push(opt.text);
      }
    }
    const free = this.freeNote().trim();
    if (free) parts.push(free);
    return parts.join('\n');
  }

  canSend(): boolean {
    const item = this.selectedItem();
    if (!item || !item.active || !item.contactEmail) return false;
    return this.lines().some(l => (l.description || '').trim() && l.qty != null);
  }

  async sendOrder(): Promise<void> {
    const item = this.selectedItem();
    if (!item) {
      this.error.set('Select an item to order.');
      return;
    }
    const lines = this.lines().filter(l => (l.description || '').trim() && l.qty != null);
    if (!lines.length) {
      this.error.set('Add at least one line with a description and quantity.');
      return;
    }
    if (!item.contactEmail) {
      this.error.set('No vendor email is set for ' + item.displayName + '.');
      return;
    }
    if (!confirm(`Send this order to ${item.contactEmail}${item.ccEmails ? ' (cc ' + item.ccEmails + ')' : ''}?`)) return;

    this.sending.set(true);
    this.error.set('');
    this.toast.set('');
    try {
      const req: PlaceOrderRequest = {
        itemKey: item.itemKey,
        orderedBy: this.orderedBy().trim() || undefined,
        note: this.buildNote() || undefined,
        sourceSuggestionId: this.sourceSuggestionId() || undefined,
        lines,
      };
      const rec = await firstValueFrom(this.api.placeOrder(req));
      this.toast.set(
        rec.emailSent
          ? `Order sent to ${rec.recipient}.`
          : `Order recorded but the email did not send: ${rec.emailError || 'unknown error'}`,
      );
      const hadSuggestion = !!req.sourceSuggestionId;
      this.resetPlace();
      await this.loadOrders();
      if (hadSuggestion) await this.loadSuggestions();
    } catch (e) {
      this.error.set(this.msg(e));
    } finally {
      this.sending.set(false);
    }
  }

  resetPlace(): void {
    this.selectedItemKey.set('');
    this.lines.set([]);
    this.chosenOptions.set({});
    this.freeNote.set('');
    this.sourceSuggestionId.set('');
  }

  // ── Suggestions ──
  reorderFromSuggestion(s: ReorderSuggestion): void {
    this.tab.set('place');
    this.sourceSuggestionId.set(s.sharepointId || '');
    if (s.catalogItemKey) this.onItemChange(s.catalogItemKey);
  }

  async dismissSuggestion(s: ReorderSuggestion): Promise<void> {
    if (!s.sharepointId) return;
    if (!confirm('Dismiss this reorder suggestion?')) return;
    try {
      await firstValueFrom(this.api.updateSuggestionStatus(s.sharepointId, 'DISMISSED'));
      await this.loadSuggestions();
    } catch (e) {
      this.error.set(this.msg(e));
    }
  }

  // ── Catalog Admin ──
  openEditor = (item: OrderCatalogItem): void => {
    this.editing.set({ ...item, defaultQtyPresets: [...(item.defaultQtyPresets || [])], textOptions: [...(item.textOptions || [])] });
  };

  newItem(): void {
    this.editing.set({
      itemKey: '',
      displayName: '',
      vendor: '',
      active: true,
      defaultQtyPresets: [],
      textOptions: [],
    });
  }

  async saveItem(): Promise<void> {
    const item = this.editing();
    if (!item) return;
    if (!(item.itemKey || '').trim()) {
      this.error.set('itemKey is required (a stable key like "co2").');
      return;
    }
    try {
      await firstValueFrom(this.api.saveCatalogItem(item));
      this.editing.set(null);
      this.toast.set('Catalog item saved.');
      await this.refreshCatalog();
    } catch (e) {
      this.error.set(this.msg(e));
    }
  }

  async deleteItem(): Promise<void> {
    const item = this.editing();
    if (!item || !item.itemKey) return;
    if (!confirm(`Delete catalog item "${item.displayName || item.itemKey}"?`)) return;
    try {
      await firstValueFrom(this.api.deleteCatalogItem(item.itemKey));
      this.editing.set(null);
      await this.refreshCatalog();
    } catch (e) {
      this.error.set(this.msg(e));
    }
  }

  async seed(): Promise<void> {
    if (!confirm('Seed the standard vendor catalog (CO2, Hydrogen, Demin, Diesel/Gasoline)? Existing items are updated, not duplicated.')) return;
    this.loading.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.api.seedCatalog());
      this.toast.set('Catalog seeded.');
      await this.refreshCatalog();
    } catch (e) {
      this.error.set(this.msg(e));
    } finally {
      this.loading.set(false);
    }
  }

  cancelEdit(): void {
    this.editing.set(null);
  }

  private msg(e: unknown): string {
    const err = e as { error?: { message?: string }; message?: string };
    return err?.error?.message || err?.message || 'Request failed.';
  }
}
