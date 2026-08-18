import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { RouterMenuItems } from '../../../models/menu/router-menu.model';
import { NavAccessService } from '../../../services/nav-access.service';

@Component({
  selector: 'app-router-menu',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './router-menu.component.html',
  styleUrl: './router-menu.component.css'
})
export class RouterMenuComponent {
  private navAccess = inject(NavAccessService);

  /**
   * Pass a list to render exactly that (sub-navigation inside a feature). Leave it unset and the
   * component renders the app's main menu, filtered to what the current user may actually reach.
   */
  menuItems = input<RouterMenuItems | null>(null);
  layout = input<'column' | 'row'>('column');

  /**
   * The main menu now comes from the same NAV_ITEMS declaration the bottom nav uses. It previously
   * had its own hardcoded MAIN_MENU_ITEMS list, which still advertised the retired no-login tier and
   * had drifted out of step with both the route guards and the bottom nav.
   */
  visibleItems = computed<RouterMenuItems>(() => {
    const supplied = this.menuItems();
    if (supplied) return supplied;
    return this.navAccess.visibleItems()
      .filter(item => !!item.route)
      .map(item => ({ route: item.route!, label: item.label }));
  });
}
