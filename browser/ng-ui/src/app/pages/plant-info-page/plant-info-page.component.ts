import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';

/**
 * Emergency and Contacts & Information — the two contractor-facing plant pages.
 *
 * PUBLIC on purpose. This is safety content, and the failure mode of putting it behind a sign-in (a
 * contractor who can't find the muster point during an evacuation) is worse than the failure mode of
 * leaving it open. Anything here must stay safe to show an anonymous visitor: no equipment layout,
 * no access points, no personal mobile numbers.
 *
 * The content below is PLACEHOLDER, pending the real numbers and names.
 */
@Component({
  selector: 'app-plant-info-page',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, RouterLink],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="info-container">
          <h1 class="info-title">
            <span aria-hidden="true">{{ isEmergency() ? '🚨' : '📇' }}</span>
            {{ isEmergency() ? 'Emergency' : 'Contacts & Information' }}
          </h1>

          <p class="placeholder-banner">
            Placeholder — the real details still need to be filled in.
          </p>

          @if (isEmergency()) {
            <section class="info-card urgent">
              <h2>In an emergency</h2>
              <p class="big">Call <strong>911</strong>, then notify the Control Room.</p>
              <dl>
                <dt>Control Room</dt><dd>TBD</dd>
                <dt>Plant emergency line</dt><dd>TBD</dd>
                <dt>Site address (give this to dispatch)</dt><dd>TBD</dd>
              </dl>
            </section>

            <section class="info-card">
              <h2>If you hear the evacuation alarm</h2>
              <ol>
                <li>Stop work and make your area safe if it is safe to do so.</li>
                <li>Walk — do not run — to your nearest muster point.</li>
                <li>Report to the person taking the head count. Do not leave site until released.</li>
              </ol>
              <p class="note">
                Muster points, AEDs, safety showers and tornado shelters are shown on the
                <a routerLink="/plant/map">Plant Map</a>.
              </p>
            </section>

            <section class="info-card">
              <h2>Severe weather</h2>
              <p>TBD — tornado shelter locations and the shelter-in-place procedure.</p>
            </section>
          } @else {
            <section class="info-card">
              <h2>Who to contact</h2>
              <dl>
                <dt>Control Room</dt><dd>TBD</dd>
                <dt>Site Safety</dt><dd>TBD</dd>
                <dt>Gate / Security</dt><dd>TBD</dd>
                <dt>Maintenance Planner</dt><dd>TBD</dd>
              </dl>
            </section>

            <section class="info-card">
              <h2>Before you start work</h2>
              <ul>
                <li>Sign in at the gate.</li>
                <li>Submit a <a routerLink="/work-request">Work Request</a> and a
                    <a routerLink="/jha">JHA</a> for the job.</li>
                <li>Complete site orientation — TBD: orientation video link.</li>
              </ul>
            </section>

            <section class="info-card">
              <h2>Site information</h2>
              <p>TBD — site hours, parking, PPE requirements, smoking and vehicle rules.</p>
            </section>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }

    .info-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
      gap: 1rem;
    }

    .info-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-text);
      margin: 0;
      text-align: center;
    }

    .placeholder-banner {
      width: 100%;
      max-width: 640px;
      margin: 0;
      padding: 0.55rem 0.8rem;
      border-radius: 8px;
      font-size: 0.8rem;
      text-align: center;
      color: #856404;
      background: rgba(255, 193, 7, 0.12);
      border: 1px solid rgba(255, 193, 7, 0.4);
    }

    .info-card {
      width: 100%;
      max-width: 640px;
      background: var(--card-bg, var(--secondary-background));
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.1rem 1.25rem;
      color: var(--primary-text);
    }

    .info-card.urgent { border-color: #dc3545; }

    .info-card h2 {
      margin: 0 0 0.6rem;
      font-size: 1.05rem;
      font-weight: 700;
    }

    .big { font-size: 1.15rem; margin: 0 0 0.75rem; }

    dl { display: grid; grid-template-columns: auto 1fr; gap: 0.35rem 1rem; margin: 0; }
    dt { font-weight: 600; color: var(--secondary-text, #888); }
    dd { margin: 0; }

    ol, ul { margin: 0; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.35rem; }

    .note { margin: 0.75rem 0 0; font-size: 0.85rem; color: var(--secondary-text, #888); }

    a { color: var(--accent-color); }
  `]
})
export class PlantInfoPageComponent {
  private route = inject(ActivatedRoute);

  /** One component for both pages — they differ only in content. */
  private page = toSignal(this.route.data.pipe(map(data => data['page'] as string)), { initialValue: '' });

  readonly isEmergency = computed(() => this.page() === 'emergency');
}
