import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { OrderingService } from '../services/ordering.service';
import {
  OrderCatalogItem,
  OrderLine,
  OrderPreset,
  OrderPreview,
  OrderRecord,
  PlaceOrderRequest,
  ReorderSuggestion,
} from '../models/ordering.model';

type Tab = 'place' | 'history' | 'suggestions' | 'catalog';

interface FillTank { key: string; label: string; capacity: number | null; level: number | null; needed: number | null; }
interface FillGroup { product: string; tanks: FillTank[]; total: number; }

@Component({
  selector: 'app-ordering-workbench',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
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

  isFill(): boolean {
    return this.selectedItem()?.orderMode === 'FILL';
  }

  // FILL-mode current levels, keyed by equipment label.
  levels = signal<Record<string, number | null>>({});

  setLevel(key: string, v: number | null): void {
    this.levels.update(m => ({ ...m, [key]: v }));
    this.preview.set(null);
  }

  /** FILL: tanks grouped by product, with per-tank needed (capacity − level) and a per-product total.
   *  Keyed by preset INDEX (not label) so two tanks that share a label never collide. The entered level is
   *  clamped to [0, capacity] for the calc so a negative or over-full entry can't distort the order total. */
  readonly fillGroups = computed<FillGroup[]>(() => {
    const item = this.selectedItem();
    if (!item || item.orderMode !== 'FILL') return [];
    const lv = this.levels();
    const groups = new Map<string, FillGroup>();
    (item.defaultQtyPresets || []).forEach((p, idx) => {
      const key = String(idx);
      const product = p.product || 'Product';
      const capacity = p.capacity ?? null;
      const raw = lv[key] ?? null;
      const clamped = raw == null ? null : Math.max(0, capacity != null ? Math.min(capacity, raw) : raw);
      const needed = capacity != null && clamped != null ? Math.max(0, capacity - clamped) : null;
      let g = groups.get(product);
      if (!g) { g = { product, tanks: [], total: 0 }; groups.set(product, g); }
      g.tanks.push({ key, label: p.label, capacity, level: raw, needed });
      if (needed != null) g.total += needed;
    });
    return Array.from(groups.values());
  });

  private fillLines(): OrderLine[] {
    const unit = this.selectedItem()?.unit || '';
    return this.fillGroups()
      .filter(g => g.total > 0)
      .map(g => ({ description: g.product, qty: g.total, unit }));
  }

  private orderLines(): OrderLine[] {
    return this.isFill()
      ? this.fillLines()
      : this.lines().filter(l => (l.description || '').trim() && l.qty != null);
  }

  // ── Catalog Admin state ──
  editing = signal<OrderCatalogItem | null>(null);

  // ── Preview + test-send state ──
  preview = signal<OrderPreview | null>(null);
  previewing = signal(false);
  testMode = signal(false);
  testRecipient = signal('');
  testCc = signal('');

  fmtDate(s?: string): string {
    return (s || '').replace('T', ' ').slice(0, 16);
  }

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
    this.preview.set(null);
    this.levels.set({});
    this.sourceSuggestionId.set('');
    const item = this.catalog().find(c => c.itemKey === key);
    this.lines.set([{ description: '', qty: null, unit: item?.unit || '' }]);
  }

  addLine(): void {
    this.lines.update(ls => [...ls, { description: '', qty: null, unit: this.selectedItem()?.unit || '' }]);
    this.preview.set(null);
  }

  /** Quick-add a preset as a new order line (keeps large catalogs like lab reagents manageable). */
  addPreset(p: OrderPreset): void {
    this.lines.update(ls => [...ls, { description: p.label, qty: p.defaultQty ?? null, unit: this.selectedItem()?.unit || '' }]);
    this.preview.set(null);
  }

  removeLine(i: number): void {
    this.lines.update(ls => ls.filter((_, idx) => idx !== i));
    this.preview.set(null);
  }

  toggleOption(label: string, checked: boolean): void {
    this.chosenOptions.update(m => ({ ...m, [label]: checked }));
    this.preview.set(null);
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
    if (!item) return false;
    if (!this.orderLines().length) return false;
    if (this.testMode()) return !!this.testRecipient().trim();
    return item.active && !!item.contactEmail;
  }

  onToggleTest(v: boolean): void {
    this.testMode.set(v);
    this.preview.set(null);
  }

  private buildPlaceReq(): PlaceOrderRequest {
    const item = this.selectedItem()!;
    const test = this.testMode();
    return {
      itemKey: item.itemKey,
      orderedBy: this.orderedBy().trim() || undefined,
      note: this.buildNote() || undefined,
      sourceSuggestionId: test ? undefined : (this.sourceSuggestionId() || undefined),
      lines: this.orderLines(),
      testMode: test,
      testRecipient: test ? (this.testRecipient().trim() || undefined) : undefined,
      testCc: test ? (this.testCc().trim() || undefined) : undefined,
    };
  }

  async doPreview(): Promise<void> {
    const item = this.selectedItem();
    if (!item) { this.error.set('Select an item first.'); return; }
    this.previewing.set(true);
    this.error.set('');
    try {
      this.preview.set(await firstValueFrom(this.api.previewOrder(this.buildPlaceReq())));
    } catch (e) {
      this.error.set(this.msg(e));
    } finally {
      this.previewing.set(false);
    }
  }

  async sendOrder(): Promise<void> {
    const item = this.selectedItem();
    if (!item) { this.error.set('Select an item to order.'); return; }
    const lines = this.orderLines();
    if (!lines.length) {
      this.error.set(this.isFill()
        ? 'Enter current levels — nothing needs ordering yet.'
        : 'Add at least one line with a description and quantity.');
      return;
    }

    const test = this.testMode();
    const target = test ? this.testRecipient().trim() : item.contactEmail;
    if (test && !target) { this.error.set('Provide a test recipient email.'); return; }
    if (!test && !item.contactEmail) { this.error.set('No vendor email is set for ' + item.displayName + '.'); return; }
    const ccText = test ? this.testCc().trim() : (item.ccEmails || '');
    if (!confirm(`${test ? 'Send a TEST copy' : 'Send this order'} to ${target}${ccText ? ' (cc ' + ccText + ')' : ''}?`)) return;

    this.sending.set(true);
    this.error.set('');
    this.toast.set('');
    try {
      const req = this.buildPlaceReq();
      const rec = await firstValueFrom(this.api.placeOrder(req));
      this.toast.set(
        rec.emailSent
          ? (test ? `Test email sent to ${rec.recipient}.` : `Order sent to ${rec.recipient}.`)
          : `Email did not send: ${rec.emailError || 'unknown error'}`,
      );
      this.preview.set(null);
      if (!test && rec.emailSent) {
        const hadSuggestion = !!req.sourceSuggestionId;
        this.resetPlace();
        await this.loadOrders();
        if (hadSuggestion) await this.loadSuggestions();
      }
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
    this.preview.set(null);
    this.levels.set({});
  }

  // ── Suggestions ──
  reorderFromSuggestion(s: ReorderSuggestion): void {
    this.tab.set('place');
    // onItemChange clears sourceSuggestionId, so set it AFTER selecting the item
    if (s.catalogItemKey) this.onItemChange(s.catalogItemKey);
    this.sourceSuggestionId.set(s.sharepointId || '');
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
    this.editing.set({
      ...item,
      defaultQtyPresets: (item.defaultQtyPresets || []).map(p => ({ ...p })),
      textOptions: (item.textOptions || []).map(t => ({ ...t })),
    });
  };

  newItem(): void {
    this.editing.set({
      itemKey: '',
      displayName: '',
      vendor: '',
      active: true,
      orderMode: 'QUANTITY',
      defaultQtyPresets: [],
      textOptions: [],
    });
  }

  addEditPreset(): void {
    const item = this.editing();
    if (!item) return;
    this.editing.set({
      ...item,
      defaultQtyPresets: [...(item.defaultQtyPresets || []), { label: '', defaultQty: null, capacity: null, product: '' }],
    });
  }

  removeEditPreset(i: number): void {
    const item = this.editing();
    if (!item) return;
    this.editing.set({
      ...item,
      defaultQtyPresets: (item.defaultQtyPresets || []).filter((_, idx) => idx !== i),
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
