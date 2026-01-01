import { Component, inject } from '@angular/core';
import { MainLayoutComponent } from "../../../../layout/refactored/main-layout.component";
import { RouterMenuComponent } from "../../../../shared/menu/router-menu/router-menu.component";
import { RouterOutlet } from "@angular/router";
import { RfPopupProjectionComponent } from "../../../../shared/popup-projection/rf-popup-projection.component";
import { RfLotoStandardFormComponent } from "../rf-loto-standard-form/rf-loto-standard-form.component";
import { RfLotoStandardStateService } from '../services/rf-loto-standard-state.service';

@Component({
  selector: 'app-rf-loto-standard-page',
  standalone: true,
  imports: [
    MainLayoutComponent,
    RouterMenuComponent,
    RouterOutlet,
    RfPopupProjectionComponent,
    RfLotoStandardFormComponent,
  ],
  templateUrl: './rf-loto-standard-page.component.html',
  styleUrl: './rf-loto-standard-page.component.css',
})
export class RfLotoStandardPageComponent {
  stateService = inject(RfLotoStandardStateService);
}
