import { Component, inject, output, signal } from '@angular/core';
import { TableComponent } from "../../../../shared/table/table.component";
import { CurrentDailyPermitPackageService } from '../../../../services/current-items-services/current-daily-permit-package.service';
import { DailyPermitPackageDto } from '../../../../models/permits/dailt-permit-package.model';
import { Column } from '../../../../models/column.model';

@Component({
  selector: 'app-daily-permit-package-table',
  standalone: true,
  imports: [TableComponent],
  templateUrl: './daily-permit-package-table.component.html',
  styleUrl: './daily-permit-package-table.component.css'
})
export class DailyPermitPackageTableComponent {

  currentDailyPermitPackageService = inject(CurrentDailyPermitPackageService);
  rowLeftClickEvent = output<DailyPermitPackageDto>();
  columns = signal<Column[]>(DailyPermitPackageDto.toTableColumns() as Column[]);
      
    onRowLeftClick(sw: DailyPermitPackageDto) {
      this.rowLeftClickEvent.emit(sw);
    }
}
