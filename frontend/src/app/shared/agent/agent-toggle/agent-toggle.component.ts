import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AgentChatService } from '../../../services/agent/agent-chat.service';

@Component({
  selector: 'app-agent-toggle',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <button mat-icon-button
      (click)="chatService.togglePanel()"
      [matTooltip]="chatService.isOpen() ? 'Close Jackson' : 'Ask Jackson'"
      class="agent-toggle-btn"
      [class.active]="chatService.isOpen()">
      <mat-icon>smart_toy</mat-icon>
    </button>
  `,
  styles: [`
    .agent-toggle-btn {
      color: var(--header-text);
      transition: color 0.2s;
    }
    .agent-toggle-btn.active {
      color: var(--accent-color);
    }
    .agent-toggle-btn:hover {
      color: var(--accent-color);
    }
  `]
})
export class AgentToggleComponent {
  chatService = inject(AgentChatService);
}
