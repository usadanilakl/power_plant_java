import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GuideHint } from '../guide-form.types';

@Component({
  selector: 'app-guide-hints-panel',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="hints-panel" [class.compact]="compact()">
      @for (hint of hints(); track $index) {
        <div class="hint" [class]="'hint-' + (hint.type || 'info')">
          <mat-icon class="hint-icon">{{ hint.icon || getDefaultIcon(hint.type) }}</mat-icon>
          <span class="hint-text">{{ hint.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .hints-panel {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        margin: 12px 0;
      }

      .hints-panel.compact {
        gap: 4px;
        margin: 8px 0;
      }

      .hint {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 8px;
        font-size: 13px;
        line-height: 1.4;
      }

      .hints-panel.compact .hint {
        padding: 6px 10px;
        font-size: 12px;
      }

      .hint-info {
        background: var(--info-bg, #e3f2fd);
        color: var(--info-color, #1565c0);
      }

      .hint-tip {
        background: var(--warning-bg, #fff8e1);
        color: var(--warning-dark, #f57c00);
      }

      .hint-warning {
        background: var(--error-bg, #ffebee);
        color: var(--error-color, #c62828);
      }

      .hint-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        margin-top: 1px;
      }

      .hints-panel.compact .hint-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .hint-text {
        flex: 1;
      }
    `,
  ],
})
export class GuideHintsPanelComponent {
  hints = input.required<GuideHint[]>();
  compact = input<boolean>(false);

  getDefaultIcon(type?: 'info' | 'tip' | 'warning'): string {
    switch (type) {
      case 'tip':
        return 'lightbulb';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }
}
