import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { LotoPoint } from "../../../models/permits/loto/loto-point.model";

@Injectable({
  providedIn: 'root'
})
export class LotoPointStateService {
    private selectedLotoPointSubject = new BehaviorSubject<LotoPoint>(new LotoPoint());
    selectedLotoPoint$ = this.selectedLotoPointSubject.asObservable();

    setSelectedLotoPoint(lotoPoint: LotoPoint) {
        this.selectedLotoPointSubject.next(lotoPoint);
    }
}