import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';

interface HomeCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  requires?: string; // permission level required to show this card (e.g. 'BASIC')
}

interface PlantTool {
  title: string;
  description: string;
  icon: string;
  url?: string;   // external — opens the full web app (jgportal) in a new tab
  route?: string; // internal ng-ui route (a built-in mobile screen)
}

/** Base URL of the full desktop web app (served behind the hub, path routing under /angular/browser/). */
const APP_BASE = `${environment.serverUrl}/angular/browser`;

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="home-container">
          <h1 class="home-title">Jackson Generation</h1>
          <p class="home-subtitle">Select an application to get started</p>

          <section class="card-section">
            <h2 class="section-title">Quick Submit</h2>
            <div class="card-grid">
              @for (card of quickSubmitCards; track card.route) {
                <button class="home-card" (click)="navigate(card.route)">
                  <span class="card-icon">{{ card.icon }}</span>
                  <span class="card-title">{{ card.title }}</span>
                  <span class="card-desc">{{ card.description }}</span>
                </button>
              }
            </div>
          </section>

          @if (signedInCards.length) {
            <section class="card-section">
              <h2 class="section-title">Signed In</h2>
              <div class="card-grid">
                @for (card of signedInCards; track card.route) {
                  <button class="home-card" (click)="navigate(card.route)">
                    <span class="card-icon">{{ card.icon }}</span>
                    <span class="card-title">{{ card.title }}</span>
                    <span class="card-desc">{{ card.description }}</span>
                  </button>
                }
              </div>
            </section>
          }

          @if (showPlantTools) {
            <section class="card-section">
              <h2 class="section-title">Plant Tools</h2>
              <div class="card-grid">
                @for (tool of plantTools; track tool.title) {
                  <button class="home-card" (click)="openTool(tool)">
                    <span class="card-icon">{{ tool.icon }}</span>
                    <span class="card-title">{{ tool.title }}{{ tool.route ? '' : ' ↗' }}</span>
                    <span class="card-desc">{{ tool.description }}</span>
                  </button>
                }
              </div>
            </section>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .home-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
      height: 100%;
      overflow-y: auto;
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

    .card-section {
      width: 100%;
      max-width: 800px;
      margin-bottom: 1.75rem;
    }

    .section-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--primary-text);
      margin: 0 0 0.75rem;
      padding-bottom: 0.4rem;
      border-bottom: 1px solid var(--border-color);
      text-align: left;
    }

    .section-note {
      font-size: 0.8rem;
      color: var(--secondary-text, #888);
      margin: -0.4rem 0 0.75rem;
      text-align: left;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
      width: 100%;
      max-width: 800px;
    }

    .home-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem 1rem;
      background-color: var(--card-bg, var(--secondary-background));
      border: 1px solid var(--border-color);
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
      box-shadow: var(--card-shadow, 0 1px 3px rgba(0,0,0,0.1));
      min-height: 140px;
      font-family: inherit;
    }

    .home-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border-color: var(--accent-color);
    }

    .home-card:active {
      transform: translateY(0);
    }

    .card-icon {
      font-size: 2.5rem;
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--primary-text);
      text-align: center;
    }

    .card-desc {
      font-size: 0.85rem;
      color: var(--secondary-text, #888);
      text-align: center;
    }

    @media (max-width: 768px) {
      .home-title {
        font-size: 1.3rem;
      }

      .card-grid {
        grid-template-columns: 1fr;
        max-width: 400px;
      }

      .home-card {
        min-height: 100px;
        padding: 1.25rem 1rem;
      }
    }
  `]
})
export class HomePageComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  /** Tier 1 — no login required (just local basic info). Submission features with offline fallback. */
  quickSubmitCards: HomeCard[] = [
    { title: 'Work Request', description: 'Submit and manage work requests', icon: '📋', route: '/work-request' },
    { title: 'JHA', description: 'Job Hazard Analysis forms', icon: '⚠️', route: '/jha' },
    { title: 'Instrumentation', description: 'Instrument logs and status', icon: '🔧', route: '/instruments' },
    { title: 'Field Lists', description: 'Track insulation, leaks, winterization', icon: '📝', route: '/field-lists' },
    { title: 'Inventory', description: 'Track tools and equipment with QR codes', icon: '📦', route: '/inventory' },
    { title: 'SDS Chemicals', description: 'Record Safety Data Sheet chemicals', icon: '🧪', route: '/sds' }
  ];

  /** Tier 2 — requires sign-in. Server-dependent features. */
  private signedInCardsAll: HomeCard[] = [
    { title: 'SDS Audit', description: 'Audit chemicals by location or alphabetically', icon: '✅', route: '/sds-audit' },
    { title: 'My Permits', description: 'View permit status and packages', icon: '🛡️', route: '/my-permits', requires: 'BASIC' },
    { title: 'Messages', description: 'Conversations with operators', icon: '💬', route: '/messages' }
  ];

  /** Tier 3 — Plant staff only. Opens the full web app (jgportal) in a new tab. */
  plantTools: PlantTool[] = [
    { title: 'Maximo', description: 'Assets, work orders, service requests', icon: '🏭', url: `${APP_BASE}/maximo` },
    { title: 'LOTO', description: 'Lockout/tagout points, boxes, locks', icon: '🔒', url: `${APP_BASE}/loto/loto` },
    { title: 'LOTO Standards', description: 'View, verify, and walk down standards', icon: '📚', route: '/loto-standards' }
  ];

  get signedInCards(): HomeCard[] {
    if (!this.authService.isLoggedIn()) return [];
    return this.signedInCardsAll.filter(c => !c.requires || this.authService.hasPermission(c.requires));
  }

  get showPlantTools(): boolean {
    return this.authService.isLoggedIn() && this.authService.isPlant();
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  openExternal(url: string | undefined): void {
    if (url) window.open(url, '_blank', 'noopener');
  }

  /** Plant tool: internal route navigates in-app; external url opens the full web app in a new tab. */
  openTool(tool: PlantTool): void {
    if (tool.route) { this.navigate(tool.route); }
    else if (tool.url) { this.openExternal(tool.url); }
  }
}
