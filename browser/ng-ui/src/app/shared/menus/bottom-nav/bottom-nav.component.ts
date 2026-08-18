import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NavPreferencesService } from '../../../services/nav-preferences.service';
import { NavAccessService, NavEntry, VisibleSection } from '../../../services/nav-access.service';

/**
 * Mobile bottom navigation.
 *
 * Replaces the horizontally-scrolling top nav row on phones, and — because it is mounted once in
 * MainLayoutComponent — gives every screen a way out. Previously 14 screens (LOTO, Rounds, the
 * Maximo sub-pages, …) rendered the layout with no nav projected at all, so `/loto` and `/rounds`
 * were dead ends with no menu and no back button.
 *
 * It is a flex sibling of the content area, NOT `position: fixed`. That means it occupies real
 * layout space, so the sticky submit bars inside rounds / LOTO walkdown stack above it instead of
 * being covered by it, and no page needs bottom padding to compensate.
 *
 * The first four visible items become tabs; everything else lives behind "More". To change what is
 * promoted, reorder {@link ITEMS} — the split is purely positional.
 */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bn" role="navigation" aria-label="Main">
      @for (item of primary(); track item.navKey) {
        <a class="bn-tab" [routerLink]="item.route" [queryParams]="item.queryParams ?? null"
           routerLinkActive="active"
           [routerLinkActiveOptions]="{ exact: item.route === '/home' }">
          <span class="bn-icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="bn-label">{{ item.label }}</span>
        </a>
      }
      @if (overflow().length) {
        <button class="bn-tab" type="button" [class.active]="sheetOpen()"
                [attr.aria-expanded]="sheetOpen()" (click)="toggleSheet()">
          <span class="bn-icon" aria-hidden="true">☰</span>
          <span class="bn-label">More</span>
        </button>
      }
    </nav>

    @if (sheetOpen()) {
      <div class="bn-scrim" (click)="closeSheet()"></div>
      <div class="bn-sheet" role="dialog" aria-label="All pages">
        <div class="bn-sheet-grip"></div>

        <div class="bn-sheet-head">
          <span class="bn-sheet-title">{{ editing() ? 'Arrange menu' : 'All pages' }}</span>
          <span class="bn-sheet-head-actions">
            @if (editing() && prefs.isCustomised) {
              <button type="button" class="bn-sheet-btn" (click)="resetOrder()">Reset</button>
            }
            <button type="button" class="bn-sheet-btn primary" (click)="toggleEditing()">
              {{ editing() ? 'Done' : 'Edit' }}
            </button>
          </span>
        </div>

        @if (editing()) {
          <p class="bn-sheet-hint">
            The top {{ tabCount }} appear in the bar. Move items with the arrows.
          </p>
          <ul class="bn-edit-list">
            @for (item of visibleItems(); track item.navKey; let i = $index) {
              @if (i === tabCount) {
                <li class="bn-edit-divider"><span>below this line: in “More”</span></li>
              }
              <li class="bn-edit-row" [class.pinned]="i < tabCount">
                <span class="bn-edit-icon" aria-hidden="true">{{ item.icon }}</span>
                <span class="bn-edit-label">{{ item.label }}</span>
                <button type="button" class="bn-edit-move" [disabled]="i === 0"
                        [attr.aria-label]="'Move ' + item.label + ' up'"
                        (click)="move(item.navKey, -1)">▲</button>
                <button type="button" class="bn-edit-move" [disabled]="i === visibleItems().length - 1"
                        [attr.aria-label]="'Move ' + item.label + ' down'"
                        (click)="move(item.navKey, 1)">▼</button>
              </li>
            }
          </ul>
        } @else {
          @for (group of overflowSections(); track group.label) {
            <h3 class="bn-sheet-section">{{ group.label }}</h3>
            <div class="bn-sheet-grid">
              @for (item of group.items; track item.navKey) {
                @if (item.route) {
                  <a class="bn-sheet-item" [routerLink]="item.route"
                     [queryParams]="item.queryParams ?? null" routerLinkActive="active"
                     (click)="closeSheet()">
                    <span class="bn-sheet-icon" aria-hidden="true">{{ item.icon }}</span>
                    <span>{{ item.label }}</span>
                  </a>
                } @else {
                  <button type="button" class="bn-sheet-item" (click)="openExternal(item)">
                    <span class="bn-sheet-icon" aria-hidden="true">{{ item.icon }}</span>
                    <span>{{ item.label }} ↗</span>
                  </button>
                }
              }
            </div>
          }
          @if (overflowStandalone().length) {
            <div class="bn-sheet-grid">
              @for (item of overflowStandalone(); track item.navKey) {
                <a class="bn-sheet-item" [routerLink]="item.route" routerLinkActive="active"
                   (click)="closeSheet()">
                  <span class="bn-sheet-icon" aria-hidden="true">{{ item.icon }}</span>
                  <span>{{ item.label }}</span>
                </a>
              }
            </div>
          }
        }
      </div>
    }
  `,
  styles: [`
    /* Phones only — desktop keeps the top nav row. */
    :host { display: none; }
    @media (max-width: 768px) { :host { display: block; } }

    .bn {
      display: flex;
      align-items: stretch;
      background: var(--header-background);
      border-top: 1px solid var(--border-color);
      /* Clears the home indicator; viewport-fit=cover lets the bar paint into that strip. */
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }

    .bn-tab {
      flex: 1;
      min-width: 0;
      /* 52px + inset keeps every tab comfortably over the 44px target with gloves on. */
      min-height: var(--bottom-nav-h, 52px);
      /* Containing block for the .active indicator rule. */
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 6px 2px;
      background: none;
      border: none;
      font-family: inherit;
      text-decoration: none;
      color: var(--header-text);
      opacity: 0.7;
    }

    .bn-tab.active { opacity: 1; }

    /* Active tab gets a top rule as well as full opacity — colour alone is not enough outdoors. */
    .bn-tab.active::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 28px;
      height: 3px;
      border-radius: 0 0 3px 3px;
      background: var(--header-text);
    }

    .bn-icon { font-size: 1.25rem; line-height: 1; }

    .bn-label {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bn-scrim {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1400;
    }

    .bn-sheet {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1401;
      background: var(--primary-background);
      border-top: 1px solid var(--border-color);
      border-radius: 16px 16px 0 0;
      padding: 8px 12px calc(12px + env(safe-area-inset-bottom, 0px));
      max-height: 70vh;
      overflow-y: auto;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
    }

    .bn-sheet-grip {
      width: 36px;
      height: 4px;
      border-radius: 999px;
      background: var(--border-color);
      margin: 4px auto 12px;
    }

    .bn-sheet-section {
      margin: 0.9rem 0 0.35rem;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--secondary-text, #888);
    }

    .bn-sheet-section:first-of-type { margin-top: 0.2rem; }

    .bn-sheet-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
      gap: 8px;
    }

    .bn-sheet-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 76px;
      padding: 10px 6px;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background: var(--card-background);
      color: var(--primary-text);
      text-decoration: none;
      font-size: 0.75rem;
      text-align: center;
    }

    .bn-sheet-item.active {
      border-color: var(--accent-color);
      background: var(--selected-background);
      color: var(--selected-text);
    }

    .bn-sheet-icon { font-size: 1.5rem; line-height: 1; }

    /* --- Arrange mode ------------------------------------------------------
       Arrows rather than drag-and-drop: a precise drag is the first thing to
       fail with gloves on, and this list is short enough that stepping is fine. */

    .bn-sheet-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
    }

    .bn-sheet-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--primary-text);
    }

    .bn-sheet-head-actions { display: flex; gap: 8px; }

    .bn-sheet-btn {
      min-height: 40px;
      padding: 6px 14px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--primary-text);
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .bn-sheet-btn.primary {
      background: var(--accent-color);
      border-color: var(--accent-color);
      color: var(--on-solid);
    }

    .bn-sheet-hint {
      margin: 0 0 10px;
      font-size: 0.78rem;
      color: var(--secondary-text);
    }

    .bn-edit-list { list-style: none; margin: 0; padding: 0; }

    .bn-edit-row {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 52px;
      padding: 6px 10px;
      margin-bottom: 6px;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      background: var(--card-background);
    }

    /* Items currently promoted to the bar read as "pinned". */
    .bn-edit-row.pinned {
      border-color: var(--accent-color);
      background: var(--info-bg);
    }

    .bn-edit-icon { font-size: 1.25rem; line-height: 1; flex: none; }

    .bn-edit-label {
      flex: 1;
      min-width: 0;
      font-size: 0.9rem;
      color: var(--primary-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bn-edit-move {
      flex: none;
      width: 44px;
      min-height: 44px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--secondary-background);
      color: var(--primary-text);
      font-size: 0.9rem;
    }

    .bn-edit-move:disabled { opacity: 0.3; }

    .bn-edit-divider {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 12px 0 8px;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text);
    }

    .bn-edit-divider::before,
    .bn-edit-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-color);
    }
  `],
})
export class BottomNavComponent {
  private router = inject(Router);
  private navAccess = inject(NavAccessService);
  readonly prefs = inject(NavPreferencesService);

  /** How many of the ordered items become tabs; the rest fall into "More". */
  readonly tabCount = 4;

  readonly sheetOpen = signal(false);
  readonly editing = signal(false);

  /**
   * Shortcuts this user may see, in their saved order. The list itself — labels, icons, sections and
   * who may see each entry — lives in models/menu/nav.model.ts, shared with the top router menu so
   * the two can no longer advertise different things.
   */
  readonly visibleItems = computed<NavEntry[]>(() => {
    this.prefs.order();
    return this.prefs.apply(this.navAccess.shortcutCandidates());
  });

  /** Overflow shortcuts grouped under their section headings. */
  readonly overflowSections = computed<VisibleSection[]>(() => {
    const spare = new Set(this.overflow().map(i => i.navKey));
    return this.navAccess.visibleSections()
      .map(section => ({ ...section, items: section.items.filter(i => spare.has(i.navKey)) }))
      .filter(section => section.items.length > 0);
  });

  /** Overflow entries that belong to no section (Home / Profile). */
  readonly overflowStandalone = computed<NavEntry[]>(() => {
    const sectioned = new Set(this.navAccess.visibleItems().map(i => i.navKey));
    return this.overflow().filter(i => !sectioned.has(i.navKey));
  });

  readonly primary = computed(() =>
    this.visibleItems().filter(i => !!i.route).slice(0, this.tabCount));

  readonly overflow = computed(() => {
    const promoted = new Set(this.primary().map(i => i.navKey));
    // An external entry has no route to promote, so it always lands in the sheet.
    return this.visibleItems().filter(i => !promoted.has(i.navKey));
  });

  constructor() {
    this.router.events.subscribe(() => {
      // Preferences are per-user; a login/logout routes, so this is where the key can change.
      this.prefs.syncToCurrentUser();
      // A tab tap navigates; never leave the sheet covering the screen it just opened.
      if (this.sheetOpen()) { this.sheetOpen.set(false); this.editing.set(false); }
    });
  }

  toggleSheet(): void {
    this.sheetOpen.update(v => !v);
    if (!this.sheetOpen()) this.editing.set(false);
  }

  closeSheet(): void {
    this.sheetOpen.set(false);
    this.editing.set(false);
  }

  toggleEditing(): void { this.editing.update(v => !v); }

  /**
   * Reorder one entry. The full visible list is passed through so the saved order stays complete —
   * persisting only the moved pair would lose the position of everything else.
   */
  move(navKey: string, direction: -1 | 1): void {
    this.prefs.move(this.visibleItems(), navKey, direction);
  }

  resetOrder(): void { this.prefs.reset(); }

  /** External entries (SDS eBinder) open in a new tab; the URL comes from the hub. */
  openExternal(item: NavEntry): void {
    const url = item.externalUrlKey ? this.navAccess.externalUrl(item.externalUrlKey) : '';
    if (url) window.open(url, '_blank', 'noopener');
    this.closeSheet();
  }
}
