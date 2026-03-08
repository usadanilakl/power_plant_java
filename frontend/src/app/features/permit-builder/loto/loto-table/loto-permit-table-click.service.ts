import { inject, Injectable } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { CurrentLotoService } from '../../../../services/current-items-services/current-loto.service';

@Injectable()
export class LotoPermitTableClickService extends TableClickService {
  private currentLotoService = inject(CurrentLotoService);

  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    super.handleRowLeftClick(item, event);
    const normalizedItem = this.normalizeItem(item);
    if (normalizedItem?.id) {
      this.currentLotoService.setCurrentLotoById(normalizedItem.id);
    }
  }
}
