
import { Component, input, computed, inject, signal, HostListener } from '@angular/core';
import { MAIN_MENU_ITEMS, GROUPED_MAIN_MENU, RouterMenuItems, GroupedRouterMenu, RouterMenuGroup } from '../../../models/ui/router-menu.model';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { NgClass } from '@angular/common';
import { GuideDirective } from '../../guide/guide.directive';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { AppConfigService } from '../../../services/app-config.service';

@Component({
  selector: 'app-router-menu',
  standalone: true,
  imports: [RouterLink, NgClass, GuideDirective, RouterLinkActive],
  templateUrl: './router-menu.component.html',
  styleUrl: './router-menu.component.css'
})
export class RouterMenuComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private appConfigService = inject(AppConfigService);
  private isTestMode = toSignal(this.appConfigService.testMode$);

  menuItems = input<RouterMenuItems>(MAIN_MENU_ITEMS);
  groupedMenu = input<GroupedRouterMenu>(GROUPED_MAIN_MENU);
  layout = input<'column' | 'row'>('column');
  useGrouped = input<boolean>(true);
  showSecondaryMenu = input<boolean>(true);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    )
  );

  private currentUser = toSignal(this.authService.currentUser$);

  /** Grouped menu filtered by access level and test mode — hides groups/items accordingly */
  filteredGroupedMenu = computed<GroupedRouterMenu>(() => {
    const groups = this.groupedMenu();
    const user = this.currentUser();
    const hasFullAccess = user?.accessLevel === 'FULL';
    const roles = user?.roles ?? [];
    // Plant-role (or admin) users can see Plant-gated groups (e.g. Maximo) without FULL access.
    const hasPlant = roles.includes('ROLE_PLANT') || roles.includes('ROLE_ADMIN');
    const testMode = this.isTestMode();

    // A Plant-gated group (e.g. Maximo) is shown iff the user has the Plant role — matching its route
    // guard, so a FULL-but-non-Plant user never sees a Maximo menu that would bounce them at the route.
    const hasAnyRequiredRole = (requiredRoles?: string[]) =>
      !requiredRoles?.length || requiredRoles.some(role => roles.includes(role));

    const groupVisible = (g: RouterMenuGroup) => {
      if (g.requiresPlant) return hasPlant;
      if (!g.requiresFullAccess || hasFullAccess) return true;

      // A restricted user may still enter an explicitly role-gated child,
      // such as the sanitized diagnostics viewer.
      return g.items.some(item =>
        !!item.requiresAnyRole?.length && hasAnyRequiredRole(item.requiresAnyRole)
      );
    };

    return groups
      .filter(group => groupVisible(group))
      .map(group => {
        const usingRestrictedRoleException = !!group.requiresFullAccess && !hasFullAccess;
        const items = group.items.filter(item => {
          if (group.requiresPlant && !hasPlant) return false;
          if (item.requiresFullAccess && !hasFullAccess) return false;
          if (!hasAnyRequiredRole(item.requiresAnyRole)) return false;
          if (usingRestrictedRoleException && !item.requiresAnyRole?.length) return false;
          return !item.testOnly || testMode;
        });

        return {
          ...group,
          // Restricted role exceptions must land on the one child they can use.
          defaultRoute: usingRestrictedRoleException && items.length > 0
            ? items[0].route
            : group.defaultRoute,
          items,
        };
      })
      .filter(group => group.items.length > 0);
  });

  activeGroup = computed<RouterMenuGroup | null>(() => {
    const url = this.currentUrl();
    if (!url) return null;

    const groups = this.filteredGroupedMenu();
    for (const group of groups) {
      for (const item of group.items) {
        if (url.startsWith(item.route)) {
          return group;
        }
      }
    }
    return null;
  });

  isGroupActive(group: RouterMenuGroup): boolean {
    return this.activeGroup()?.label === group.label;
  }

  // Hover dropdown state
  hoveredGroup = signal<RouterMenuGroup | null>(null);
  private dropdownTimeout: any = null;

  showDropdown(group: RouterMenuGroup): void {
    clearTimeout(this.dropdownTimeout);
    this.hoveredGroup.set(group);
  }

  hideDropdown(): void {
    this.dropdownTimeout = setTimeout(() => this.hoveredGroup.set(null), 150);
  }

  closeDropdown(): void {
    this.hoveredGroup.set(null);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (!event.altKey || !this.useGrouped()) return;

    const num = parseInt(event.key, 10);
    if (isNaN(num) || num < 1) return;

    // Skip if user is typing in an input
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const groups = this.filteredGroupedMenu();
    if (num > groups.length) return;

    event.preventDefault();
    this.router.navigate([groups[num - 1].defaultRoute]);
  }
}
