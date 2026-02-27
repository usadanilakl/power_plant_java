import { inject, Injectable } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { CurrentJobLogService } from '../../../../services/current-items-services/current-job-log.service';
import { JobLogDto } from '../../../../models/permits/job-log.model';

@Injectable()
export class JobLogTableClickService extends TableClickService {
  private currentJobLogService = inject(CurrentJobLogService);

  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    super.handleRowLeftClick(item, event);
    const normalizedItem = this.normalizeItem(item) as JobLogDto;
    if (normalizedItem?.id) {
      this.currentJobLogService.setCurrentJobLog(normalizedItem.id);
    }
  }
}
