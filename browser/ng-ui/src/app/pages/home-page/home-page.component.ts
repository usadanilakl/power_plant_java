import { Component, computed, inject } from '@angular/core';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import { NavTile, NavTileGridComponent, NavTilePill } from '../../shared/menus/nav-tile-grid/nav-tile-grid.component';
import { NavAccessService } from '../../services/nav-access.service';
import { NavPreferencesService } from '../../services/nav-preferences.service';
import { AuthService } from '../../auth/auth.service';

/**
 * Home — the section chooser.
 *
 * This page used to carry its own hardcoded card lists (quickSubmitCards, signedInCards,
 * instrumentationCards, insulationCards, plantGroupCards, plantTools) with their own visibility
 * getters: a third copy of the access rules alongside the two menus, and the one that still
 * advertised the retired "no login needed" tier. It now renders whatever NavAccessService says this
 * user can reach, so Home, the bottom nav and the top menu cannot disagree.
 */
@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, NavTileGridComponent],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="home-container">
          <h1 class="home-title">Jackson Generation</h1>
          <p class="home-subtitle">Select a section to get started</p>

          <app-nav-tile-grid [tiles]="tiles()"></app-nav-tile-grid>

          @if (isPendingApproval()) {
            <p class="pending-note">
              <span class="pending-badge">Pending approval</span>
              LOTO, Maximo and the other plant tools unlock once an administrator approves your account.
            </p>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }

    .home-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
    }

    .home-title {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--primary-text);
      margin: 0 0 0.25rem;
    }

    .home-subtitle {
      font-size: 1rem;
      color: var(--secondary-text, #888);
      margin: 0 0 1.5rem;
    }

    .pending-note {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      max-width: 800px;
      font-size: 0.85rem;
      color: var(--secondary-text, #888);
      background: color-mix(in srgb, var(--primary-text, #888) 6%, transparent);
      border: 1px solid color-mix(in srgb, var(--primary-text, #888) 12%, transparent);
      border-radius: 8px;
      padding: 0.7rem 0.9rem;
      margin: 1.5rem 0 0;
    }

    .pending-badge {
      flex: none;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: #b26a00;
      background: #ffe6b3;
      border-radius: 999px;
      padding: 0.15rem 0.55rem;
    }

    @media (max-width: 768px) {
      .home-title { font-size: 1.3rem; }
    }
  `]
})
export class HomePageComponent {
  private navAccess = inject(NavAccessService);
  private authService = inject(AuthService);
  private prefs = inject(NavPreferencesService);

  /**
   * One tile per visible section. A section holding a single destination links straight to it —
   * SectionPageComponent would only redirect anyway.
   */
  readonly tiles = computed<NavTile[]>(() => {
    // Reading pins/order here is what makes Home follow the same arrangement as the bar.
    this.prefs.order();
    const sections = this.prefs.apply(this.navAccess.sectionEntries());
    const byKey = new Map(this.navAccess.visibleSections().map(s => [s.route, s]));

    return sections.map(entry => {
      const section = byKey.get(entry.navKey);
      const items = section?.items ?? [];
      const only = items.length === 1 ? items[0] : null;
      return {
        label: entry.label,
        icon: entry.icon,
        // A single-destination section has nothing to choose between — link straight through.
        route: only?.route ?? entry.route,
        queryParams: only?.queryParams,
        externalUrlKey: only?.route ? undefined : only?.externalUrlKey,
        pills: only ? undefined : this.pillsFor(items, entry.route!),
      };
    });
  });

  /** How many pills a card shows before it starts counting instead. */
  private static readonly PILL_LIMIT = 4;

  /**
   * Sub-sections as tappable pills, capped so a card stays a card — a wall of pills buries the
   * section name it belongs to.
   *
   * Anything beyond the cap becomes a "+N more" pill onto the section page rather than disappearing.
   * Silently dropping them was the real problem: the card looked complete when it wasn't. Only
   * Permits and Field List overflow today, and only for users holding the roles — pills are already
   * filtered to what the viewer can reach.
   *
   * Deliberately not a horizontal scroller: that hides content behind a swipe nobody knows to try,
   * inside a page that already scrolls the other way, on a device operated with gloves.
   */
  private pillsFor(
    items: { label: string; icon: string; route?: string; queryParams?: Record<string, string> }[],
    sectionRoute: string,
  ): NavTilePill[] {
    const routable = items.filter(i => !!i.route);
    const limit = HomePageComponent.PILL_LIMIT;
    const toPill = (i: typeof routable[number]): NavTilePill =>
      ({ label: i.label, icon: i.icon, route: i.route!, queryParams: i.queryParams });

    if (routable.length <= limit) return routable.map(toPill);

    // Keep one slot for the counter, so the card never claims to show more than it does.
    const shown = routable.slice(0, limit - 1).map(toPill);
    return [...shown, { label: `+${routable.length - (limit - 1)} more`, route: sectionRoute }];
  }

  /** Registered but awaiting admin approval — say so where the plant tools would be. */
  readonly isPendingApproval = computed(() => this.authService.isPendingApproval());


}
