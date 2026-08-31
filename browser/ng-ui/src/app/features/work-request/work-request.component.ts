import { Component, inject, signal } from '@angular/core';
import { WorkRequestFormComponent } from "./work-request-form/work-request-form.component";
import { WorkRequestWizardComponent } from "./work-request-wizard/work-request-wizard.component";
import { PopupComponent } from "../../shared/menus/popup/popup.component";
import { WorkRequestTableComponent } from "./work-request-table/work-request-table.component";
import { WorkRequestStateService } from './work-request-state.service';

@Component({
  selector: 'app-work-request',
  standalone: true,
  imports: [WorkRequestFormComponent, WorkRequestWizardComponent, PopupComponent, WorkRequestTableComponent],
  templateUrl: './work-request.component.html',
  styleUrl: './work-request.component.css'
})
export class WorkRequestComponent {

  /**
   * 'wizard' walks a new request question by question; 'new' is the full single-page form.
   *
   * <p>Resubmitting deliberately lands on 'new'. Someone reusing a previous request already knows
   * the questions and only wants to change two fields — walking them through six steps to do that
   * would be worse, not better. It doubles as the escape hatch for anyone who prefers the form.
   */
  mode = signal<'select' | 'wizard' | 'new' | 'resubmit'>('select');
  isTablePopupOpen = false;

  private state = inject(WorkRequestStateService);

  /** What was selected when the picker opened, so closing it can tell a pick from a dismissal. */
  private selectionBeforePopup: any = null;

  selectNew() {
    this.mode.set('wizard');
  }

  /** The wizard finished, or the requester asked for the full form. */
  openFullForm() {
    this.mode.set('new');
  }

  selectResubmit() {
    this.mode.set('resubmit');
    this.isTablePopupOpen = true;
  }

  backToSelect() {
    this.mode.set('select');
  }

  openTablePopup() {
    this.selectionBeforePopup = this.state.getSelectedWorkRequest();
    this.isTablePopupOpen = true;
  }

  /**
   * Both picking a request and dismissing the popup land here, so the two are told apart by whether
   * the selection actually changed.
   *
   * <p>That distinction matters now the picker is reachable from inside the wizard. Picking a
   * previous request there used to do nothing visible — the wizard reads the selection in ngOnInit,
   * which has long since run — leaving the requester in a wizard that had silently ignored them.
   * A pick means "I already know the questions, let me edit this one", which is the full form; a
   * dismissal means they changed their mind and should stay where they were.
   */
  closeTablePopup() {
    this.isTablePopupOpen = false;
    const picked = this.state.getSelectedWorkRequest();
    const changed = picked && picked !== this.selectionBeforePopup;
    this.selectionBeforePopup = null;

    if (this.mode() === 'resubmit' || (changed && this.mode() === 'wizard')) {
      this.mode.set('new');
    }
  }
}
