import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { JhaFormComponent } from "./jha-form/jha-form.component";
import { PopupComponent } from "../../shared/menus/popup/popup.component";
import { JhaTableComponent } from "./jha-table/jha-table.component";
import { JhaPaperPreviewComponent } from "./jha-paper-preview/jha-paper-preview.component";
import { JhaStateService } from './jha-state.service';
import { Jha } from '../../models/permits/jha.model';
import { IAttachment } from '../../models/permits/attachment.model';
import { WorkRequest } from '../../models/permits/work-request.model';
import { DatePipe } from '@angular/common';
import { GlobalMessageService } from '../../services/global-message.service';

@Component({
  selector: 'app-jha',
  standalone: true,
  imports: [JhaFormComponent, PopupComponent, JhaTableComponent, JhaPaperPreviewComponent, DatePipe],
  templateUrl: './jha.component.html',
  styleUrl: './jha.component.css'
})
export class JhaComponent {

  jhaStateService = inject(JhaStateService);
  globalMessageService = inject(GlobalMessageService);
  selectedWr = this.jhaStateService.selectedWorkRequestSignal;
  workRequestsForJha = toSignal(this.jhaStateService.workRequestsForJha$, { initialValue: [] });

  submissionMode = signal<'form' | 'file'>('form');
  selectedFiles = signal<IAttachment[]>([]);
  hasCamera = 'mediaDevices' in navigator && 'ontouchstart' in window;

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

  selectWrForNewJha(wr: WorkRequest) {
    this.jhaStateService.selectWorkRequestForJha(wr);
  }

  selectWrForExistingJha(wr: WorkRequest) {
    this.jhaStateService.selectWorkRequestForJha(wr);
    this.isTablePopupOpen = true;
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

  // ====================== File Mode ======================

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const newFiles: IAttachment[] = [];
    const fileArray = Array.from(input.files);
    let processed = 0;

    for (const file of fileArray) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        newFiles.push({
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          base64Content: base64,
          type: file.type?.startsWith('image/') ? 'photo' : 'document'
        });
        processed++;
        if (processed === fileArray.length) {
          this.selectedFiles.set([...this.selectedFiles(), ...newFiles]);
        }
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  submitFileOnly() {
    if (this.selectedFiles().length === 0) {
      this.globalMessageService.showMessage('Please select at least one file.', 'red');
      return;
    }
    this.jhaStateService.submitFileOnlyJha(this.selectedFiles());
  }
}
