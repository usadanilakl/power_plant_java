import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type PermitDisplayMode = 'table' | 'toggle-menu';

@Component({
  selector: 'app-permit-left-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="left-panel-wrapper">
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

        <div class="form-view-toggle">
          <button
            class="form-view-button"
            [class.active]="!isPaperView()"
            (click)="toggleFormView(false)"
            title="Web Form"
          >
            <mat-icon>edit_note</mat-icon>
          </button>
          <button
            class="form-view-button"
            [class.active]="isPaperView()"
            (click)="toggleFormView(true)"
            title="Paper Form"
          >
            <mat-icon>print</mat-icon>
          </button>
        </div>
      </div>

      <div class="panel-content">
        @if (currentMode() === 'toggle-menu') {
          <ng-content select="[menu]"></ng-content>
        } @else {
          <ng-content select="[table]"></ng-content>
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
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: var(--primary-background, #ffffff);
      border-bottom: 1px solid var(--border-color, #e0e0e0);
      flex-shrink: 0;
    }

    .mode-toggle, .form-view-toggle {
      display: flex;
      gap: 4px;
      background: var(--secondary-background, #f5f5f5);
      padding: 4px;
      border-radius: 6px;
    }

    .mode-button, .form-view-button {
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

    .mode-button mat-icon, .form-view-button mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .mode-button:hover, .form-view-button:hover {
      background: rgba(33, 150, 243, 0.1);
    }

    .mode-button.active, .form-view-button.active {
      background: var(--primary-color, #2196F3);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      color: white;
    }

    .mode-button.active mat-icon, .form-view-button.active mat-icon {
      color: white;
    }

    .panel-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .panel-content > * {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      flex: 1;
      min-height: 0;
    }
  `],
})
export class PermitLeftPanelComponent {
  isPaperViewInput = input<boolean>(false);
  formViewChanged = output<boolean>();

  internalDisplayMode = signal<PermitDisplayMode>('toggle-menu');
  currentMode = computed(() => this.internalDisplayMode());

  isPaperView = computed(() => this.isPaperViewInput());

  setMode(mode: PermitDisplayMode): void {
    this.internalDisplayMode.set(mode);
  }

  toggleFormView(isPaper: boolean): void {
    this.formViewChanged.emit(isPaper);
  }
}
