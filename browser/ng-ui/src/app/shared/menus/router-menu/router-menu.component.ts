import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { INSTRUMENTATION_MENU_ITEM, MAIN_MENU_ITEMS, RouterMenuItems } from '../../../models/menu/router-menu.model';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-router-menu',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './router-menu.component.html',
  styleUrl: './router-menu.component.css'
})
export class RouterMenuComponent {
  private authService = inject(AuthService);

  menuItems = input<RouterMenuItems>(MAIN_MENU_ITEMS);
  layout = input<'column' | 'row'>('column');

  /**
   * Adds the role-gated entries the current user actually holds. Only applies to the default main
   * menu — a caller passing its own item list gets exactly what it passed.
   */
  visibleItems = computed<RouterMenuItems>(() => {
    const items = this.menuItems();
    if (items !== MAIN_MENU_ITEMS) return items;
    return this.authService.isInstrumentation()
      ? [...items, INSTRUMENTATION_MENU_ITEM]
      : items;
  });
}
