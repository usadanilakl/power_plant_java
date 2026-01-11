import { Component, inject } from '@angular/core';
import { MainLayoutComponent } from "../../../../layout/refactored/main-layout.component";
import { RouterMenuComponent } from "../../../../shared/menu/router-menu/router-menu.component";
import { RouterOutlet } from "@angular/router";
import { RfPopupProjectionComponent } from "../../../../shared/popup-projection/rf-popup-projection.component";
import { RfLotoStandardFormComponent } from "../rf-loto-standard-form/rf-loto-standard-form.component";
import { RfLotoStandardStateService } from '../services/rf-loto-standard-state.service';
import { RfLotoStandardLeftMenuComponent } from "../rf-loto-standard-left-menu/rf-loto-standard-left-menu.component";
import { RfLotoPointFormComponent } from "../../../loto-points/refactored/rf-loto-point-form/rf-loto-point-form.component";
import { RfLotoPointStateService } from "../../../loto-points/refactored/services/rf-loto-point-state.service";
import { RfFileFormComponent } from "../../../files/refactored/rf-file-form/rf-file-form.component";
import { RfFileStateService } from "../../../files/refactored/services/rf-file-state.service";
import { ExportDialogComponent } from "../../../../shared/export-dialog/export-dialog.component";

@Component({
  selector: 'app-rf-loto-standard-page',
  standalone: true,
  imports: [
    MainLayoutComponent,
    RouterMenuComponent,
    RouterOutlet,
    RfPopupProjectionComponent,
    RfLotoStandardFormComponent,
    RfLotoStandardLeftMenuComponent,
    RfLotoPointFormComponent,
    RfFileFormComponent,
    ExportDialogComponent
  ],
  templateUrl: './rf-loto-standard-page.component.html',
  styleUrl: './rf-loto-standard-page.component.css',
})
export class RfLotoStandardPageComponent {
  stateService = inject(RfLotoStandardStateService);
  lotoPointStateService = inject(RfLotoPointStateService);
  fileStateService = inject(RfFileStateService);
}
