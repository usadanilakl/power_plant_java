import { Component, inject } from '@angular/core';
import { RfPopupProjectionComponent } from '../../../../../shared/popup-projection/rf-popup-projection.component';
import { RfJhaFormComponent } from '../rf-jha-form/rf-jha-form.component';
import { RfJhaTableComponent } from '../rf-jha-table/rf-jha-table.component';
import { RfJhaStateService } from '../services/rf-jha-state.service';
import { JhaDto } from '../../../../../models/permits/jha.model';
import { SpSyncToolbarComponent } from '../../../../../shared/sp-sync-toolbar/sp-sync-toolbar.component';

@Component({
  selector: 'app-rf-jha-page',
  standalone: true,
  imports: [
    RfPopupProjectionComponent,
    RfJhaFormComponent,
    RfJhaTableComponent,
    SpSyncToolbarComponent,
  ],
  templateUrl: './rf-jha-page.component.html',
  styleUrl: './rf-jha-page.component.css',
})
export class RfJhaPageComponent {
  stateService = inject(RfJhaStateService);

  onRowDoubleClicked(item: JhaDto): void {
    this.stateService.loadItemById(item.id);
    this.stateService.openForm();
  }

  onSelectedItems(items: JhaDto[]): void {
    this.stateService.selectedItems.set(items);
    if (items.length === 1) {
      this.stateService.setSelectedItem(items[0]);
    }
  }

  onNewJha(): void {
    this.stateService.openNewJhaForm();
    this.stateService.openForm();
  }

  onSyncComplete(): void {
    this.stateService.reloadData();
  }
}
