import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfLotoPointClickService } from '../rf-loto-point-table/rf-loto-point-click.service';

/**
 * Click service for the LOTO Point Display Table.
 * Extends RfLotoPointClickService to inherit full functionality:
 * - Double-click opens the edit form
 * - Right-click shows context menu
 * - Cell double-click opens form with field focus
 *
 * Additionally emits row click events for parent components to respond to.
 */
@Injectable()
export class LotoPointDisplayTableClickService extends RfLotoPointClickService {
  // Subject to emit row click events
  private rowClickedSubject = new Subject<LotoPointDto>();
  rowClicked$ = this.rowClickedSubject.asObservable();

  constructor() {
    super();
  }

  /**
   * Override to emit row click events for image viewing
   */
  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    // Call parent implementation for normal selection behavior
    super.handleRowLeftClick(item, event);

    // Emit row click event for image viewer
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;
    this.rowClickedSubject.next(normalizedItem);
  }
}
