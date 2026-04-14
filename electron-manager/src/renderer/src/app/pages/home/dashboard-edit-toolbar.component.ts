import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetDefinition, LayoutPreset, WidgetId, WIDGET_REGISTRY } from '../../services/dashboard-layout.service';

@Component({
  selector: 'app-dashboard-edit-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="edit-toolbar">
      <div class="toolbar-top">
        <div class="toolbar-left">
          <span class="material-icons toolbar-icon">dashboard_customize</span>
          <span class="toolbar-label">Editing Layout</span>
          <span class="preset-name">({{ currentPresetName }})</span>
        </div>
        <div class="toolbar-actions">
          <select class="preset-select" (change)="onPresetChange($event)">
            <option value="" disabled selected>Apply Template...</option>
            <option *ngFor="let p of presets" [value]="p.name">{{ p.name }}</option>
          </select>
          <button class="btn btn-ghost btn-sm" (click)="applyPreset.emit('Default')" title="Reset to Default">
            <span class="material-icons btn-icon">restart_alt</span> Reset
          </button>
          <button class="btn btn-secondary btn-sm" (click)="done.emit()">
            <span class="material-icons btn-icon">check</span> Done
          </button>
          <button class="btn btn-ghost btn-sm" (click)="cancel.emit()">Cancel</button>
        </div>
      </div>
      <div class="toolbar-hint">
        <span class="material-icons hint-icon">info_outline</span>
        Drag to reposition, resize from edges, hide with the eye button
      </div>
      <div class="hidden-tray" *ngIf="hiddenWidgets.length > 0">
        <span class="tray-label">Hidden:</span>
        <button class="hidden-chip" *ngFor="let hw of hiddenWidgets" (click)="restoreWidget.emit(hw.id)">
          <span class="material-icons chip-icon" [style.color]="hw.iconColor">{{ hw.icon }}</span>
          <span>{{ hw.title }}</span>
          <span class="material-icons chip-add">add</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .edit-toolbar {
      background-color: var(--bg-card);
      border: 1px solid var(--accent-primary);
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 16px;
    }
    .toolbar-top {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 12px;
    }
    .toolbar-left { display: flex; align-items: center; gap: 8px; }
    .toolbar-icon { font-size: 20px; color: var(--accent-primary); }
    .toolbar-label { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .preset-name { font-size: 12px; color: var(--text-muted); }
    .toolbar-actions { display: flex; align-items: center; gap: 8px; }
    .preset-select {
      background-color: var(--bg-secondary); color: var(--text-primary);
      border: 1px solid var(--border-color); border-radius: 6px;
      padding: 5px 8px; font-size: 12px; cursor: pointer; outline: none;
    }
    .preset-select:focus { border-color: var(--accent-primary); }
    .btn-sm { padding: 5px 12px; font-size: 12px; display: flex; align-items: center; gap: 4px; }
    .btn-icon { font-size: 16px; }
    .btn-ghost {
      background: transparent; border: 1px solid var(--border-color);
      color: var(--text-secondary); border-radius: 6px; cursor: pointer;
    }
    .btn-ghost:hover { border-color: var(--text-muted); color: var(--text-primary); }
    .toolbar-hint {
      display: flex; align-items: center; gap: 6px;
      margin-top: 8px; font-size: 11px; color: var(--text-muted);
    }
    .hint-icon { font-size: 14px; }
    .hidden-tray {
      display: flex; align-items: center; gap: 8px;
      margin-top: 10px; padding-top: 10px;
      border-top: 1px solid var(--border-color); flex-wrap: wrap;
    }
    .tray-label { font-size: 12px; color: var(--text-muted); }
    .hidden-chip {
      display: flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 16px;
      background-color: var(--bg-secondary); border: 1px solid var(--border-color);
      color: var(--text-secondary); font-size: 12px; cursor: pointer; transition: all 150ms;
    }
    .hidden-chip:hover { border-color: var(--accent-primary); color: var(--text-primary); }
    .chip-icon { font-size: 16px; }
    .chip-add { font-size: 14px; color: var(--accent-primary); }
  `]
})
export class DashboardEditToolbarComponent {
  @Input() draft: { widgetId: WidgetId; visible: boolean }[] = [];
  @Input() presets: LayoutPreset[] = [];
  @Input() currentPresetName = 'Custom';
  @Output() applyPreset = new EventEmitter<string>();
  @Output() restoreWidget = new EventEmitter<WidgetId>();
  @Output() done = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  get hiddenWidgets(): WidgetDefinition[] {
    return this.draft
      .filter(w => !w.visible)
      .map(w => WIDGET_REGISTRY.find(r => r.id === w.widgetId)!)
      .filter(Boolean);
  }

  onPresetChange(event: Event): void {
    const name = (event.target as HTMLSelectElement).value;
    if (name) {
      this.applyPreset.emit(name);
      (event.target as HTMLSelectElement).selectedIndex = 0;
    }
  }
}
