import { inject, Injectable } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { CurrentExcavationPermitService } from '../../../../services/current-items-services/current-excavation-permit.service';

@Injectable()
export class ExcavationPermitTableClickService extends TableClickService {
  private currentService = inject(CurrentExcavationPermitService);
  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    const normalizedItem = item?.originalItem ?? item;
    if (normalizedItem?.id) { this.currentService.setCurrentPermit(normalizedItem.id); }
  }
}
