import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Loto } from '../../../models/permits/loto.model';
import { GlobalMessageService } from '../../../services/global-message.service';

@Injectable({
  providedIn: 'root'
})
export class LotoProcessorStateService {
  globalMessageService = inject(GlobalMessageService);

  private allLotosSubject = new BehaviorSubject<Loto[]>([]);
  allLotos$ = this.allLotosSubject.asObservable();

  private selectedLotoSubject = new BehaviorSubject<Loto>(new Loto());
  selectedLoto$ = this.selectedLotoSubject.asObservable();

  constructor() { }

  saveDraft(loto: Loto) {
    // In a real implementation, this would save to local storage or a DB
    this.selectedLotoSubject.next(loto);
    console.log('Draft saved:', loto);
    this.globalMessageService.showMessage('LOTO draft saved.');
  }

  submitNewLoto(loto: Loto) {
    // In a real implementation, this would submit to an API
    console.log('Submitting new LOTO:', loto);
    this.globalMessageService.showMessage('LOTO submitted successfully!');
    this.selectedLotoSubject.next(new Loto()); // Clear form
  }

  selectLoto(loto: Loto) {
    this.selectedLotoSubject.next(loto);
  }
}