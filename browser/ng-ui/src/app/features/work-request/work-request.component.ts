import { Component } from '@angular/core';
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

  isTablePopupOpen = false;
  openTablePopup() {
    this.isTablePopupOpen = true;
  }
  closeTablePopup() {
    this.isTablePopupOpen = false;
  }
}
