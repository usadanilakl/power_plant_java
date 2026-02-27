import { inject, Injectable } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { CurrentDailyPermitPackageService } from '../../../../services/current-items-services/current-daily-permit-package.service';
import { DailyPermitPackageDto } from '../../../../models/permits/dailt-permit-package.model';

@Injectable()
export class DailyPermitPackageTableClickService extends TableClickService {
  private currentService = inject(CurrentDailyPermitPackageService);

  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    super.handleRowLeftClick(item, event);
    const normalizedItem = this.normalizeItem(item) as DailyPermitPackageDto;
    if (normalizedItem?.id) {
      this.currentService.setCurrentDailyPermitPackage(normalizedItem.id);
    }
  }
}
