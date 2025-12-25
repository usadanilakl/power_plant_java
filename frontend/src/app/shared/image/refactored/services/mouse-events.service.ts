import { Injectable } from '@angular/core';
import { fromEvent, Observable, race, timer } from 'rxjs';
import {
  map,
  groupBy,
  mergeMap,
  buffer,
  debounceTime,
  filter,
  take,
} from 'rxjs/operators';

export interface ClassifiedMouseEvent {
  type: 'single' | 'double' | 'middle' | 'right';
  event: MouseEvent;
}

@Injectable({
  providedIn: 'root'
})
export class MouseEventsService {
  private readonly DOUBLE_CLICK_DELAY = 250; // ms

  classify(source$: Observable<MouseEvent>): Observable<ClassifiedMouseEvent> {
    return source$.pipe(
      groupBy((event) => event.button),
      mergeMap((group$) => {
        if (group$.key === 1) { // Middle click
          return group$.pipe(map(event => ({ type: 'middle', event } as ClassifiedMouseEvent)));
        }
        if (group$.key === 2) { // Right click
          return group$.pipe(map(event => ({ type: 'right', event } as ClassifiedMouseEvent)));
        }
        // Handle left-click (single vs. double)
        return group$.pipe(
          buffer(group$.pipe(debounceTime(this.DOUBLE_CLICK_DELAY))),
          filter(events => events.length > 0), // Ensure we don't process empty buffers
          map(events => ({
            type: (events.length === 1 ? 'single' : 'double') as 'single' | 'double',
            event: events[0] // Safely get the first event from the buffered array
          }))
        );
      })
    );
  }

  // A more robust implementation for left clicks
  classifyClicks(mousedown$: Observable<MouseEvent>): Observable<ClassifiedMouseEvent> {
    const clicks$ = mousedown$.pipe(
      groupBy(event => event.button),
      mergeMap(group => {
        const button = group.key;
        switch (button) {
          case 0: // Left button
            return group.pipe(
              buffer(group.pipe(debounceTime(this.DOUBLE_CLICK_DELAY))),
              map(events => ({
                type: events.length === 1 ? 'single' : 'double',
                event: events[0]
              } as ClassifiedMouseEvent))
            );
          case 1: // Middle button
            return group.pipe(map(event => ({ type: 'middle', event } as ClassifiedMouseEvent)));
          case 2: // Right button
            return group.pipe(map(event => ({ type: 'right', event } as ClassifiedMouseEvent)));
          default:
            return new Observable<ClassifiedMouseEvent>(); // Ignore other buttons
        }
      })
    );
    return clicks$;
  }
}