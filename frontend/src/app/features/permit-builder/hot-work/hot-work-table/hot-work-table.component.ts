import { Component, inject, OnInit, output, signal } from '@angular/core';
import { CurrentHotWorkService } from '../../../../services/current-items-services/current-hot-work.service';
import { Column } from '../../../../models/column.model';
import { HotWorkDto } from '../../../../models/permits/hot-work.model';
import { TableComponent } from "../../../../shared/table/table.component";

@Component({
  selector: 'app-hot-work-table',
  standalone: true,
  imports: [TableComponent],
  templateUrl: './hot-work-table.component.html',
  styleUrl: './hot-work-table.component.css'
})
export class HotWorkTableComponent implements OnInit{

  currentHotWorkService = inject(CurrentHotWorkService);

  rowLeftClickEvent = output<HotWorkDto>();

  columns = signal<Column[]>([]);
currentConfinedSpaceService: any;
  ngOnInit(): void {
    this.columns.set(HotWorkDto.toTableColumns() as Column[]);
  }
  
  onRowLeftClick(hw: HotWorkDto) {
    this.rowLeftClickEvent.emit(hw);
  }

}
