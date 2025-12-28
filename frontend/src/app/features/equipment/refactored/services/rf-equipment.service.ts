import { DestroyRef, inject, Injectable } from "@angular/core";
import { EquipmentMapperService } from "./equipment-mapper.service";
import { EquipmentDto } from "../../../../models/equipment/equipment.model";
import { RfShape } from "../../../../shared/image/refactored/models/fr-shape.model";
import { EquipmentService } from "../../../../services/equipment.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { catchError, map, Observable, of, tap } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class RfEquipmentService{

    mapperService = inject(EquipmentMapperService);
    oldApiService = inject(EquipmentService);
    destroyRef = inject(DestroyRef);

    saveEquipmentFromShape(shape: RfShape): Observable<EquipmentDto | null> {
        const equipment = this.mapperService.shapeToEquipment(shape);
        if (!equipment) {
            return of(null);
        }

        return this.oldApiService.updateEquipment(equipment).pipe(
            takeUntilDestroyed(this.destroyRef),
            map(resp => {
                if (resp && resp.responseData) {
                    return new EquipmentDto(resp.responseData);
                }
                return null;
            }),
            catchError(err => {
                console.error('Error updating equipment:', err);
                return of(null);
            })
        );
    }
} 