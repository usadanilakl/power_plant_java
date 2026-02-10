import { Component } from '@angular/core';
import { RouterMenuComponent } from "../../shared/menu/router-menu/router-menu.component";
import { MainLayoutComponent } from "../../layout/refactored/main-layout.component";
import { RouterModule } from '@angular/router';
import { LeftMenuOutletComponent } from "../../shared/left-menu-outlet/left-menu-outlet.component";

@Component({
  selector: 'app-permit-builder-page',
  standalone: true,
  imports: [RouterMenuComponent, MainLayoutComponent, RouterModule, LeftMenuOutletComponent],
  templateUrl: './permit-builder-page.component.html',
  styleUrl: './permit-builder-page.component.css'
})
export class PermitBuilderPageComponent {
}
