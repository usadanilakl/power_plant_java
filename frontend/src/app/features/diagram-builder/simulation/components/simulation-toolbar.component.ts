import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationStateService } from '../services/simulation-state.service';

@Component({
  selector: 'app-simulation-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sim-toolbar">
      <button class="sim-toggle"
        [class.active]="simState.isSimulating()"
        (click)="onToggle.emit()">
        {{ simState.isSimulating() ? '⏹ Stop' : '▶ Simulate' }}
      </button>
      @if (simState.isSimulating()) {
        <span class="sim-badge">SIMULATION ACTIVE</span>
        <span class="sim-time">t={{ simState.simTimeSeconds() }}s</span>
        <button class="sim-btn" (click)="onReset.emit()">Reset</button>
      }
    </div>
  `,
  styles: [`
    .sim-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sim-toggle {
      padding: 4px 12px;
      border: 1px solid #444;
      border-radius: 4px;
      background: #2a2a2a;
      color: #ccc;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.15s;
    }
    .sim-toggle:hover { background: #3a3a3a; }
    .sim-toggle.active {
      background: #b71c1c;
      border-color: #f44336;
      color: #fff;
    }
    .sim-badge {
      font-size: 10px;
      color: #f44336;
      font-weight: 700;
      letter-spacing: 1px;
      animation: pulse 1.5s ease-in-out infinite;
    }
    .sim-time {
      font-size: 11px;
      color: #aaa;
      font-family: monospace;
    }
    @keyframes pulse { 50% { opacity: 0.5; } }
    .sim-btn {
      padding: 4px 8px;
      border: 1px solid #444;
      border-radius: 4px;
      background: #2a2a2a;
      color: #ccc;
      cursor: pointer;
      font-size: 11px;
    }
    .sim-btn:hover { background: #3a3a3a; }
  `],
})
export class SimulationToolbarComponent {
  simState = inject(SimulationStateService);
  onToggle = output<void>();
  onReset = output<void>();
}
