import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PwaContractor, ServerApiService } from '../../services/server-api.service';

/** What we keep on the device between visits. */
const CACHE_KEY = 'pwaContractorDirectory';

interface CachedDirectory {
  fetchedAt: string | null;
  source: string;
  contractors: PwaContractor[];
  /** When THIS device last got a good answer — distinct from the hub's own fetchedAt. */
  cachedAt: string;
}

/**
 * Contractor lookup: contacts and orientation dates, for plant personnel.
 *
 * Offline-first in the same shape as the rest of the app — the cached list renders immediately and a
 * refresh happens behind it. Two timestamps matter and they are not the same thing: when the HUB
 * last reached OnLocation, and when THIS DEVICE last reached the hub. A phone in a turbine hall can
 * be showing a three-day-old copy of a list the hub refreshed an hour ago, and the banner has to say
 * so, because the question being asked is "is this person cleared to work right now".
 */
@Component({
  selector: 'app-contractor-directory',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cd">
      <div class="cd-bar">
        <input class="cd-search" type="search" [(ngModel)]="query" (ngModelChange)="onQuery($event)"
               placeholder="Search name, company, email…" aria-label="Search contractors">
        <button type="button" class="cd-refresh" (click)="refresh(true)" [disabled]="loading()"
                aria-label="Refresh contractor list from OnLocation" title="Refresh from OnLocation">
          {{ loading() ? '…' : '↻' }}
        </button>
      </div>

      <p class="cd-status" [class.stale]="isStale()" role="status" aria-live="polite">{{ statusText() }}</p>

      @if (!loading() && visible().length === 0) {
        <p class="cd-empty">
          {{ contractors().length ? 'No contractor matches that search.' : 'No contractor list available yet.' }}
        </p>
      }

      <ul class="cd-list">
        @for (c of visible(); track c.onLocationMemberId ?? c.name) {
          <li class="cd-card">
            <div class="cd-head">
              <span class="cd-name">{{ c.name }}</span>
              @if (orientationState(c); as state) {
                <span class="cd-badge" [class]="'badge-' + state.kind">{{ state.label }}</span>
              }
            </div>

            @if (c.company || c.title) {
              <div class="cd-org">{{ c.company }}@if (c.company && c.title) {<span> · </span>}{{ c.title }}</div>
            }

            <div class="cd-contact">
              @if (c.phone) { <a [href]="'tel:' + c.phone">{{ c.phone }}</a> }
              @if (c.email) { <a [href]="'mailto:' + c.email">{{ c.email }}</a> }
              @if (!c.phone && !c.email) { <span class="cd-none">No contact details</span> }
            </div>

            <div class="cd-dates">
              Orientation:
              <strong>{{ c.validFrom || '—' }}</strong> to <strong>{{ c.validTo || '—' }}</strong>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
  styles: [`
    .cd { display: flex; flex-direction: column; gap: 0.6rem; }

    .cd-bar { display: flex; gap: 0.5rem; }

    .cd-search {
      flex: 1;
      padding: 0.65rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--primary-background);
      color: var(--primary-text);
      font-family: inherit;
      font-size: 1rem;
    }

    .cd-refresh {
      flex: none;
      width: 2.9rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: transparent;
      color: var(--primary-text);
      font-size: 1.1rem;
      cursor: pointer;
    }

    .cd-status { margin: 0; font-size: 0.78rem; color: var(--secondary-text, #888); }
    .cd-status.stale { color: #b26a00; font-weight: 600; }

    .cd-empty { margin: 0.5rem 0; font-size: 0.9rem; color: var(--secondary-text, #888); }

    .cd-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }

    .cd-card {
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 0.75rem 0.9rem;
      background: var(--card-bg, var(--secondary-background));
    }

    .cd-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }

    .cd-name { font-weight: 700; color: var(--primary-text); }

    .cd-badge {
      flex: none;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-radius: 999px;
      padding: 0.15rem 0.5rem;
      white-space: nowrap;
    }

    .badge-expired { background: #f8d7da; color: #a61b2b; }
    .badge-soon { background: #ffe6b3; color: #b26a00; }
    .badge-ok { background: #d7f2dd; color: #1c7a3a; }

    .cd-org { font-size: 0.85rem; color: var(--secondary-text, #888); margin-top: 0.15rem; }

    .cd-contact { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.45rem; font-size: 0.88rem; }
    .cd-contact a { color: var(--accent-color); }
    .cd-none { color: var(--secondary-text, #888); }

    .cd-dates { margin-top: 0.45rem; font-size: 0.82rem; color: var(--secondary-text, #888); }
  `]
})
export class ContractorDirectoryComponent {
  private serverApi = inject(ServerApiService);

  /** Anything older than this is called out rather than shown as if it were current. */
  private static readonly STALE_AFTER_MS = 24 * 60 * 60 * 1000;

  query = '';

  readonly contractors = signal<PwaContractor[]>([]);
  readonly loading = signal(false);
  /** When the HUB last reached OnLocation. */
  readonly fetchedAt = signal<string | null>(null);
  readonly source = signal('');
  /** When THIS DEVICE last got a good answer from the hub. */
  readonly cachedAt = signal<string | null>(null);
  readonly refreshFailed = signal(false);

  private readonly queryTerm = signal('');

  readonly visible = computed(() => {
    const q = this.queryTerm().trim().toLowerCase();
    const all = this.contractors();
    if (!q) return all;
    return all.filter(c =>
      [c.name, c.company, c.email, c.title].some(v => v?.toLowerCase().includes(q)));
  });

  readonly isStale = computed(() => {
    if (this.refreshFailed()) return true;
    const stamp = this.fetchedAt() ?? this.cachedAt();
    if (!stamp) return true;
    return Date.now() - new Date(stamp).getTime() > ContractorDirectoryComponent.STALE_AFTER_MS;
  });

  readonly statusText = computed(() => {
    if (this.loading() && !this.contractors().length) return 'Loading contractors…';
    if (!this.contractors().length) return '';

    const count = `${this.contractors().length} contractors`;
    const age = this.ageText(this.fetchedAt());

    if (this.refreshFailed()) {
      // Be explicit that this is a saved copy — the user is deciding site access on it.
      const own = this.ageText(this.cachedAt());
      return `${count} · offline — saved copy${own ? ' from ' + own : ''}`;
    }
    if (this.source() === 'LOCAL_RECORDS') {
      return `${count} · from local records${age ? ', ' + age : ''} — not confirmed against OnLocation`;
    }
    return age ? `${count} · updated ${age}` : count;
  });

  constructor() {
    this.restoreCache();
    this.refresh();
  }

  onQuery(value: string): void {
    this.queryTerm.set(value ?? '');
  }

  /**
   * @param fromSource true when the user pressed refresh — asks the hub to pull OnLocation again
   *        rather than re-reading its cache, which is what makes the button mean something. The
   *        initial page load stays a plain read so opening the tab never triggers an external call.
   */
  refresh(fromSource = false): void {
    this.loading.set(true);
    const request = fromSource ? this.serverApi.refreshContractors() : this.serverApi.getContractors();
    request.subscribe({
      next: directory => {
        this.loading.set(false);
        this.refreshFailed.set(false);
        this.contractors.set(directory.contractors ?? []);
        this.fetchedAt.set(directory.fetchedAt);
        this.source.set(directory.source ?? '');
        this.cachedAt.set(new Date().toISOString());
        this.cache(directory.contractors ?? [], directory.fetchedAt, directory.source);
      },
      error: () => {
        this.loading.set(false);
        // Keep whatever the cache gave us; only the banner changes.
        this.refreshFailed.set(true);
      },
    });
  }

  /** Expired / expiring / current, from validTo. Undated contractors get no badge rather than a guess. */
  orientationState(c: PwaContractor): { kind: 'expired' | 'soon' | 'ok'; label: string } | null {
    if (!c.validTo) return null;
    const expiry = new Date(c.validTo).getTime();
    if (Number.isNaN(expiry)) return null;
    const days = Math.floor((expiry - Date.now()) / 86_400_000);
    if (days < 0) return { kind: 'expired', label: 'Expired' };
    if (days <= 30) return { kind: 'soon', label: `${days}d left` };
    return { kind: 'ok', label: 'Current' };
  }

  private ageText(iso: string | null): string {
    if (!iso) return '';
    const ms = Date.now() - new Date(iso).getTime();
    if (Number.isNaN(ms)) return '';
    const mins = Math.floor(ms / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} h ago`;
    return `${Math.floor(hours / 24)} d ago`;
  }

  private restoreCache(): void {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const cached: CachedDirectory = JSON.parse(raw);
      this.contractors.set(cached.contractors ?? []);
      this.fetchedAt.set(cached.fetchedAt ?? null);
      this.source.set(cached.source ?? '');
      this.cachedAt.set(cached.cachedAt ?? null);
    } catch {
      // Corrupt storage — the refresh below repopulates.
    }
  }

  private cache(contractors: PwaContractor[], fetchedAt: string | null, source: string): void {
    try {
      const payload: CachedDirectory = { contractors, fetchedAt, source, cachedAt: new Date().toISOString() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
      // Quota / private mode — this session still works, the next one just starts empty.
    }
  }
}
