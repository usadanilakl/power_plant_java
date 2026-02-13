import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { JhaFormComponent } from "./jha-form/jha-form.component";
import { PopupComponent } from "../../shared/menus/popup/popup.component";
import { JhaTableComponent } from "./jha-table/jha-table.component";
import { JhaPaperPreviewComponent } from "./jha-paper-preview/jha-paper-preview.component";
import { JhaStateService } from './jha-state.service';
import { Jha } from '../../models/permits/jha.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-jha',
  standalone: true,
  imports: [JhaFormComponent, PopupComponent, JhaTableComponent, JhaPaperPreviewComponent, DatePipe],
  templateUrl: './jha.component.html',
  styleUrl: './jha.component.css'
})
export class JhaComponent {

  jhaStateService = inject(JhaStateService);
  selectedWr = this.jhaStateService.selectedWorkRequestSignal;

  previewJha = signal<Jha>(new Jha());
  showPreview = false;

  private initialJha = toSignal(this.jhaStateService.selectedJha$, { initialValue: new Jha() });

  isTablePopupOpen = false;
  openTablePopup() {
    this.isTablePopupOpen = true;
  }
  closeTablePopup() {
    this.isTablePopupOpen = false;
  }
  onJhaReused() {
    this.closeTablePopup();
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
    if (this.showPreview) {
      this.previewJha.set(this.initialJha() ?? new Jha());
    }
  }

  onJhaChanged(jha: Jha) {
    this.previewJha.set(jha);
  }
}
