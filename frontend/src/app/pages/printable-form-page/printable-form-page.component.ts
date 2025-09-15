import { Component, OnInit } from '@angular/core';
import { FORM_DESIGNER_NAV_MENU_ITEMS, RouterMenuItems } from '../../models/ui/router-menu.model';
import { ActivatedRoute, NavigationEnd, RouterModule, Router } from '@angular/router';
import { filter } from 'rxjs';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';
import { MainLayoutComponent } from "../../layout/main-layout.component";
import { PrintableFormSideMenuComponent } from "../../features/form-designer/printable-form/printable-form-side-menu/printable-form-side-menu.component";

@Component({
  selector: 'app-printable-form-page',
  standalone: true,
  imports: [RouterMenuComponent, MainLayoutComponent, PrintableFormSideMenuComponent, RouterModule],
  templateUrl: './printable-form-page.component.html',
  styleUrl: './printable-form-page.component.css'
})
export class PrintableFormPageComponent implements OnInit{
  navMenuItems : RouterMenuItems = FORM_DESIGNER_NAV_MENU_ITEMS;

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
