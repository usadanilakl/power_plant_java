import { Component, inject } from '@angular/core';
import { MainLayoutComponent } from './layout/main-layout.component';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { PrintLayoutComponent } from "./features/form-designer/printable-form/print-layout/print-layout.component";
import { GlobalMessageComponent } from "./shared/global-message/global-message.component";
import { RfPopupProjectionComponent } from "./shared/popup-projection/rf-popup-projection.component";
import { RfLotoPointFormComponent } from "./features/loto-points/refactored/rf-loto-point-form/rf-loto-point-form.component";
import { RfLotoPointStateService } from './features/loto-points/refactored/services/rf-loto-point-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainLayoutComponent, PrintLayoutComponent, GlobalMessageComponent, RfPopupProjectionComponent, RfLotoPointFormComponent],
  templateUrl: './app.component.html',
  // template: '<app-main-layout></app-main-layout>',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(public route: ActivatedRoute) {}
  stateService = inject(RfLotoPointStateService);
  title = 'Jackson';
}
