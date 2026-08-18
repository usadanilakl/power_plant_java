import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { GuestAccessService } from '../../services/guest-access.service';

/**
 * The first screen an unauthenticated visitor sees.
 *
 * Replaces the retired "tier 1" model, where anyone who had typed a name and phone into localStorage
 * was treated as a known user for the rest of the app. Now there are two states — signed in, or not —
 * and this page explains how to move between them.
 *
 * Continuing without an account is deliberately allowed: a contractor needs to submit a Work Request
 * and a JHA, and find the muster point, before anyone has approved them for anything.
 */
@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [MainLayoutComponent, RouterLink],
  template: `
    <app-main-layout [isBottomMenuEnabled]="false" [isSideMenuEnabled]="false">
      <ng-container main-content>
        <div class="welcome">
          <h1 class="welcome-title">Jackson Generation</h1>
          <p class="welcome-sub">Plant applications for staff and contractors</p>

          <section class="panel">
            <h2>Have an account?</h2>
            <p>Sign in with your email or username to reach permits, LOTO, Maximo, rounds and the rest.</p>
            <a class="btn primary" routerLink="/login">Sign In</a>
          </section>

          <section class="panel">
            <h2>New here?</h2>
            <p>
              Create an account with your name, email, phone and company. An administrator approves it
              before plant tools unlock — you can start submitting straight away in the meantime.
            </p>
            <a class="btn" routerLink="/login">Create an Account</a>
          </section>

          <section class="panel muted">
            <h2>Just need to submit something?</h2>
            <p>
              You can continue without an account. You'll be able to submit a Work Request or JHA and
              see plant safety information — everything else needs you signed in.
            </p>
            <button type="button" class="btn ghost" (click)="continueAsGuest()">
              Continue without signing in
            </button>
          </section>
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }

    .welcome {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem 1rem;
    }

    .welcome-title {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--primary-text);
      margin: 0;
    }

    .welcome-sub {
      font-size: 0.95rem;
      color: var(--secondary-text, #888);
      margin: 0 0 0.5rem;
      text-align: center;
    }

    .panel {
      width: 100%;
      max-width: 420px;
      background: var(--card-bg, var(--secondary-background));
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.1rem 1.25rem;
      color: var(--primary-text);
    }

    .panel.muted { background: transparent; }

    .panel h2 { margin: 0 0 0.4rem; font-size: 1.05rem; font-weight: 700; }

    .panel p {
      margin: 0 0 0.9rem;
      font-size: 0.88rem;
      color: var(--secondary-text, #888);
      line-height: 1.4;
    }

    .btn {
      display: block;
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: transparent;
      color: var(--primary-text);
      font-family: inherit;
      font-size: 1rem;
      font-weight: 600;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
    }

    .btn.primary {
      background: var(--accent-color);
      border-color: var(--accent-color);
      color: var(--header-text);
    }

    .btn.ghost { font-weight: 500; color: var(--secondary-text, #888); }
  `]
})
export class WelcomePageComponent {
  private router = inject(Router);
  private guest = inject(GuestAccessService);

  continueAsGuest(): void {
    this.guest.allow();
    this.router.navigate(['/home']);
  }
}
