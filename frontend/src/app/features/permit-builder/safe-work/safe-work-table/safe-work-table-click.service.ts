import { inject, Injectable } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { CurrentSafeWorkService } from '../../../../services/current-items-services/current-safe-work.service';
import { SafeWorkDto } from '../../../../models/permits/safe-work.model';

@Injectable()
export class SafeWorkTableClickService extends TableClickService {
  private currentSafeWorkService = inject(CurrentSafeWorkService);

  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    super.handleRowLeftClick(item, event);
    const normalizedItem = this.normalizeItem(item) as SafeWorkDto;
    if (normalizedItem?.id) {
      this.currentSafeWorkService.setCurrentSafeWork(normalizedItem.id);
    }
  }
}
