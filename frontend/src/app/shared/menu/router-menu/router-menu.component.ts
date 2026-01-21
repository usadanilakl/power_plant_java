
import { Component, input, computed, inject } from '@angular/core';
import { MAIN_MENU_ITEMS, GROUPED_MAIN_MENU, RouterMenuItems, GroupedRouterMenu, RouterMenuGroup } from '../../../models/ui/router-menu.model';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { NgClass } from '@angular/common';
import { GuideDirective } from '../../guide/guide.directive';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-router-menu',
  standalone: true,
  imports: [RouterLink, NgClass, GuideDirective, RouterLinkActive],
  templateUrl: './router-menu.component.html',
  styleUrl: './router-menu.component.css'
})
export class RouterMenuComponent {
  private router = inject(Router);

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

  activeGroup = computed<RouterMenuGroup | null>(() => {
    const url = this.currentUrl();
    if (!url) return null;

    const groups = this.groupedMenu();
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
}