import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RfLotoPointLeftMenuComponent } from '../rf-loto-point-left-menu/rf-loto-point-left-menu.component';
import { RfLotoPointNavTableComponent } from './rf-loto-point-nav-table.component';

export type LotoPointDisplayMode = 'table' | 'toggle-menu';

/**
 * Reusable LOTO point left panel with two display modes: toggle-menu (tree) and table.
 *
 * When `displayMode` input is provided, the component uses that value and hides
 * the internal toggle (parent controls the mode). When not provided, the component
 * manages its own mode state and shows toggle buttons.
 */
@Component({
  selector: 'app-rf-loto-point-left-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule, RfLotoPointLeftMenuComponent, RfLotoPointNavTableComponent],
  template: `
    <div class="left-panel-wrapper">
      @if (!displayMode()) {
        <div class="mode-toggle-bar">
          <div class="mode-toggle">
            <button
              class="mode-button"
              [class.active]="currentMode() === 'table'"
              (click)="setMode('table')"
              title="Table View"
            >
              <mat-icon>view_list</mat-icon>
            </button>
            <button
              class="mode-button"
              [class.active]="currentMode() === 'toggle-menu'"
              (click)="setMode('toggle-menu')"
              title="Tree View"
            >
              <mat-icon>account_tree</mat-icon>
            </button>
          </div>
        </div>
      }

      <div class="panel-content">
        @if (currentMode() === 'toggle-menu') {
          <app-rf-loto-point-left-menu></app-rf-loto-point-left-menu>
        } @else {
          <app-rf-loto-point-nav-table
            [tableId]="'loto-point-left-panel-table'"
            [isTableIsolated]="false"
            [loadMoreEnabled]="true"
            [enableDragDrop]="false"
          ></app-rf-loto-point-nav-table>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      flex: 1;
      min-height: 0;
    }

    .left-panel-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      flex: 1;
      min-height: 0;
    }

    .mode-toggle-bar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 8px 12px;
      background: var(--primary-background, #ffffff);
      border-bottom: 1px solid var(--border-color, #e0e0e0);
      flex-shrink: 0;
    }

    .mode-toggle {
      display: flex;
      gap: 4px;
      background: var(--secondary-background, #f5f5f5);
      padding: 4px;
      border-radius: 6px;
    }

    .mode-button {
      padding: 6px 10px;
      background: transparent;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-text, #333);
    }

    .mode-button mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .mode-button:hover {
      background: rgba(33, 150, 243, 0.1);
    }

    .mode-button.active {
      background: var(--primary-color, #2196F3);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      color: white;
    }

    .mode-button.active mat-icon {
      color: white;
    }

    .panel-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .panel-content app-rf-loto-point-left-menu,
    .panel-content app-rf-loto-point-nav-table {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }
  `],
})
export class RfLotoPointLeftPanelComponent {
  /** External display mode — when provided, hides internal toggle */
  displayMode = input<LotoPointDisplayMode | null>(null);

  /** Internal display mode (used when no external mode provided) */
  internalDisplayMode = signal<LotoPointDisplayMode>('toggle-menu');

  /** Resolved current mode */
  currentMode = computed(() => this.displayMode() ?? this.internalDisplayMode());

  setMode(mode: LotoPointDisplayMode): void {
    this.internalDisplayMode.set(mode);
  }
}
