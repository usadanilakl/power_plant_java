import { effect, inject, Injectable } from "@angular/core";
import { RfLotoStandardStateService } from "../services/rf-loto-standard-state.service";
import { TableDataService } from "../../../../shared/table/refactored/services/table-data.service";

@Injectable()
export class RfLotoStandardTableDataService extends TableDataService {
    private stateService = inject(RfLotoStandardStateService);

    constructor() {
        super();

        effect(() => {
            const selected = this.selectedItems();
            this.stateService.setSelectedLotoStandards(selected);
        });

    }
}
