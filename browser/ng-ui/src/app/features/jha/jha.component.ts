import { Component, inject } from '@angular/core';
import { JhaFormComponent } from "./jha-form/jha-form.component";
import { PopupComponent } from "../../shared/menus/popup/popup.component";
import { JhaTableComponent } from "./jha-table/jha-table.component";
import { JhaStateService } from './jha-state.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-jha',
  standalone: true,
  imports: [JhaFormComponent, PopupComponent, JhaTableComponent, DatePipe],
  templateUrl: './jha.component.html',
  styleUrl: './jha.component.css'
})
export class JhaComponent {

  jhaStateService = inject(JhaStateService);

  isTablePopupOpen = false;
  openTablePopup() {
    this.isTablePopupOpen = true;
  }
  closeTablePopup() {
    this.isTablePopupOpen = false;
  }

}
