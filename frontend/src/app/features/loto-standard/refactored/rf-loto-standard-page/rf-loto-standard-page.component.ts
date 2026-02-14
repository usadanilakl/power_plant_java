import { Component, inject } from '@angular/core';
import { MainLayoutComponent } from "../../../../layout/refactored/main-layout.component";
import { RouterMenuComponent } from "../../../../shared/menu/router-menu/router-menu.component";
import { RfPopupProjectionComponent } from "../../../../shared/popup-projection/rf-popup-projection.component";
import { RfLotoStandardFormComponent } from "../rf-loto-standard-form/rf-loto-standard-form.component";
import { RfLotoStandardStateService } from '../services/rf-loto-standard-state.service';
import { RfLotoStandardLeftPanelComponent } from "../rf-loto-standard-left-panel/rf-loto-standard-left-panel.component";
import { RfLotoPointFormComponent } from "../../../loto-points/refactored/rf-loto-point-form/rf-loto-point-form.component";
import { RfLotoPointStateService } from "../../../loto-points/refactored/services/rf-loto-point-state.service";
import { RfFileFormComponent } from "../../../files/refactored/rf-file-form/rf-file-form.component";
import { RfFileStateService } from "../../../files/refactored/services/rf-file-state.service";
import { ExportDialogComponent } from "../../../../shared/export-dialog/export-dialog.component";
import { LotoStandardContextMenuService } from "../services/loto-standard-context-menu.service";
import { CounterpartStandardDialogComponent } from "../counterpart-standard-dialog/counterpart-standard-dialog.component";
import { LotoStandardDto } from "../../../../models/loto/loto-standard.model";

@Component({
  selector: 'app-rf-loto-standard-page',
  standalone: true,
  imports: [
    MainLayoutComponent,
    RouterMenuComponent,
    RfPopupProjectionComponent,
    RfLotoStandardFormComponent,
    RfLotoStandardLeftPanelComponent,
    RfLotoPointFormComponent,
    RfFileFormComponent,
    ExportDialogComponent,
    CounterpartStandardDialogComponent,
  ],
  templateUrl: './rf-loto-standard-page.component.html',
  styleUrl: './rf-loto-standard-page.component.css',
})
export class RfLotoStandardPageComponent {
  stateService = inject(RfLotoStandardStateService);
  lotoPointStateService = inject(RfLotoPointStateService);
  fileStateService = inject(RfFileStateService);
  contextMenuService = inject(LotoStandardContextMenuService);

  onCounterpartCreated(created: LotoStandardDto): void {
    this.contextMenuService.counterpartDialogSourceId.set(null);
    if (created?.id) {
      this.stateService.loadItemById(created.id);
    }
  }
}
