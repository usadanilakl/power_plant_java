import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from "../../layout/refactored/main-layout.component";
import { RouterMenuComponent } from "../../shared/menu/router-menu/router-menu.component";
import { LOTO_NAV_MENU_ITEMS, RouterMenuItems } from '../../models/ui/router-menu.model';
import { LeftMenuOutletComponent } from "../../shared/left-menu-outlet/left-menu-outlet.component";

@Component({
  selector: 'app-loto',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent, RouterMenuComponent, LeftMenuOutletComponent],
  templateUrl: './loto.component.html',
  styleUrl: './loto.component.css'
})
export class LotoPageComponent {
  lotoNavMenuItems: RouterMenuItems = LOTO_NAV_MENU_ITEMS;
}
