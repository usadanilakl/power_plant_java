import { Component, inject } from '@angular/core';
import { MainLayoutComponent } from "../../../../layout/refactored/main-layout.component";
import { RouterMenuComponent } from "../../../../shared/menu/router-menu/router-menu.component";
import { RfLotoPointLeftMenuComponent } from "../rf-loto-point-left-menu/rf-loto-point-left-menu.component";
import { RouterOutlet } from "@angular/router";
import { RfPopupProjectionComponent } from "../../../../shared/popup-projection/rf-popup-projection.component";
import { RfLotoPointFormComponent } from "../rf-loto-point-form/rf-loto-point-form.component";
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';

@Component({
  selector: 'app-rf-loto-point-page',
  imports: [
    MainLayoutComponent,
    RouterMenuComponent,
    RfLotoPointLeftMenuComponent,
    RouterOutlet,
    RfPopupProjectionComponent,
    RfLotoPointFormComponent,
  ],
  templateUrl: './rf-loto-point-page.component.html',
  styleUrl: './rf-loto-point-page.component.css',
})
export class RfLotoPointPageComponent {
  stateService = inject(RfLotoPointStateService);
}
