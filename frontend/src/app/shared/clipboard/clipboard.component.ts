import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClipboardService } from './clipboard.service';

@Component({
  selector: 'app-clipboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './clipboard.component.html',
  styleUrl: './clipboard.component.css',
})
export class ClipboardComponent {
  private clipboardService = inject(ClipboardService);

  sections = this.clipboardService.sections;
  activeSection = this.clipboardService.activeSection;
  isExpanded = this.clipboardService.isClipboardExpanded;

  // Computed signal to show item count
  itemCount = computed(() => {
    const active = this.activeSection();
    return active?.items.length ?? 0;
  });

  toggleClipboard(): void {
    this.isExpanded.update((value) => !value);
  }

  setActiveSection(sectionId: string): void {
    this.clipboardService.setActiveSection(sectionId);
  }

  deleteSection(sectionId: string): void {
    this.clipboardService.deleteSection(sectionId);
  }

  clearSection(sectionId: string): void {
    this.clipboardService.clearSection(sectionId);
  }

  removeItem(sectionId: string, itemIndex: number): void {
    this.clipboardService.removeItemFromSection(sectionId, itemIndex);
  }

  copyToClipboard(item: any): void {
    const text = JSON.stringify(item, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      console.log('Item copied to system clipboard');
    });
  }
}
