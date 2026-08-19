import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavEntry, NavAccessService } from '../../../services/nav-access.service';

/** One tile: either a section (drills into its page) or a destination (navigates / opens a link). */
export interface NavTile {
  label: string;
  icon: string;
  description?: string;
  route?: string;
  queryParams?: Record<string, string>;
  /** Set for an external destination whose URL the hub holds. */
  externalUrlKey?: string;
  /**
   * Jump straight to a destination inside this tile. Replaces listing the same names as a text
   * subtitle: the names were already there, they just weren't clickable, so reaching a known
   * destination always cost two taps.
   */
  pills?: NavTilePill[];
}

export interface NavTilePill {
  label: string;
  icon?: string;
  route: string;
  queryParams?: Record<string, string>;
}

/**
 * The tile grid shared by the Home page and every section page.
 *
 * Home renders sections, a section page renders that section's items, and both are the same shape —
 * so they are the same component. The Home page previously carried its own hardcoded card lists,
 * which was a third copy of the access rules alongside the two menus.
 */
@Component({
  selector: 'app-nav-tile-grid',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="tile-grid">
      @for (tile of tiles(); track tile.label) {
        <!-- A card, not a link: pills are anchors, and an anchor cannot legally nest inside one. -->
        <div class="tile">
          @if (tile.route) {
            <a class="tile-main" [routerLink]="tile.route" [queryParams]="tile.queryParams ?? null">
              <span class="tile-icon" aria-hidden="true">{{ tile.icon }}</span>
              <span class="tile-title">{{ tile.label }}</span>
              @if (tile.description) { <span class="tile-desc">{{ tile.description }}</span> }
            </a>
          } @else {
            <button type="button" class="tile-main" (click)="openExternal(tile)">
              <span class="tile-icon" aria-hidden="true">{{ tile.icon }}</span>
              <span class="tile-title">{{ tile.label }} ↗</span>
              @if (tile.description) { <span class="tile-desc">{{ tile.description }}</span> }
            </button>
          }

          @if (tile.pills?.length) {
            <div class="tile-pills">
              @for (pill of tile.pills; track pill.label) {
                <a class="tile-pill" [class.more]="!pill.icon"
                   [routerLink]="pill.route" [queryParams]="pill.queryParams ?? null">
                  @if (pill.icon) { <span aria-hidden="true">{{ pill.icon }}</span> }
                  <span>{{ pill.label }}</span>
                </a>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .tile-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
      width: 100%;
      max-width: 800px;
    }

    .tile {
      display: flex;
      flex-direction: column;
      background-color: var(--card-bg, var(--secondary-background));
      border: 1px solid var(--border-color);
      border-radius: 12px;
      min-height: 140px;
      box-shadow: var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
      overflow: hidden;
    }

    .tile:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-color: var(--accent-color);
    }

    .tile:active { transform: translateY(0); }

    /* The card's own target — everything except the pills. */
    .tile-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1.5rem 1rem 1rem;
      background: none;
      border: none;
      cursor: pointer;
      text-decoration: none;
      font-family: inherit;
    }

    .tile-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      padding: 0 0.75rem 0.75rem;
      justify-content: center;
    }

    .tile-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      /* 32px min height: a pill is a real target, not decoration. */
      min-height: 32px;
      padding: 0.3rem 0.65rem;
      border: 1px solid var(--border-color);
      border-radius: 999px;
      background: var(--primary-background);
      color: var(--secondary-text, #888);
      font-size: 0.78rem;
      font-weight: 600;
      text-decoration: none;
      white-space: nowrap;
    }

    .tile-pill:hover { border-color: var(--accent-color); color: var(--primary-text); }

    /* The "+N more" counter reads as a continuation, not another destination. */
    .tile-pill.more { border-style: dashed; }

    .tile-icon { font-size: 2.5rem; }

    .tile-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--primary-text);
      text-align: center;
    }

    .tile-desc {
      font-size: 0.85rem;
      color: var(--secondary-text, #888);
      text-align: center;
    }

    @media (max-width: 768px) {
      .tile-grid { grid-template-columns: 1fr; max-width: 400px; }
      .tile { min-height: 100px; }
      .tile-main { padding: 1.25rem 1rem 0.75rem; }
    }
  `]
})
export class NavTileGridComponent {
  private navAccess = inject(NavAccessService);

  tiles = input.required<NavTile[]>();

  openExternal(tile: NavTile): void {
    const url = tile.externalUrlKey ? this.navAccess.externalUrl(tile.externalUrlKey) : '';
    if (url) window.open(url, '_blank', 'noopener');
  }

  /** Map a nav entry onto a tile. */
  static fromEntry(entry: NavEntry): NavTile {
    return {
      label: entry.label,
      icon: entry.icon,
      route: entry.route,
      queryParams: entry.queryParams,
      externalUrlKey: entry.externalUrlKey,
    };
  }
}
