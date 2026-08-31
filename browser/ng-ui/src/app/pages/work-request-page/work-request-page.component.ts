import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menus/router-menu/router-menu.component";

@Component({
  selector: 'app-work-request-page',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, RouterModule],
  templateUrl: './work-request-page.component.html',
  styleUrl: './work-request-page.component.css'
})
export class WorkRequestPageComponent {


}
