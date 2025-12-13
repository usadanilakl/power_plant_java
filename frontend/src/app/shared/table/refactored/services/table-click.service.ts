
import { Injectable } from '@angular/core';
import { Subject, debounceTime, filter } from 'rxjs';
import { ClickState } from '../models/table.types';

@Injectable({
  providedIn: 'root'
})
export class TableClickService {
  private clickState: ClickState = {
    lastClickTime: 0,
    isDoubleClickHandled: false
  };

  private clickSubject = new Subject<MouseEvent>();
  private doubleClickSubject = new Subject<MouseEvent>();
  private singleClickSubject = new Subject<MouseEvent>();

  doubleClick$ = this.doubleClickSubject.asObservable();
  singleClick$ = this.singleClickSubject.asObservable();

  constructor() {
    this.initializeClickDetection();
  }

  private initializeClickDetection(): void {
    this.clickSubject.pipe(
      debounceTime(300)
    ).subscribe(event => {
      if (!this.clickState.isDoubleClickHandled) {
        this.singleClickSubject.next(event);
      }
      this.clickState.isDoubleClickHandled = false;
    });
  }

  handleClick(event: MouseEvent): void {
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - this.clickState.lastClickTime;

    if (timeSinceLastClick < 300 && !this.clickState.isDoubleClickHandled) {
      this.clickState.isDoubleClickHandled = true;
      this.doubleClickSubject.next(event);
    } else {
      this.clickState.lastClickTime = currentTime;
      this.clickSubject.next(event);
    }
  }

  reset(): void {
    this.clickState = {
      lastClickTime: 0,
      isDoubleClickHandled: false
    };
  }
}
