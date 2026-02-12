import { Component, computed, DestroyRef, inject, input, OnInit, output } from '@angular/core';
import { WorkRequestStateService } from '../work-request-state.service';
import { SubmissionOrchestratorService } from '../../../services/submission-orchestrator.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { WorkRequest } from '../../../models/permits/work-request.model';
import { TableComponent } from "../../../shared/table/table.component";
import { PopupComponent } from "../../../shared/menus/popup/popup.component";
import { ButtonConfig, ButtonsComponent } from '../../../shared/menus/buttons/buttons.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-work-request-table',
  imports: [TableComponent, PopupComponent, ButtonsComponent],
  templateUrl: './work-request-table.component.html',
  styleUrl: './work-request-table.component.css'
})
export class WorkRequestTableComponent implements OnInit {

  workRequestStateService = inject(WorkRequestStateService);
  orchestrator = inject(SubmissionOrchestratorService);
  destroyRef = inject(DestroyRef);

  itemsInput = input<WorkRequest[]>();
  itemsFromService = toSignal(this.workRequestStateService.allWorkRequests$, { initialValue: [] });
  items = computed(() => this.itemsInput()?? this.itemsFromService());
  selectedItem = toSignal(this.workRequestStateService.selectedWorkRequest$, { initialValue: new WorkRequest() });

  actionPopupClosed = output<void>();

  columns = new WorkRequest().toTableColumns();
  actionButtons: ButtonConfig[] = [];

  isActionMenuOpen = false;

  constructor() { }

  ngOnInit(): void {
    // Populate items and columns as needed
    this.actionButtons = [
      { name: 'Resubmit', action: () => this.resubmitSelected(), color: 'primary' },
      { name: 'Submit via Email', action: () => this.submitViaEmail(), color: 'accent' },
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
    this.actionPopupClosed.emit();
  }

  resubmitSelected(): void {
    // console.log('Resubmitting:', this.selectedItem());
    this.workRequestStateService.resubmitSelected();
    this.closeActionMenu();
  }

  Revoke(): void {
    // console.log('Revoking:', this.selectedItem());
    this.workRequestStateService.revokeSelected();
    this.closeActionMenu();
  }

  deleteSelected(): void {
    this.workRequestStateService.deleteSelected();
    this.closeActionMenu();
  }

  submitViaEmail(): void {
    const wr = this.selectedItem();
    if (!wr) return;
    const wrInstance = new WorkRequest(wr);
    const emailContent = this.orchestrator.generateEmailContent(wrInstance);
    window.location.href = emailContent.mailto;
    if (wrInstance.attachments?.length > 0) {
      for (const att of wrInstance.attachments) {
        const dataUri = `data:${att.contentType};base64,${att.base64Content}`;
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = att.fileName;
        link.click();
      }
    }
    this.workRequestStateService.markSentViaEmail(wrInstance);
    this.closeActionMenu();
  }
}
