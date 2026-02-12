import { inject, Injectable } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { CurrentHotWorkService } from '../../../../services/current-items-services/current-hot-work.service';
import { HotWorkDto } from '../../../../models/permits/hot-work.model';

@Injectable()
export class HotWorkTableClickService extends TableClickService {
  private currentHotWorkService = inject(CurrentHotWorkService);

  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    super.handleRowLeftClick(item, event);
    const normalizedItem = this.normalizeItem(item) as HotWorkDto;
    if (normalizedItem?.id) {
      this.currentHotWorkService.setCurrentHotWork(normalizedItem.id);
    }
  }
}
