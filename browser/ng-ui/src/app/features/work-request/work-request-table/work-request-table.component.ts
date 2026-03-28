import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkRequestStateService } from '../work-request-state.service';
import { SubmissionOrchestratorService } from '../../../services/submission-orchestrator.service';
import { JhaStateService } from '../../jha/jha-state.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { WorkRequest } from '../../../models/permits/work-request.model';
import { TableComponent } from "../../../shared/table/table.component";
import { PopupComponent } from "../../../shared/menus/popup/popup.component";
import { ButtonConfig, ButtonsComponent } from '../../../shared/menus/buttons/buttons.component';
import { ServerApiService } from '../../../services/server-api.service';
import { AuthService } from '../../../auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-work-request-table',
  imports: [TableComponent, PopupComponent, ButtonsComponent, FormsModule],
  templateUrl: './work-request-table.component.html',
  styleUrl: './work-request-table.component.css'
})
export class WorkRequestTableComponent {

  workRequestStateService = inject(WorkRequestStateService);
  orchestrator = inject(SubmissionOrchestratorService);
  jhaStateService = inject(JhaStateService);
  serverApi = inject(ServerApiService);
  authService = inject(AuthService);
  router = inject(Router);
  destroyRef = inject(DestroyRef);

  itemsInput = input<WorkRequest[]>();
  itemsFromService = toSignal(this.workRequestStateService.allWorkRequests$, { initialValue: [] });
  items = computed(() => this.itemsInput()?? this.itemsFromService());
  selectedItem = toSignal(this.workRequestStateService.selectedWorkRequest$, { initialValue: new WorkRequest() });

  actionPopupClosed = output<void>();
  resubmitMode = input<boolean>(false);

  columns = new WorkRequest().toTableColumns();
  actionButtons: ButtonConfig[] = [];

  isActionMenuOpen = false;

  onRowClick({ item }: { item: WorkRequest, event: MouseEvent}){
    this.workRequestStateService.selectWorkRequest(item);

    // In resubmit mode, directly resubmit and close - no action menu
    if (this.resubmitMode()) {
      this.resubmitSelected();
      return;
    }

    const buttons: ButtonConfig[] = [];
    if (item.sharepointId) {
      buttons.push({ name: 'Edit', action: () => this.editSelected(), color: 'primary' });
      if (this.authService.isLoggedIn()) {
        buttons.push({ name: 'Message Operator', action: () => this.openMessageCompose(), color: 'primary' });
      }
    }
    if (item.jhaStatus !== 'Completed') {
      buttons.push({ name: 'Fill Out JHA', action: () => this.fillOutJha(), color: 'primary' });
    }
    buttons.push(
      { name: 'Resubmit', action: () => this.resubmitSelected(), color: 'primary' },
      { name: 'Submit via Email', action: () => this.submitViaEmail(), color: 'accent' },
      { name: 'Revoke', action: () => this.Revoke(), color: 'accent' },
      { name: 'Delete', action: () => this.deleteSelected(), color: 'warn' }
    );
    this.actionButtons = buttons;
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

  fillOutJha(): void {
    const wr = this.selectedItem();
    if (!wr) return;
    this.jhaStateService.selectWorkRequestForJha(new WorkRequest(wr));
    this.router.navigate(['/jha/form']);
    this.closeActionMenu();
  }

  editSelected(): void {
    this.workRequestStateService.editSelected();
    this.closeActionMenu();
  }

  // --- Message Compose ---
  isMessageComposeOpen = signal(false);
  messageText = '';
  messageSending = signal(false);
  messageResult = signal<string | null>(null);

  openMessageCompose(): void {
    this.closeActionMenu();
    this.messageText = '';
    this.messageResult.set(null);
    this.isMessageComposeOpen.set(true);
  }

  closeMessageCompose(): void {
    this.isMessageComposeOpen.set(false);
    this.messageText = '';
    this.messageResult.set(null);
  }

  sendMessageToOperator(): void {
    const wr = this.selectedItem();
    if (!wr?.sharepointId || !this.messageText.trim()) return;

    this.messageSending.set(true);
    this.messageResult.set(null);

    this.serverApi.startConversationFromWr(
      wr.sharepointId,
      this.messageText.trim()
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageSending.set(false);
        this.messageResult.set('Message sent successfully!');
        this.messageText = '';
        setTimeout(() => this.closeMessageCompose(), 1500);
      },
      error: (err) => {
        this.messageSending.set(false);
        this.messageResult.set(err.message || 'Failed to send message');
      }
    });
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
