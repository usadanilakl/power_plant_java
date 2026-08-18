import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import { ShareLinkComponent } from '../../shared/share-link/share-link.component';

/**
 * Site orientation — what a contractor reaches by scanning the orientation QR at the gate.
 *
 * PUBLIC by design: it is scanned before anyone has an account, and requiring one would put the
 * page behind exactly the barrier it exists to remove.
 *
 * The links live in data/orientation.json, bundled with the app, and that is the ONLY source.
 *
 * They were briefly served by the hub as well, so a link could be changed without redeploying the
 * PWA. That was illusory: the bundled copy still had to be updated in the same breath or a
 * first-time visitor with the hub unreachable got the stale link — two sources of truth for one
 * string, kept in sync by hand. One file, redeployed like any other change, is simpler and cannot
 * disagree with itself.
 *
 * Same origin as the page, so if the page loaded the links loaded. The QR points straight here;
 * nothing about orientation touches the hub.
 */
@Component({
  selector: 'app-orientation-page',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, ShareLinkComponent],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="orientation">
          <h1 class="orientation-title"><span aria-hidden="true">🎓</span> Site Orientation</h1>
          <p class="orientation-sub">
            Everyone working on site completes orientation. Watch the video, then take the short quiz.
          </p>

          <ol class="steps">
            <li class="step">
              <span class="step-num">1</span>
              <div class="step-body">
                <h2>Watch the orientation video</h2>
                <p>About 20 minutes. You can watch it on your phone.</p>
                @if (videoUrl()) {
                  <a class="btn primary" [href]="videoUrl()" target="_blank" rel="noopener">
                    Watch the video ↗
                  </a>
                } @else {
                  <p class="unavailable">Link unavailable — check your connection and reload.</p>
                }
              </div>
            </li>

            <li class="step">
              <span class="step-num">2</span>
              <div class="step-body">
                <h2>Take the quiz</h2>
                <p>Complete it after the video. Your answers are recorded against your name.</p>
                @if (quizUrl()) {
                  <a class="btn" [href]="quizUrl()" target="_blank" rel="noopener">
                    Take the quiz ↗
                  </a>
                } @else {
                  <p class="unavailable">Link unavailable — check your connection and reload.</p>
                }
              </div>
            </li>
          </ol>

          <app-share-link [url]="shareUrl" heading="Send this to someone" shareTitle="Site Orientation">
          </app-share-link>

          <p class="footnote">
            Questions about orientation? See
            <a href="/plant/contacts">Contacts &amp; Information</a>.
          </p>
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }

    .orientation {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
    }

    .orientation-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-text);
      margin: 0 0 0.4rem;
      text-align: center;
    }

    .orientation-sub {
      font-size: 0.95rem;
      color: var(--secondary-text, #888);
      margin: 0 0 1.5rem;
      max-width: 32rem;
      text-align: center;
    }

    .steps {
      list-style: none;
      margin: 0;
      padding: 0;
      width: 100%;
      max-width: 520px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .step {
      display: flex;
      gap: 0.9rem;
      background: var(--card-bg, var(--secondary-background));
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.1rem 1.25rem;
    }

    .step-num {
      flex: none;
      width: 1.9rem;
      height: 1.9rem;
      border-radius: 50%;
      background: var(--accent-color);
      color: var(--header-text);
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .step-body { flex: 1; min-width: 0; }

    .step-body h2 {
      margin: 0 0 0.25rem;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--primary-text);
    }

    .step-body p {
      margin: 0 0 0.9rem;
      font-size: 0.85rem;
      color: var(--secondary-text, #888);
    }

    .btn {
      display: block;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: transparent;
      color: var(--primary-text);
      font-size: 1rem;
      font-weight: 600;
      text-align: center;
      text-decoration: none;
    }

    .btn.primary {
      background: var(--accent-color);
      border-color: var(--accent-color);
      color: var(--header-text);
    }

    .unavailable {
      margin: 0;
      font-size: 0.85rem;
      color: #b26a00;
    }

    .footnote {
      margin: 1.5rem 0 0;
      font-size: 0.85rem;
      color: var(--secondary-text, #888);
    }

    .footnote a, .step-body a.btn { color: inherit; }
    .footnote a { color: var(--accent-color); }
  `]
})
export class OrientationPageComponent {
  private http = inject(HttpClient);

  readonly videoUrl = signal('');
  readonly quizUrl = signal('');

  /**
   * The address to hand out — this page, stripped of any query or fragment. Taken from the live
   * location rather than hardcoded so it is right in every environment, and so it can never drift
   * from whatever the QR posters were generated against.
   */
  readonly shareUrl = window.location.href.split('?')[0].split('#')[0];

  constructor() {
    this.http.get<{ videoUrl?: string; quizUrl?: string }>('data/orientation.json').subscribe({
      next: links => {
        this.videoUrl.set(links?.videoUrl ?? '');
        this.quizUrl.set(links?.quizUrl ?? '');
      },
      // Same-origin and shipped with the app, so this only fails if the app itself failed to load.
      error: () => { /* the template shows its unavailable state */ },
    });
  }
}
