import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { LotoPointTableComponent } from "../../features/loto-points/loto-point-table/loto-point-table.component";
import { MainLayoutComponent } from "../../layout/refactored/main-layout.component";
import { RouterMenuComponent } from "../../shared/menu/router-menu/router-menu.component";
import { BottomMenuOutletComponent } from "../../shared/bottom-menu-outlet/bottom-menu-outlet.component";
import { LOTO_NAV_MENU_ITEMS, RouterMenuItems } from '../../models/ui/router-menu.model';
import { LotoStandardSideMenuComponent } from "../../features/loto-standard/loto-standard-side-menu/loto-standard-side-menu.component";
import { LeftMenuOutletComponent } from "../../shared/left-menu-outlet/left-menu-outlet.component";
import { filter } from 'rxjs';
import { LotoTableComponent } from "../../features/loto/loto-table/loto-table.component";
import { LotoSideMenuComponent } from "../../features/loto/loto-side-menu/loto-side-menu.component";

@Component({
  selector: 'app-loto',
  standalone: true,
  imports: [CommonModule, RouterModule, LotoPointTableComponent, MainLayoutComponent, RouterMenuComponent, BottomMenuOutletComponent, LotoStandardSideMenuComponent, LeftMenuOutletComponent, LotoTableComponent, LotoSideMenuComponent],
  templateUrl: './loto.component.html',
  styleUrl: './loto.component.css'
})
export class LotoPageComponent implements OnInit {
  categories = [
    { name: 'LOTO', route: './loto' },
    { name: 'Active LOTO Points', route: './loto-points-active' },
    { name: 'All LOTO Points', route: './loto-points' },
    { name: 'LOTO Boxes', route: './loto-boxes' },
    { name: 'LOTO Grid', route: './loto-boxes-grid' },
    { name: 'Locks', route: './locks' }
  ];
  lotoNavMenuItems : RouterMenuItems = LOTO_NAV_MENU_ITEMS;

  currentRoute: string = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    // Set initial route
    this.setCurrentRoute();

    // Listen for route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.setCurrentRoute();
    });
  }

  private setCurrentRoute(): void {
    let child = this.route.firstChild;
    if (child) {
      this.currentRoute = child.snapshot.url[0]?.path || '';
    } else {
      this.currentRoute = '';
    }
    console.log('Current child route:', this.currentRoute);
  }
}
