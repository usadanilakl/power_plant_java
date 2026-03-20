import { Component, inject } from '@angular/core';
import { ServerStatusService } from '../../services/server-status.service';

@Component({
  selector: 'app-server-status',
  standalone: true,
  template: `
    <button class="status-indicator" (click)="statusService.checkNow()" [title]="statusService.isOnline() ? 'Server Online' : 'Server Offline'">
      <span class="dot" [class.online]="statusService.isOnline()" [class.offline]="!statusService.isOnline()"></span>
    </button>
  `,
  styles: [`
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .status-indicator:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .dot.online {
      background: #4caf50;
      box-shadow: 0 0 6px #4caf50;
      animation: pulse 2s infinite;
    }
    .dot.offline {
      background: #f44336;
      box-shadow: 0 0 6px #f44336;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `]
})
export class ServerStatusComponent {
  statusService = inject(ServerStatusService);
}
