import { inject, Injectable } from "@angular/core";
import { RfLotoPointStateService } from "./rf-loto-point-state.service";
import { RfLotoPointApiService } from "./rf-loto-point-api.service";
import { LotoPointModel } from "../../../../models/loto/loto-point.model";

@Injectable({
    providedIn: 'root'
})
export class LotoPointCrudService{
    private stateService = inject(RfLotoPointStateService);
    private apiService = inject(RfLotoPointApiService);

    createLotoPoint(lotoPoint: LotoPointModel): void {
        // Logic to create a new loto point
        // this.stateService.addLotoPoint(lotoPoint);
    }
}