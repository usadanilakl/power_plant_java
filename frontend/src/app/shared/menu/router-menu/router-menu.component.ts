
import { Component, input } from '@angular/core';
import { MAIN_MENU_ITEMS, RouterMenuItems } from '../../../models/ui/router-menu.model';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { GuideDirective } from '../../guide/guide.directive';

@Component({
  selector: 'app-router-menu',
  standalone: true,
  imports: [RouterLink, NgClass, GuideDirective],
  templateUrl: './router-menu.component.html',
  styleUrl: './router-menu.component.css'
})
export class RouterMenuComponent {
  menuItems = input<RouterMenuItems>(MAIN_MENU_ITEMS);
  layout = input<'column' | 'row'>('column');
}