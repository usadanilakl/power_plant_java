import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { MainLayoutComponent } from "../../layout/refactored/main-layout.component";
import { RouterMenuComponent } from "../../shared/menu/router-menu/router-menu.component";
import { LOTO_NAV_MENU_ITEMS, RouterMenuItems } from '../../models/ui/router-menu.model';
import { LeftMenuOutletComponent } from "../../shared/left-menu-outlet/left-menu-outlet.component";
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-loto',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent, RouterMenuComponent, LeftMenuOutletComponent],
  templateUrl: './loto.component.html',
  styleUrl: './loto.component.css'
})
export class LotoPageComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  lotoNavMenuItems: RouterMenuItems = LOTO_NAV_MENU_ITEMS;

  // Only render the left-menu slot when the active child route declares one.
  // Without this the empty <app-left-menu-outlet> still reserves the layout's
  // side-menu column, which is why the /loto/loto sub-page appeared to have
  // no menu at all — the outlet was there but the layout wasn't showing it.
  hasLeftMenu = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let child = this.route.firstChild;
        while (child?.firstChild) child = child.firstChild;
        return !!child?.snapshot?.data?.['leftMenu'];
      })
    ),
    { initialValue: true }
  );
}
