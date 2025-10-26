import { Component } from '@angular/core';
import { SpaceFormComponent } from "./space-form/space-form.component";

@Component({
  selector: 'app-space',
  imports: [SpaceFormComponent],
  templateUrl: './space.component.html',
  styleUrl: './space.component.css'
})
export class SpaceComponent {

  isTablePopupOpen = false;
  openTablePopup() {
    this.isTablePopupOpen = true;
  }
  closeTablePopup() {
    this.isTablePopupOpen = false;
  }

}
