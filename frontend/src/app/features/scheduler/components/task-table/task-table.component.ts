import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TableComponent} from '../../../../shared/table/refactored/table.component';
import {Column} from '../../../../models/column.model';
import {SchedulerStateService} from '../../../../services/scheduler/scheduler-state.service';
import {SchedulerTaskDto} from '../../../../models/scheduler/scheduler-task.model';
import {FlowSelectorComponent} from '../flow-selector/flow-selector.component';
import {FlowDto} from '../../../../models/scheduler/flow.model';
import {TableSearchService} from '../../../../shared/table/refactored/services/table-search.service';
import {TableStateService} from '../../../../shared/table/refactored/services/table-state.service';
import {TableSelectionService} from '../../../../shared/table/refactored/services/table-selection.service';
import {TableSortService} from '../../../../shared/table/refactored/services/table-sort.service';
import {TableDragService} from '../../../../shared/table/refactored/services/table-drag.service';
import {TableResizeService} from '../../../../shared/table/refactored/services/table-resize.service';
import {TableSyncService} from '../../../../shared/table/refactored/services/table-sync.service';
import {TableClickService} from '../../../../shared/table/refactored/services/table-click.service';
import {TableControlsService} from '../../../../shared/table/refactored/services/table-controls.service';
import {TableDataService} from '../../../../shared/table/refactored/services/table-data.service';

@Component({
  selector: 'app-task-table',
  standalone: true,
  imports: [CommonModule, TableComponent, FlowSelectorComponent],
  providers: [
    TableSearchService,
    TableStateService,
    TableSelectionService,
    TableSortService,
    TableDragService,
    TableResizeService,
    TableSyncService,
    TableClickService,
    TableControlsService,
    TableDataService,
  ],
  template: `
    <div class="task-table-container">
      <div class="table-toolbar">
        <app-flow-selector
          [flows]="(state.flows$ | async) ?? []"
          [selectedFlow]="state.activeFlow()"
          (flowSelected)="onFlowSelected($event)"
          (createFlow)="onCreateFlow()">
        </app-flow-selector>
      </div>

      <div class="table-wrapper" *ngIf="state.activeFlow()">
        <app-table
          [tableId]="'scheduler-task-table'"
          [items]="flatTasks()"
          [columns]="columns()"
          [isTableIsolated]="true">
        </app-table>
      </div>

      <div class="empty" *ngIf="!state.activeFlow()">
        Select a flow to view tasks.
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex; flex-direction: column; height: calc(100vh - 120px);
      overflow: hidden;
    }
    .task-table-container {
      display: flex; flex-direction: column; flex: 1; min-height: 0;
      background: #11111b; color: #cdd6f4;
    }
    .table-toolbar { padding: 8px 16px; background: #1e1e2e; border-bottom: 1px solid #333; flex-shrink: 0; }
    .table-wrapper { flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
    .empty { display: flex; align-items: center; justify-content: center; flex: 1; color: #555; }
  `]
})
export class TaskTableComponent implements OnInit {
  state = inject(SchedulerStateService);

  columns = signal<Column[]>([
    {id: 'name', header: 'Name', accessorKey: 'name', filterable: true, sortable: true, width: 200},
    {id: 'taskLevel', header: 'Level', accessorKey: 'taskLevel', filterable: true, sortable: true, width: 80},
    {id: 'taskType', header: 'Type', accessorKey: 'taskType', filterable: true, sortable: true, width: 100},
    {id: 'statusName', header: 'Status', accessorKey: 'statusName', filterable: true, sortable: true, width: 100},
    {id: 'description', header: 'Description', accessorKey: 'description', filterable: true, sortable: true, width: 250},
    {id: 'assigneeName', header: 'Assignee', accessorKey: 'assigneeName', filterable: true, sortable: true, width: 120},
    {id: 'dueDate', header: 'Due Date', accessorKey: 'dueDate', sortable: true, width: 100},
    {id: 'prerequisiteCount', header: 'Prereqs', accessorFn: (item: any) => String(item.prerequisiteIds?.length ?? 0), sortable: true, width: 70},
    {id: 'stepCount', header: 'Steps', accessorFn: (item: any) => String(item.subTasks?.length ?? 0), sortable: true, width: 70},
    {id: 'attachmentCount', header: 'Files', accessorFn: (item: any) => String(item.attachments?.length ?? 0), sortable: true, width: 60},
    {id: 'referenceCount', header: 'Refs', accessorFn: (item: any) => String(item.references?.length ?? 0), sortable: true, width: 60},
  ]);

  // Flatten all tasks (including steps) into a single list for the table
  flatTasks = computed(() => {
    const all = this.state.allTasks();
    const result: SchedulerTaskDto[] = [];
    for (const task of all) {
      result.push(task);
      if (task.subTasks?.length) {
        for (const step of task.subTasks) {
          result.push(step);
        }
      }
    }
    return result;
  });

  ngOnInit(): void {
    this.state.loadFlows();
  }

  onFlowSelected(flow: FlowDto): void {
    this.state.setActiveFlow(flow);
  }

  onCreateFlow(): void {
    const name = prompt('Flow name:');
    if (!name) return;
    this.state.createFlow(new FlowDto({name}));
  }
}
