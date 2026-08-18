import { Component, computed, inject } from '@angular/core';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import { NavTile, NavTileGridComponent } from '../../shared/menus/nav-tile-grid/nav-tile-grid.component';
import { NavAccessService } from '../../services/nav-access.service';
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

  /**
   * One tile per visible section. A section holding a single destination links straight to it —
   * SectionPageComponent would only redirect anyway.
   */
  readonly tiles = computed<NavTile[]>(() =>
    this.navAccess.visibleSections().map(section => {
      const only = section.items.length === 1 ? section.items[0] : null;
      return {
        label: section.label,
        icon: section.icon,
        description: this.describe(section.items.map(i => i.label)),
        route: only?.route ?? section.route,
        queryParams: only?.queryParams,
        externalUrlKey: only?.route ? undefined : only?.externalUrlKey,
      };
    }));

  /** Registered but awaiting admin approval — say so where the plant tools would be. */
  readonly isPendingApproval = computed(() => this.authService.isPendingApproval());

  /** Sub-section names as the tile's subtitle, so the grid says what's inside without a click. */
  private describe(labels: string[]): string {
    if (labels.length <= 1) return '';
    return labels.length <= 3 ? labels.join(' · ') : `${labels.slice(0, 3).join(' · ')} +${labels.length - 3}`;
  }
}
