import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface BreadcrumbItem {
  name: string;
  stepIndex: number;
  isActive: boolean;
}

@Component({
  selector: 'app-wizard-breadcrumb',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="breadcrumb-container">
      @for (item of trail(); track item.name; let i = $index) {
        @if (i > 0) {
          <mat-icon class="separator">chevron_right</mat-icon>
        }
        <span
          class="breadcrumb-item"
          [class.active]="item.isActive"
          [class.clickable]="!item.isActive && i === trail().length - 2"
          (click)="onItemClick(item, i)"
        >
          {{ item.name }}
        </span>
      }
    </div>
  `,
  styles: [`
    .breadcrumb-container {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .separator {
      font-size: 14px;
      width: 14px;
      height: 14px;
      margin: 0 2px;
      color: #999;
    }

    .breadcrumb-item {
      padding: 2px 6px;
      border-radius: 4px;
    }

    .breadcrumb-item.active {
      color: #1976d2;
      font-weight: 500;
    }

    .breadcrumb-item.clickable {
      cursor: pointer;
    }

    .breadcrumb-item.clickable:hover {
      background: #e3f2fd;
      color: #1976d2;
    }
  `],
})
export class WizardBreadcrumbComponent {
  trail = input<BreadcrumbItem[]>([]);
  navigateBack = output<void>();

  onItemClick(item: BreadcrumbItem, index: number): void {
    // Only allow clicking the parent (second to last item)
    if (!item.isActive && index === this.trail().length - 2) {
      this.navigateBack.emit();
    }
  }
}
