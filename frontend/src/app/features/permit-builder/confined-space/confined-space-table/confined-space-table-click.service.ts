import { inject, Injectable } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { CurrentConfinedSpaceService } from '../../../../services/current-items-services/current-confined-space.service';
import { ConfinedSpaceDto } from '../../../../models/permits/confined-space.model';

@Injectable()
export class ConfinedSpaceTableClickService extends TableClickService {
  private currentConfinedSpaceService = inject(CurrentConfinedSpaceService);

  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    super.handleRowLeftClick(item, event);
    const normalizedItem = this.normalizeItem(item) as ConfinedSpaceDto;
    if (normalizedItem?.id) {
      this.currentConfinedSpaceService.setCurrentConfinedSpace(normalizedItem.id);
    }
  }
}
