import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import { NavTile, NavTileGridComponent } from '../../shared/menus/nav-tile-grid/nav-tile-grid.component';
import { NavAccessService } from '../../services/nav-access.service';

/**
 * The landing page for every section — one component, parameterised by slug.
 *
 * A section page is "the visible items of this section, as tiles". Ten near-identical components
 * would be ten places to forget an access rule, so this reads NavAccessService like the menus do.
 */
@Component({
  selector: 'app-section-page',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, NavTileGridComponent],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="section-container">
          @if (section(); as sec) {
            <h1 class="section-title"><span aria-hidden="true">{{ sec.icon }}</span> {{ sec.label }}</h1>
            <app-nav-tile-grid [tiles]="tiles()"></app-nav-tile-grid>
          } @else {
            <!-- Reachable by typing a URL, or after signing out of the role that revealed it. -->
            <h1 class="section-title">Not available</h1>
            <p class="section-note">
              This section isn't available for your account, or needs the server to be reachable.
            </p>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }

    .section-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-text);
      margin: 0 0 1.25rem;
      text-align: center;
    }

    .section-note {
      font-size: 0.9rem;
      color: var(--secondary-text, #888);
      max-width: 32rem;
      text-align: center;
    }
  `]
})
export class SectionPageComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private navAccess = inject(NavAccessService);

  private slug = toSignal(this.route.paramMap.pipe(map(params => params.get('slug') ?? '')),
    { initialValue: '' });

  readonly section = computed(() => this.navAccess.sectionBySlug(this.slug()));

  readonly tiles = computed<NavTile[]>(() =>
    (this.section()?.items ?? []).map(NavTileGridComponent.fromEntry));

  constructor() {
    // A section holding exactly one destination has nothing to choose between — go straight there
    // rather than showing a page with a single tile on it.
    const sec = this.navAccess.sectionBySlug(this.route.snapshot.paramMap.get('slug') ?? '');
    const only = sec?.items.length === 1 ? sec.items[0] : null;
    if (only?.route) {
      this.router.navigate([only.route], { queryParams: only.queryParams, replaceUrl: true });
    }
  }
}
