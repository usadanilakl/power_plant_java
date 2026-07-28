import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoDetailDialogComponent } from '../maximo-detail-dialog/maximo-detail-dialog.component';
import { MaximoLocationTreePickerComponent } from '../maximo-location-tree-picker/maximo-location-tree-picker.component';
import {
  MaximoInventoryItem,
  MaximoLocation,
  MaximoWorkOrder,
  MaximoWorkType,
  PartsCheckoutResult
} from '../../../models/maximo/maximo.models';

/** A checkout the user submitted on this device — kept in localStorage so it survives reloads. */
interface RecentCheckout {
  wonum: string;
  href: string;
  status: string;
  actmatcost: number | null;
  location: string;
  description: string;
  at: string; // ISO timestamp
}

interface CheckoutLine {
  itemnum: string;
  description: string;
  issueunit: string;
  curbal: number | null;
  quantity: number;
  storeroom: string;   // the picked line's warehouse — issued from exactly this storeroom
  status?: string;     // ACTIVE / OBSOLETE at that storeroom
  verifying?: boolean; // re-reading the real balance/status from Maximo right now
}

/**
 * Standalone "Parts Checkout" page. Drives the Maximo flow end-to-end:
 *   create WO → set location/description/worktype → approve → issue material lines → complete.
 * One server call (POST /ng/maximo/parts-checkout) does the whole flow.
 */
@Component({
  selector: 'app-maximo-parts-checkout-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, MaximoDetailDialogComponent, MaximoLocationTreePickerComponent],
  templateUrl: './maximo-parts-checkout-page.component.html',
  styleUrl: './maximo-parts-checkout-page.component.css'
})
export class MaximoPartsCheckoutPageComponent {
  private api = inject(MaximoApiService);

  // form state
  description = '';
  worktype = 'CM';
  workTypes = signal<MaximoWorkType[]>([]);

  // location picker
  locQuery = '';
  locResults = signal<MaximoLocation[]>([]);
  locSearching = signal(false);
  selectedLocation = signal<MaximoLocation | null>(null);
  /** Escape hatch: swap the plant-tree location picker for the typed search (codes not yet seeded). Tree is primary. */
  manualLocationEntry = signal(false);

  // inventory picker
  itemQuery = '';
  itemResults = signal<MaximoInventoryItem[]>([]);
  itemSearching = signal(false);
  /** True while the server is still building its inventory catalog — searches can't match anything yet. */
  catalogWarming = signal(false);

  // chosen lines
  lines = signal<CheckoutLine[]>([]);

  // submit
  submitting = signal(false);
  error = signal<string | null>(null);
  result = signal<PartsCheckoutResult | null>(null);

  // recent checkouts (this device) + the WO dialog opened from them
  recentCheckouts = signal<RecentCheckout[]>([]);
  selectedWo = signal<MaximoWorkOrder | null>(null);
  private static readonly RECENT_KEY = 'maximo.recentCheckouts';
  private static readonly RECENT_MAX = 15;

  // debounce timers for search-as-you-type
  private locTimer: ReturnType<typeof setTimeout> | null = null;
  private itemTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly DEBOUNCE_MS = 300;
  private static readonly MIN_CHARS = 2;

  private route = inject(ActivatedRoute);
  private destroyed = false;

  private static readonly CATALOG_POLL_MS = 3000;
  private static readonly CATALOG_POLL_TIMEOUT_MS = 5 * 60 * 1000;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.destroyed = true);
    this.loadWorkTypes();
    this.loadRecent();
    this.watchCatalog();
    this.seedFromQuery();
  }

  /**
   * The server keeps its inventory catalog in memory and mirrors it to a disk snapshot, so it is normally
   * ready the instant the page opens. Only a first-ever run has to build it (~100s of Maximo paging), and a
   * search before then would silently return nothing — so poll until it's ready and say so in the UI.
   * Asking for the status also tells the server to start building.
   */
  private async watchCatalog() {
    const deadline = Date.now() + MaximoPartsCheckoutPageComponent.CATALOG_POLL_TIMEOUT_MS;
    while (!this.destroyed && Date.now() < deadline) {
      try {
        const status = await firstValueFrom(this.api.getInventoryCatalogStatus());
        if (status.ready) break;
      } catch {
        break;   // non-fatal: searching still works, it just can't report progress
      }
      this.catalogWarming.set(true);
      await new Promise(r => setTimeout(r, MaximoPartsCheckoutPageComponent.CATALOG_POLL_MS));
    }
    this.catalogWarming.set(false);
  }

  /** When arriving from the Inventory page (?item=…), pre-add that item to the checkout lines. */
  private async seedFromQuery() {
    const itemnum = this.route.snapshot.queryParamMap.get('item');
    if (!itemnum) return;
    try {
      const items = await firstValueFrom(this.api.searchInventory(itemnum, 10));
      const match = items.find(i => i.itemnum === itemnum) ?? items[0];
      if (match) this.addLine(match);
    } catch { /* ignore — user can search manually */ }
  }

  // ── Recent checkouts (localStorage) ────────────────────────────────────────
  private loadRecent() {
    try {
      const raw = localStorage.getItem(MaximoPartsCheckoutPageComponent.RECENT_KEY);
      if (raw) this.recentCheckouts.set(JSON.parse(raw));
    } catch { /* ignore corrupt/blocked storage */ }
  }

  private pushRecent(rec: RecentCheckout) {
    const list = [rec, ...this.recentCheckouts().filter(r => r.href !== rec.href)]
      .slice(0, MaximoPartsCheckoutPageComponent.RECENT_MAX);
    this.recentCheckouts.set(list);
    try {
      localStorage.setItem(MaximoPartsCheckoutPageComponent.RECENT_KEY, JSON.stringify(list));
    } catch { /* ignore */ }
  }

  /** Open a recent WO in the detail dialog (Materials tab supports return + issue). */
  async openRecent(rec: RecentCheckout) {
    try {
      const wo = await firstValueFrom(this.api.getWorkOrder(rec.href));
      this.selectedWo.set(wo ?? this.minimalWo(rec));
    } catch {
      this.selectedWo.set(this.minimalWo(rec));
    }
  }

  closeWoDialog() { this.selectedWo.set(null); }

  private minimalWo(rec: RecentCheckout): MaximoWorkOrder {
    return {
      href: rec.href, wonum: rec.wonum, description: rec.description, longDescription: '',
      status: rec.status, worktype: '', assetnum: '', location: rec.location, siteid: '',
      reportdate: '', targetStart: '', targetFinish: '', schedstart: '', schedfinish: '', leadCraft: '',
      supervisor: '', reportedby: '', priority: '', pmnum: ''
    };
  }

  /** Debounced location search — fires as the user types (≥2 chars). */
  onLocQueryChange() {
    if (this.locTimer) clearTimeout(this.locTimer);
    const q = this.locQuery.trim();
    if (q.length < MaximoPartsCheckoutPageComponent.MIN_CHARS) { this.locResults.set([]); return; }
    this.locTimer = setTimeout(() => this.searchLocations(),
      MaximoPartsCheckoutPageComponent.DEBOUNCE_MS);
  }

  /** Debounced inventory search — fires as the user types (≥2 chars). */
  onItemQueryChange() {
    if (this.itemTimer) clearTimeout(this.itemTimer);
    const q = this.itemQuery.trim();
    if (q.length < MaximoPartsCheckoutPageComponent.MIN_CHARS) { this.itemResults.set([]); return; }
    this.itemTimer = setTimeout(() => this.searchItems(),
      MaximoPartsCheckoutPageComponent.DEBOUNCE_MS);
  }

  private async loadWorkTypes() {
    try {
      const types = await firstValueFrom(this.api.getWorkTypes());
      this.workTypes.set(types);
      if (types.length && !types.some(t => t.value === this.worktype)) this.worktype = types[0].value;
    } catch {
      // non-fatal — the select just stays with the default CM
    }
  }

  // ── Location ──────────────────────────────────────────────────────────────
  async searchLocations() {
    this.locSearching.set(true);
    this.error.set(null);
    try {
      this.locResults.set(await firstValueFrom(this.api.searchLocations(this.locQuery.trim())));
    } catch (e: any) {
      this.error.set(this.msg(e));
    } finally {
      this.locSearching.set(false);
    }
  }

  pickLocation(l: MaximoLocation) {
    if (this.locTimer) { clearTimeout(this.locTimer); this.locTimer = null; }
    this.selectedLocation.set(l);
    this.locResults.set([]);
    this.locQuery = '';
  }

  /**
   * A location chosen from the plant tree. The tree emits only the code, so build a minimal MaximoLocation
   * around it — checkout() only reads loc.location, and canSubmit only checks that a location exists, so a
   * blank description is fine. Keep locQuery in sync so switching to the typed fallback pre-fills the code.
   */
  onTreeLocation(code: string) {
    if (!code) { this.clearLocation(); return; }
    this.selectedLocation.set({ href: '', location: code, description: '', type: '', status: '', siteid: '' });
    this.locResults.set([]);
    this.locQuery = code;
  }

  clearLocation() { this.selectedLocation.set(null); }

  // ── Inventory ─────────────────────────────────────────────────────────────
  async searchItems() {
    this.itemSearching.set(true);
    this.error.set(null);
    try {
      this.itemResults.set(await firstValueFrom(this.api.searchInventory(this.itemQuery.trim())));
    } catch (e: any) {
      this.error.set(this.msg(e));
    } finally {
      this.itemSearching.set(false);
    }
  }

  async addLine(item: MaximoInventoryItem) {
    // Key by itemnum + storeroom: the same itemnum in a different warehouse is a distinct line (and may have
    // a different status), so both can be added and each is issued from its own storeroom.
    if (this.lines().some(l => l.itemnum === item.itemnum && l.storeroom === item.storeroom)) return;
    const line: CheckoutLine = {
      itemnum: item.itemnum,
      description: item.description,
      issueunit: item.issueunit,
      curbal: item.curbal,
      quantity: 1,
      storeroom: item.storeroom,
      status: item.status,
      verifying: true
    };
    this.lines.update(ls => [...ls, line]);
    await this.verifyLineStock(line);
  }

  /**
   * Search results come from the server's cached catalog, whose balance is only as fresh as its last full
   * rebuild — Maximo's INVENTORY table has no change timestamp, so a balance change is invisible to the
   * incremental refresh. The moment a part is actually chosen, re-read its true on-hand and status live.
   */
  private async verifyLineStock(line: CheckoutLine) {
    try {
      const stock = await firstValueFrom(this.api.getInventoryItem(line.itemnum, line.storeroom));
      if (stock) this.patchLine(line, { curbal: stock.curbal, status: stock.status });
    } catch {
      // keep the cached balance — Maximo re-validates the real one at issue time anyway
    } finally {
      this.patchLine(line, { verifying: false });
    }
  }

  private patchLine(line: CheckoutLine, patch: Partial<CheckoutLine>) {
    this.lines.update(ls => ls.map(l =>
      l.itemnum === line.itemnum && l.storeroom === line.storeroom ? { ...l, ...patch } : l));
  }

  removeLine(line: CheckoutLine) {
    this.lines.update(ls => ls.filter(l => !(l.itemnum === line.itemnum && l.storeroom === line.storeroom)));
  }

  /** An OBSOLETE line at its storeroom can't be issued — warn and block submit. */
  isObsolete(status?: string): boolean {
    return (status ?? '').toUpperCase() === 'OBSOLETE';
  }

  /** True when a line asks for more than is in stock (warn but don't block — Maximo is the authority). */
  overStock(l: CheckoutLine): boolean {
    return l.curbal != null && l.quantity > l.curbal;
  }

  get canSubmit(): boolean {
    return !!this.selectedLocation()
      && this.lines().length > 0
      && this.lines().every(l => l.quantity > 0 && !this.isObsolete(l.status) && !l.verifying)
      && !this.submitting();
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async checkout() {
    const loc = this.selectedLocation();
    if (!loc || !this.canSubmit) return;
    this.submitting.set(true);
    this.error.set(null);
    this.result.set(null);
    try {
      const res = await firstValueFrom(this.api.checkoutParts({
        description: this.description.trim() || undefined,
        location: loc.location,
        worktype: this.worktype || undefined,
        lines: this.lines().map(l => ({ itemnum: l.itemnum, quantity: l.quantity, storeroom: l.storeroom }))
      }));
      this.result.set(res);
      if (res) {
        this.pushRecent({
          wonum: res.wonum, href: res.href, status: res.status, actmatcost: res.actmatcost,
          location: loc.location, description: this.description.trim(), at: new Date().toISOString()
        });
        // reset the form for the next checkout, keep the result banner
        this.lines.set([]);
        this.description = '';
        this.selectedLocation.set(null);
      }
    } catch (e: any) {
      this.error.set(this.msg(e));
    } finally {
      this.submitting.set(false);
    }
  }

  startAnother() { this.result.set(null); }

  private msg(e: any): string {
    return e?.error?.message ?? e?.message ?? String(e);
  }
}
