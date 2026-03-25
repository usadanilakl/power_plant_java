
import { Component, input, computed, inject, HostListener } from '@angular/core';
import { MAIN_MENU_ITEMS, GROUPED_MAIN_MENU, RouterMenuItems, GroupedRouterMenu, RouterMenuGroup } from '../../../models/ui/router-menu.model';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { NgClass } from '@angular/common';
import { GuideDirective } from '../../guide/guide.directive';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

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

  /** Grouped menu filtered by access level — hides groups/items requiring full access for restricted users */
  filteredGroupedMenu = computed<GroupedRouterMenu>(() => {
    const groups = this.groupedMenu();
    const hasFullAccess = this.currentUser()?.accessLevel === 'FULL';

    if (hasFullAccess) return groups;

    return groups
      .filter(group => !group.requiresFullAccess)
      .map(group => ({
        ...group,
        items: group.items.filter(item => !item.requiresFullAccess)
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