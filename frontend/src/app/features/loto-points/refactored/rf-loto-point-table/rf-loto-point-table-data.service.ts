import { effect, inject, Injectable } from "@angular/core";
import { RfLotoPointStateService } from "../services/rf-loto-point-state.service";
import { TableDataService } from "../../../../shared/table/refactored/services/table-data.service";

@Injectable()
export class RfLotoPointTableDataService extends TableDataService {
    private stateService = inject(RfLotoPointStateService);

    constructor() {
        super();
    
        effect(() => {
            const selected = this.selectedItems();
            this.stateService.setSelectedLotoPoints(selected);
        });

    }
}