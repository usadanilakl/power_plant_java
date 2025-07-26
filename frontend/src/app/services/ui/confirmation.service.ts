import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private confirmationSubject = new Subject<boolean>();

  confirm(message: string): Promise<boolean> {
    const result = window.confirm(message);
    this.confirmationSubject.next(result);
    return Promise.resolve(result);
  }

  getConfirmation() {
    return this.confirmationSubject.asObservable();
  }
}