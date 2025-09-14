import { Component, inject, OnInit, output, signal } from '@angular/core';
import { CurrentSafeWorkService } from '../../../../services/current-items-services/current-safe-work.service';
import { Column } from '../../../../models/column.model';
import { SafeWorkDto } from '../../../../models/permits/safe-work.model';
import { TableComponent } from "../../../../shared/table/table.component";

@Component({
  selector: 'app-safe-work-table',
  imports: [TableComponent],
  templateUrl: './safe-work-table.component.html',
  styleUrl: './safe-work-table.component.css'
})
export class SafeWorkTableComponent implements OnInit{

  currentSafeWorkService = inject(CurrentSafeWorkService);

  rowLeftClickEvent = output<SafeWorkDto>();

  columns = signal<Column[]>(SafeWorkDto.toTableColumns());
  ngOnInit(): void {
    // throw new Error('Method not implemented.');
  }
    
  onRowLeftClick(sw: SafeWorkDto) {
    this.rowLeftClickEvent.emit(sw);
  }

}
