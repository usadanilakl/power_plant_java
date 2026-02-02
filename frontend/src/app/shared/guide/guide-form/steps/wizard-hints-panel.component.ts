import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WizardHint } from '../wizard-stack.types';

@Component({
  selector: 'app-wizard-hints-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="hints-panel">
      @for (hint of hints(); track hint.message) {
        <div class="hint-item" [class]="hint.type || 'info'">
          <mat-icon class="hint-icon">{{ getIcon(hint) }}</mat-icon>
          <span class="hint-message">{{ hint.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .hints-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: var(--secondary-background, #f9f9f9);
      border-radius: 8px;
      border-left: 3px solid var(--accent-color, #1976d2);
    }

    .hint-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 13px;
      line-height: 1.5;
    }

    .hint-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .hint-item.info .hint-icon {
      color: var(--accent-color, #1976d2);
    }

    .hint-item.tip .hint-icon {
      color: #ff9800;
    }

    .hint-item.warning .hint-icon {
      color: #f44336;
    }

    .hint-item.example .hint-icon {
      color: #4caf50;
    }

    .hint-message {
      color: var(--secondary-text, #555);
    }
  `],
})
export class WizardHintsPanelComponent {
  hints = input.required<WizardHint[]>();

  getIcon(hint: WizardHint): string {
    if (hint.icon) return hint.icon;

    switch (hint.type) {
      case 'tip': return 'lightbulb';
      case 'warning': return 'warning';
      case 'example': return 'code';
      default: return 'info';
    }
  }
}
