import { Component, signal } from '@angular/core';
import { WorkRequestFormComponent } from "./work-request-form/work-request-form.component";
import { PopupComponent } from "../../shared/menus/popup/popup.component";
import { WorkRequestTableComponent } from "./work-request-table/work-request-table.component";

@Component({
  selector: 'app-work-request',
  standalone: true,
  imports: [WorkRequestFormComponent, PopupComponent, WorkRequestTableComponent],
  templateUrl: './work-request.component.html',
  styleUrl: './work-request.component.css'
})
export class WorkRequestComponent {

  mode = signal<'select' | 'new' | 'resubmit'>('select');
  isTablePopupOpen = false;

  selectNew() {
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
