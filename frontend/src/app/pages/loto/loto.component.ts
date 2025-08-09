import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LotoPointTableComponent } from "../../features/loto-points/loto-point-table/loto-point-table.component";
import { MainLayoutComponent } from "../../layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menu/router-menu/router-menu.component";
import { BottomMenuOutletComponent } from "../../shared/bottom-menu-outlet/bottom-menu-outlet.component";
import { LOTO_NAV_MENU_ITEMS, RouterMenuItems } from '../../models/ui/router-menu.model';
import { LotoStandardSideMenuComponent } from "../../features/loto-standard/loto-standard-side-menu/loto-standard-side-menu.component";

@Component({
  selector: 'app-loto',
  standalone: true,
  imports: [CommonModule, RouterModule, LotoPointTableComponent, MainLayoutComponent, RouterMenuComponent, BottomMenuOutletComponent, LotoStandardSideMenuComponent],
  templateUrl: './loto.component.html',
  styleUrl: './loto.component.css'
})
export class LotoComponent {
  categories = [
    { name: 'LOTO', route: './loto' },
    { name: 'Active LOTO Points', route: './loto-points-active' },
    { name: 'All LOTO Points', route: './loto-points' },
    { name: 'LOTO Boxes', route: './loto-boxes' },
    { name: 'Locks', route: './locks' }
  ];
  lotoNavMenuItems : RouterMenuItems = LOTO_NAV_MENU_ITEMS;
}
