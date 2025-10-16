import { Component, computed, DestroyRef, inject, input, OnInit } from '@angular/core';
import { WorkRequestStateService } from '../work-request-state.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { WorkRequest } from '../../../models/permits/work-request.model';
import { TableComponent } from "../../../shared/table/table.component";
import { PopupComponent } from "../../../shared/menus/popup/popup.component";
import { ButtonConfig, ButtonsComponent } from '../../../shared/menus/buttons/buttons.component';

@Component({
  selector: 'app-work-request-table',
  imports: [TableComponent, PopupComponent, ButtonsComponent],
  templateUrl: './work-request-table.component.html',
  styleUrl: './work-request-table.component.css'
})
export class WorkRequestTableComponent implements OnInit {

  workRequestStateService = inject(WorkRequestStateService);
  destroyRef = inject(DestroyRef);

  itemsInput = input<WorkRequest[]>();
  itemsFromService = toSignal(this.workRequestStateService.allWorkRequests$, { initialValue: [] });
  items = computed(() => this.itemsInput()?? this.itemsFromService());
  selectedItem = toSignal(this.workRequestStateService.selectedWorkRequest$, { initialValue: new WorkRequest() });

  columns = new WorkRequest().toTableColumns();
  actionButtons: ButtonConfig[] = [];

  isActionMenuOpen = false;

  constructor() { }

  ngOnInit(): void {
    // Populate items and columns as needed
    this.actionButtons = [
      { name: 'Resubmit', action: () => this.resubmitSelected(), color: 'primary' },
      { name: 'Revoke', action: () => this.Revoke(), color: 'accent' },
      { name: 'Delete', action: () => this.deleteSelected(), color: 'warn' }
    ];
  }

  onRowClick({ item }: { item: WorkRequest, event: MouseEvent}){
    this.workRequestStateService.selectWorkRequest(item);
    this.isActionMenuOpen = true;
  }

  closeActionMenu() {
    this.isActionMenuOpen = false;
  }

  resubmitSelected(): void {
    console.log('Resubmitting:', this.selectedItem());
    this.closeActionMenu();
  }

  Revoke(): void {
    // console.log('Revoking:', this.selectedItem());
    this.workRequestStateService.revokeSelected();
    this.closeActionMenu();
  }

  deleteSelected(): void {
    console.log('Deleting:', this  .selectedItem());
    this.closeActionMenu();
  }



}
