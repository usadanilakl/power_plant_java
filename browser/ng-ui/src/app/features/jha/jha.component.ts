import { Component } from '@angular/core';
import { JhaFormComponent } from "./jha-form/jha-form.component";
import { PopupComponent } from "../../shared/menus/popup/popup.component";
import { JhaTableComponent } from "./jha-table/jha-table.component";

@Component({
  selector: 'app-jha',
  standalone: true,
  imports: [JhaFormComponent, PopupComponent, JhaTableComponent],
  templateUrl: './jha.component.html',
  styleUrl: './jha.component.css'
})
export class JhaComponent {

  isTablePopupOpen = false;
  openTablePopup() {
    this.isTablePopupOpen = true;
  }
  closeTablePopup() {
    this.isTablePopupOpen = false;
  }

}
