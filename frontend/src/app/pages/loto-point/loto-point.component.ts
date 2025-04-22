import { Component, inject } from '@angular/core';
import { LotoPointTableComponent } from "../../features/loto-points/loto-point-table/loto-point-table.component";
import { Column } from '../../models/column.model';
import { LotoPointService } from '../../services/loto/loto-point.service';

@Component({
  selector: 'app-loto-point',
  imports: [LotoPointTableComponent],
  templateUrl: './loto-point.component.html',
  styleUrl: './loto-point.component.css'
})
export class LotoPointComponent {

  private lotoPointService = inject(LotoPointService);

  cellDoubleClick(item: any, column: Column) {
    console.log('Double clicked on cell:', item, column);
  }

}
