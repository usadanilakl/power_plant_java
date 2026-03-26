import {Component, Input, Output, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FlowDto} from '../../../../models/scheduler/flow.model';

@Component({
  selector: 'app-flow-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flow-selector">
      <select [ngModel]="selectedFlow?.id" (ngModelChange)="onFlowChange($event)">
        <option [ngValue]="null" disabled>Select a flow...</option>
        <option *ngFor="let flow of flows" [ngValue]="flow.id">{{ flow.name || 'Flow #' + flow.id }}</option>
      </select>
      <button class="btn-new" (click)="createFlow.emit()">+ New Flow</button>
      <button class="btn-delete" *ngIf="selectedFlow" (click)="onDeleteFlow()">Delete Flow</button>
    </div>
  `,
  styles: [`
    .flow-selector { display: flex; align-items: center; gap: 8px; }
    select {
      background: #181825; color: #cdd6f4; border: 1px solid #333;
      padding: 6px 10px; border-radius: 4px; font-size: 13px; min-width: 200px;
    }
    .btn-new {
      background: #3b82f6; color: #fff; border: none; padding: 6px 12px;
      border-radius: 4px; cursor: pointer; font-size: 12px; white-space: nowrap;
    }
    .btn-new:hover { background: #2563eb; }
    .btn-delete {
      background: #ef4444; color: #fff; border: none; padding: 6px 12px;
      border-radius: 4px; cursor: pointer; font-size: 12px; white-space: nowrap;
    }
    .btn-delete:hover { background: #dc2626; }
  `]
})
export class FlowSelectorComponent {
  @Input() flows: FlowDto[] = [];
  @Input() selectedFlow: FlowDto | null = null;
  @Output() flowSelected = new EventEmitter<FlowDto>();
  @Output() createFlow = new EventEmitter<void>();
  @Output() deleteFlow = new EventEmitter<FlowDto>();

  onFlowChange(flowId: number): void {
    const flow = this.flows.find(f => f.id === flowId);
    if (flow) this.flowSelected.emit(flow);
  }

  onDeleteFlow(): void {
    if (this.selectedFlow && confirm(`Delete flow "${this.selectedFlow.name}"? All tasks in it will be deleted.`)) {
      this.deleteFlow.emit(this.selectedFlow);
    }
  }
}
