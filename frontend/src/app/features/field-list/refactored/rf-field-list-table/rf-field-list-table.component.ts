import { Component, inject, output, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TableComponent } from '../../../../shared/table/refactored/table.component';
import { RfFieldListStateService } from '../services/rf-field-list-state.service';
import { FieldListItemDto } from '../../../../models/field-list/field-list-item.model';
import { Column } from '../../../../models/column.model';

@Component({
  selector: 'app-rf-field-list-table',
  standalone: true,
  imports: [TableComponent],
  template: `
    <app-table
      [tableId]="'field-list-items'"
      [items]="items()"
      [columns]="columns()"
      (selectedItemsEvent)="selectedItemsEvent.emit($event)"
      (rowDoubleClicked)="rowDoubleClickedEvent.emit($event)">
    </app-table>
  `,
  styles: [`:host { display: block; flex: 1; overflow: hidden; }`]
})
export class RfFieldListTableComponent {
  private stateService = inject(RfFieldListStateService);

  selectedItemsEvent = output<FieldListItemDto[]>();
  rowDoubleClickedEvent = output<FieldListItemDto>();

  private items$ = toSignal(this.stateService.allItems$, { initialValue: [] as FieldListItemDto[] });
  items = computed(() => this.items$());

  columns = signal<Column[]>(FieldListItemDto.toTableColumns());
}
