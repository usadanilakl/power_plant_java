import { inject, Injectable } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { CurrentEnergizedWorkPermitService } from '../../../../services/current-items-services/current-energized-work-permit.service';

@Injectable()
export class EnergizedWorkPermitTableClickService extends TableClickService {
  private currentService = inject(CurrentEnergizedWorkPermitService);
  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    const normalizedItem = item?.originalItem ?? item;
    if (normalizedItem?.id) { this.currentService.setCurrentPermit(normalizedItem.id); }
  }
}
