import { Component } from '@angular/core';
import { MainLayoutComponent } from "../../layout/refactored/main-layout.component";
import { RouterMenuComponent } from "../../shared/menu/router-menu/router-menu.component";
import { BottomMenuOutletComponent } from "../../shared/bottom-menu-outlet/bottom-menu-outlet.component";
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-scheduler-page',
  imports: [MainLayoutComponent, RouterMenuComponent, BottomMenuOutletComponent, RouterModule,],
  templateUrl: './scheduler-page.component.html',
  styleUrl: './scheduler-page.component.css'
})
export class SchedulerPageComponent {

  constructor() {}

}
