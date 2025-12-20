import { Directive } from "@angular/core";
import { TableSearchService } from "./services/table-search.service";
import { TableControlsService } from "./services/table-controls.service";
import { TableStateService } from "./services/table-state.service";
import { TableDataService } from "./services/table-data.service";
import { TableSelectionService } from "./services/table-selection.service";
import { TableSortService } from "./services/table-sort.service";
import { TableDragService } from "./services/table-drag.service";
import { TableResizeService } from "./services/table-resize.service";

// table-base.providers.ts
@Directive({
  standalone: true,
  providers: [
    TableSearchService,
    TableControlsService,
    TableStateService,
    TableDataService,
    TableSelectionService,
    TableSortService,
    TableDragService,
    TableResizeService,
    // NO TableClickService - parents override this
  ],
})
export class TableBaseProvidersDirective {}
