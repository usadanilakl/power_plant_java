import { Component, inject, OnInit, output, signal } from '@angular/core';
import { CurrentConfinedSpaceService } from '../../../../services/current-items-services/current-confined-space.service';
import { TableComponent } from "../../../../shared/table/table.component";
import { ConfinedSpaceDto } from '../../../../models/permits/confined-space.model';
import { Column } from '../../../../models/column.model';

@Component({
  selector: 'app-confined-space-table',
  imports: [TableComponent],
  templateUrl: './confined-space-table.component.html',
  styleUrl: './confined-space-table.component.css'
})
export class ConfinedSpaceTableComponent implements OnInit{

  rowLeftClickEvent = output<ConfinedSpaceDto>();

  currentConfinedSpaceService = inject(CurrentConfinedSpaceService);
  columns = signal<Column[]>([]);

  ngOnInit(): void {
    this.columns.set(ConfinedSpaceDto.toTableColumns() as Column[]);
  }

  onRowLeftClick(confinedSpace: ConfinedSpaceDto) {
    this.rowLeftClickEvent.emit(confinedSpace);
  }
}
