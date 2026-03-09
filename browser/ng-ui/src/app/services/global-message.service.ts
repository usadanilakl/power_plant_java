import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type MessageColor = 'red' | 'green' | 'white' | 'yellow' | 'orange';

export interface Message {
  text: string;
  color: MessageColor;
  durationMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalMessageService {
  private messageSubject = new BehaviorSubject<Message | null>(null);
  public message$: Observable<Message | null> = this.messageSubject.asObservable();
  private timeoutId: any;

  showMessage(text: string, color: MessageColor = 'white', durationMs = 3000) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.messageSubject.next({ text, color, durationMs });

    this.timeoutId = setTimeout(() => {
      this.hideMessage();
    }, durationMs);
  }

  hideMessage() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.messageSubject.next(null);
  }
}