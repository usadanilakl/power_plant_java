import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
export class RfLotoStandardPageComponent implements OnInit {
  stateService = inject(RfLotoStandardStateService);
  lotoPointStateService = inject(RfLotoPointStateService);
  fileStateService = inject(RfFileStateService);
  contextMenuService = inject(LotoStandardContextMenuService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    // Deep-link support: navigating here with ?id=N (e.g. after generating a
    // standard from a Red Tag standard) selects that standard and pushes it
    // into the shared list so the left panel + table show it without a refresh.
    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      const numId = Number(id);
      if (!Number.isNaN(numId)) this.stateService.loadItemById(numId);
    }
  }

  onCounterpartCreated(created: LotoStandardDto): void {
    this.contextMenuService.counterpartDialogSourceId.set(null);
    if (created?.id) {
      this.stateService.loadItemById(created.id);
    }
  }
}
