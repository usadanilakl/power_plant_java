import { Injectable } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { Subject } from 'rxjs';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';

@Injectable()
export class LotoPointDisplayTableClickService extends TableClickService {
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
