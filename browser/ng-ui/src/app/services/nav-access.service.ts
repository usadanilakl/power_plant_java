import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ServerApiService } from './server-api.service';
import { ServerStatusService } from './server-status.service';
import { NAV_HOME, NAV_PROFILE, NAV_SECTIONS, NavAccess, NavItem, navKeyOf, sectionRoute } from '../models/menu/nav.model';

/** A nav item carrying the stable key used to persist shortcut ordering. */
export type NavEntry = NavItem & { navKey: string };

/** A section with its items already filtered to what this user may see. */
export interface VisibleSection {
  label: string;
  icon: string;
  slug: string;
  /** Landing route for this section's page. */
  route: string;
  items: NavEntry[];
}

/**
 * Decides which nav entries the current user may see, from the single declaration in nav.model.ts.
 *
 * Both menus read this, so a screen can no longer be advertised by one and hidden by the other — and
 * an entry can no longer be offered to someone whose route guard will immediately bounce them.
 */
@Injectable({ providedIn: 'root' })
export class NavAccessService {
  private auth = inject(AuthService);
  private serverApi = inject(ServerApiService);
  private serverStatus = inject(ServerStatusService);
  private router = inject(Router);

  /**
   * AuthService exposes plain methods rather than signals, so visibility is recomputed on every
   * navigation — signing in or out always routes, which is enough to keep the menus honest.
   */
  private navTick = signal(0);

  /** Lazily fetched hub-held link targets (see NavItem.externalUrlKey). */
  private readonly externalUrls = signal<Record<string, string>>({});

  constructor() {
    this.router.events.subscribe(() => {
      this.navTick.update(n => n + 1);
      // Signing in is always followed by a navigation, so this is where a hub-held link target
      // becomes fetchable. The call is a no-op once resolved, or while signed out.
      this.loadExternalUrls();
    });
  }

  /** Sections with at least one visible item, each carrying only the items this user may see. */
  readonly visibleSections = computed<VisibleSection[]>(() => {
    this.navTick();
    // Only a CONFIRMED outage hides hub-dependent entries. Before the first probe answers, the hub
    // is assumed reachable — otherwise every cold start would flash a half-empty menu.
    const online = this.serverStatus.isOnline() || !this.serverStatus.reachabilityChecked();
    const urls = this.externalUrls();

    return NAV_SECTIONS
      .map(section => ({
        label: section.label,
        icon: section.icon,
        slug: section.slug,
        route: sectionRoute(section),
        items: section.items
          .filter(item => this.isItemVisible(item, online, urls))
          .map(item => ({ ...item, navKey: navKeyOf(item) })),
      }))
      .filter(section => section.items.length > 0);
  });

  /** Every visible item, flattened — used for shortcut promotion in the bottom bar. */
  readonly visibleItems = computed<NavEntry[]>(() =>
    this.visibleSections().flatMap(section => section.items));

  /** Home / Profile, which sit outside the section structure. */
  readonly visibleStandalone = computed<NavEntry[]>(() => {
    this.navTick();
    return [NAV_HOME, NAV_PROFILE]
      .filter(item => this.canSee(item.access))
      .map(item => ({ ...item, navKey: navKeyOf(item) }));
  });

  /**
   * Everything the shortcut bar may promote: Home first, then every sub-section, then Profile.
   * Section landing pages are deliberately NOT here — the bar promotes destinations, and the sheet
   * is where the section structure is shown.
   */
  readonly shortcutCandidates = computed<NavEntry[]>(() => {
    const standalone = this.visibleStandalone();
    const home = standalone.filter(i => i.route === '/home');
    const trailing = standalone.filter(i => i.route !== '/home');
    return [...home, ...this.visibleItems(), ...trailing];
  });

  private isItemVisible(item: NavItem, online: boolean, urls: Record<string, string>): boolean {
    if (item.planned) return false;
    if (!this.canSee(item.access)) return false;
    // A hub-dependent screen with no hub is a guaranteed error page — don't offer it.
    if (item.hubOnly && !online) return false;
    // An external entry with no resolved target has nowhere to go.
    if (item.externalUrlKey && !urls[item.externalUrlKey]) return false;
    return true;
  }

  /** One section by slug, or undefined when it has no visible items for this user. */
  sectionBySlug(slug: string): VisibleSection | undefined {
    return this.visibleSections().find(section => section.slug === slug);
  }

  /** Resolved destination for an external entry, or '' while unknown. */
  externalUrl(key: string): string {
    return this.externalUrls()[key] ?? '';
  }

  canSee(access: NavAccess): boolean {
    switch (access) {
      case 'public': return true;
      // Verification against the SharePoint orientation list is not built yet. Signed-in users
      // clearly satisfy "verified"; an unauthenticated visitor cannot until that flow exists.
      case 'publicVerified': return this.auth.isLoggedIn();
      case 'auth': return this.auth.isLoggedIn();
      case 'basic': return this.auth.isLoggedIn() && this.auth.hasPermission('BASIC');
      case 'plant': return this.auth.isLoggedIn() && this.auth.isPlant();
      case 'plantGroup': return this.auth.isLoggedIn() && this.auth.isPlantGroup();
      case 'instrumentation': return this.auth.isLoggedIn() && this.auth.isInstrumentation();
      case 'insulation': return this.auth.isLoggedIn() && this.auth.isInsulation();
      case 'safety': return this.auth.isLoggedIn() && this.auth.isSafety();
      default: return false;
    }
  }

  /**
   * Fetch the hub-held link targets once per session. A failure just leaves the entry hidden, which
   * is the right outcome when the hub can't tell us where it points.
   */
  loadExternalUrls(): void {
    if (!this.auth.isLoggedIn() || this.externalUrls()['sdsEbinder']) return;
    this.serverApi.getSdsEbinderUrl().subscribe({
      next: url => {
        if (url) this.externalUrls.update(current => ({ ...current, sdsEbinder: url }));
      },
      error: () => { /* hub unreachable or not configured — entry stays hidden */ },
    });
  }
}
