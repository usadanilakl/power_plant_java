
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
    const hasFullAccess = this.currentUser()?.accessLevel === 'FULL';
    const testMode = this.isTestMode();

    return groups
      .filter(group => hasFullAccess || !group.requiresFullAccess)
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          (hasFullAccess || !item.requiresFullAccess) &&
          (!item.testOnly || testMode)
        )
      }))
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