import { Component, DestroyRef, inject, OnInit, output } from '@angular/core';
import { CurrentLotoStandardService } from '../../../services/current-items-services/current-loto-standard.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TableComponent } from "../../../shared/table/table.component";
import { map } from 'rxjs';
import { LotoStandardDto } from '../../../models/loto/loto-standard.model';
import { Column } from '../../../models/column.model';

@Component({
  selector: 'app-loto-standard-table',
  imports: [TableComponent],
  standalone: true,
  templateUrl: './loto-standard-table.component.html',
  styleUrl: './loto-standard-table.component.css'
})
export class LotoStandardTableComponent implements OnInit {
    private currentLotoStandardService = inject(CurrentLotoStandardService);
    private destroyRef = inject(DestroyRef);

    lotoStandards$ = this.currentLotoStandardService.allStandards$
    columns: Column[] = LotoStandardDto.toTableColumns();

    rowTableLeftClcikEvent = output<LotoStandardDto>();

    ngOnInit(): void {
    //   this.lotoStandards$.pipe(
    //     takeUntilDestroyed(this.destroyRef)
    //     )
    //     .subscribe(lotoStandards => {
    //       lotoStandards.forEach(lotoStandard => console.log(lotoStandard));
    //     });
    }

    onStandardTableRowClick(lotoStandard: LotoStandardDto): void {
      this.currentLotoStandardService.setCurrentStandard(lotoStandard.id);
      this.rowTableLeftClcikEvent.emit(lotoStandard);
    }
}
