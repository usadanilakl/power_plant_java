import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { CurrentPrintableFormService } from '../../../services/forms/current-printable-form.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-page-navigator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-navigator.component.html',
  styleUrl: './page-navigator.component.css'
})
export class PageNavigatorComponent {
  private currentPrintableFormService = inject(CurrentPrintableFormService);

  currentPage = this.currentPrintableFormService.currentPage;
  totalPages = this.currentPrintableFormService.totalPages

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPrintableFormService.goToPage(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPrintableFormService.goToPage(this.currentPage() + 1);
    }
  }

  addPage(): void {
    this.currentPrintableFormService.goToPage(this.totalPages() + 1);
  }
}
