import { Component } from '@angular/core';
import { RouterMenuComponent } from "../../shared/menu/router-menu/router-menu.component";
import { MainLayoutComponent } from "../../layout/main-layout.component";
import { PERMIT_BUILDER_NAV_MENU_ITEMS, RouterMenuItems } from '../../models/ui/router-menu.model';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { PermitBuilderComponent } from "../../features/permit-builder/permit-builder.component";
import { PermitBuilderLeftMenuComponent } from "../../features/permit-builder/menus/permit-builder-left-menu/permit-builder-left-menu.component";
import { JobLogLeftMenuComponent } from "../../features/permit-builder/job-log/job-log-left-menu/job-log-left-menu.component";
import { JobLogComponent } from "../../features/permit-builder/job-log/job-log.component";
import { DailyPermitPackageSideMenuComponent } from "../../features/permit-builder/daily-permit-package/daily-permit-package-side-menu/daily-permit-package-side-menu.component";
import { SafeWorkSideMenuComponent } from "../../features/permit-builder/safe-work/safe-work-side-menu/safe-work-side-menu.component";
import { HotWorkSideMenuComponent } from "../../features/permit-builder/hot-work/hot-work-side-menu/hot-work-side-menu.component";
import { ConfinedSpaceSideMenuComponent } from "../../features/permit-builder/confined-space/confined-space-side-menu/confined-space-side-menu.component";

@Component({
  selector: 'app-permit-builder-page',
  standalone:true,
  imports: [RouterMenuComponent, MainLayoutComponent, PermitBuilderComponent, PermitBuilderLeftMenuComponent, JobLogLeftMenuComponent, JobLogComponent, RouterModule, DailyPermitPackageSideMenuComponent, SafeWorkSideMenuComponent, HotWorkSideMenuComponent, ConfinedSpaceSideMenuComponent],
  templateUrl: './permit-builder-page.component.html',
  styleUrl: './permit-builder-page.component.css'
})
export class PermitBuilderPageComponent {
  
  navMenuItems : RouterMenuItems = PERMIT_BUILDER_NAV_MENU_ITEMS;

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
