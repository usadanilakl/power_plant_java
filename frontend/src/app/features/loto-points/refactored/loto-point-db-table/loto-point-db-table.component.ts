import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { RfLotoPointTableComponent } from '../rf-loto-point-table/rf-loto-point-table.component';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { LotoPointDbTableClickService } from './loto-point-db-table-click.service';
import { TableSearchService } from '../../../../shared/table/refactored/services/table-search.service';
import { TableControlsService } from '../../../../shared/table/refactored/services/table-controls.service';
import { TableStateService } from '../../../../shared/table/refactored/services/table-state.service';
import { TableDataService } from '../../../../shared/table/refactored/services/table-data.service';
import { TableSelectionService } from '../../../../shared/table/refactored/services/table-selection.service';
import { TableSortService } from '../../../../shared/table/refactored/services/table-sort.service';
import { TableDragService } from '../../../../shared/table/refactored/services/table-drag.service';
import { TableResizeService } from '../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../shared/table/refactored/services/table-sync.service';
import { RfLotoPointTableDataService } from '../rf-loto-point-table/rf-loto-point-table-data.service';
import { LotoPointDbTableControlService } from './loto-point-db-table-control.service';
import { LotoPointBulkEditService } from '../services/loto-point-bulk-edit.service';

@Component({
  selector: 'app-loto-point-db-table',
  standalone: true,
  imports: [RfLotoPointTableComponent],
  providers: [
    TableSearchService,
    TableStateService,
    TableSelectionService,
    TableSortService,
    TableDragService,
    TableResizeService,
    TableSyncService,
    LotoPointBulkEditService,
    RfLotoPointTableDataService,
    { provide: TableClickService, useClass: LotoPointDbTableClickService },
    { provide: TableControlsService, useClass: LotoPointDbTableControlService },
    { provide: TableDataService, useExisting: RfLotoPointTableDataService },
  ],
  templateUrl: './loto-point-db-table.component.html',
  styleUrl: './loto-point-db-table.component.css',
})
export class LotoPointDbTableComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  searchCriteria = signal<SearchCriteria | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const search = params.get('search');
        if (search) {
          this.searchCriteria.set({ type: 'global', query: search });
        }
      });
  }
}
