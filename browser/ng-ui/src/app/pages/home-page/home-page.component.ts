import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import { AuthService } from '../../auth/auth.service';

interface HomeCard {
  title: string;
  description: string;
  icon: string;
  route: string;
}

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
          <div class="card-grid">
            @for (card of allCards; track card.route) {
              <button class="home-card" (click)="navigate(card.route)">
                <span class="card-icon">{{ card.icon }}</span>
                <span class="card-title">{{ card.title }}</span>
                <span class="card-desc">{{ card.description }}</span>
              </button>
            }
          </div>
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
      margin: 0 0 2rem;
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

  cards: HomeCard[] = [
    {
      title: 'Work Request',
      description: 'Submit and manage work requests',
      icon: '📋',
      route: '/work-request'
    },
    {
      title: 'JHA',
      description: 'Job Hazard Analysis forms',
      icon: '⚠️',
      route: '/jha'
    },
    {
      title: 'Instrumentation',
      description: 'Instrument logs and management',
      icon: '🔧',
      route: '/instruments'
    },
    {
      title: 'Field Lists',
      description: 'Track insulation, leaks, winterization',
      icon: '📝',
      route: '/field-lists'
    },
    {
      title: 'Inventory',
      description: 'Track tools and equipment with QR codes',
      icon: '📦',
      route: '/inventory'
    },
    {
      title: 'SDS Chemicals',
      description: 'Record Safety Data Sheet chemicals',
      icon: '🧪',
      route: '/sds'
    },
    {
      title: 'SDS Audit',
      description: 'Audit chemicals by location or alphabetically',
      icon: '✅',
      route: '/sds-audit'
    }
  ];

  get allCards(): HomeCard[] {
    const extra: HomeCard[] = [];
    if (this.authService.isLoggedIn()) {
      extra.push({
        title: 'Messages',
        description: 'Conversations with operators',
        icon: '💬',
        route: '/messages'
      });
      if (this.authService.hasPermission('BASIC')) {
        extra.push({
          title: 'My Permits',
          description: 'View permit status and packages',
          icon: '🛡️',
          route: '/my-permits'
        });
      }
    }
    return [...this.cards, ...extra];
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }
}
