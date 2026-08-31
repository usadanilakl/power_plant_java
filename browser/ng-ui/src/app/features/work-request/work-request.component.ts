import { Component, signal } from '@angular/core';
import { WorkRequestFormComponent } from "./work-request-form/work-request-form.component";
import { WorkRequestWizardComponent } from "./work-request-wizard/work-request-wizard.component";
import { PopupComponent } from "../../shared/menus/popup/popup.component";
import { WorkRequestTableComponent } from "./work-request-table/work-request-table.component";

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
    this.isTablePopupOpen = true;
  }

  closeTablePopup() {
    this.isTablePopupOpen = false;
    if (this.mode() === 'resubmit') {
      this.mode.set('new');
    }
  }
}
