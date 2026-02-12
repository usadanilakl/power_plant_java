import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormStateService } from '../services/form-state.service';

@Component({
  selector: 'app-page-navigator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-navigator.component.html',
  styleUrl: './page-navigator.component.css',
})
export class PageNavigatorComponent {
  private formState = inject(FormStateService);

  currentPage = this.formState.currentPage;
  totalPages = this.formState.totalPages;

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.formState.goToPage(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.formState.goToPage(this.currentPage() + 1);
    }
  }

  addPage(): void {
    this.formState.goToPage(this.totalPages() + 1);
  }
}
