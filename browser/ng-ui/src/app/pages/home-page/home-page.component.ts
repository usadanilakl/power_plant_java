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

          @if (showPlantGroupCards) {
            <section class="card-section">
              <h2 class="section-title">Personnel</h2>
              <div class="card-grid">
                @for (card of plantGroupCards; track card.route) {
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
          } @else if (isPendingApproval) {
            <section class="card-section">
              <h2 class="section-title">Plant Tools</h2>
              <p class="pending-note">
                <span class="pending-badge">Pending approval</span>
                LOTO, Maximo and other plant tools unlock once an administrator approves your account.
              </p>
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

    .pending-note {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.85rem;
      color: var(--secondary-text, #888);
      background: color-mix(in srgb, var(--primary-text, #888) 6%, transparent);
      border: 1px solid color-mix(in srgb, var(--primary-text, #888) 12%, transparent);
      border-radius: 8px;
      padding: 0.7rem 0.9rem;
      margin: 0;
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

  /**
   * Tier 2b — Plant-affiliated groups only (Admin / Plant / NAES / JPower). Not visible to
   * contractors or unaffiliated users. See {@code project/features/users/communication/pwa-step-5-wiring.md}.
   */
  plantGroupCards: HomeCard[] = [
    { title: 'Personnel', description: 'Shift schedule, contacts, and plant chat', icon: '👥', route: '/personnel' },
  ];

  /** Tier 3 — Plant staff only. Opens the full web app (jgportal) in a new tab. */
  plantTools: PlantTool[] = [
    { title: 'Rounds', description: 'Perform operator rounds, log out-of-range', icon: '🔁', route: '/rounds' },
    { title: 'Maximo', description: 'Work orders, requests, PMs, parts', icon: '🏭', route: '/maximo' },
    { title: 'LOTO', description: 'Hang, verify, and walk down LOTO permits', icon: '🔒', route: '/loto' },
    { title: 'LOTO Standards', description: 'View, verify, and walk down standards', icon: '📚', route: '/loto-standards' },
    { title: 'Qualifications', description: 'Manage personnel qualifications and QR codes', icon: '🏷️', route: '/qualification-management' }
  ];

  get signedInCards(): HomeCard[] {
    if (!this.authService.isLoggedIn()) return [];
    return this.signedInCardsAll.filter(c => !c.requires || this.authService.hasPermission(c.requires));
  }

  get showPlantGroupCards(): boolean {
    return this.authService.isLoggedIn() && this.authService.isPlantGroup();
  }

  get showPlantTools(): boolean {
    return this.authService.isLoggedIn() && this.authService.isPlant();
  }

  /** Registered but awaiting admin approval — show a hint where Plant Tools would be. */
  get isPendingApproval(): boolean {
    return this.authService.isPendingApproval();
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
