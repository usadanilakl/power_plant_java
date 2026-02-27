import { inject, Injectable } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { CurrentVentingPermitService } from '../../../../services/current-items-services/current-venting-permit.service';
import { VentingPermitDto } from '../../../../models/permits/venting-permit.model';

@Injectable()
export class VentingPermitTableClickService extends TableClickService {
  private currentVentingPermitService = inject(CurrentVentingPermitService);

  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    super.handleRowLeftClick(item, event);
    const normalizedItem = this.normalizeItem(item) as VentingPermitDto;
    if (normalizedItem?.id) {
      this.currentVentingPermitService.setCurrentPermit(normalizedItem.id);
    }
  }
}
