import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NestedItem } from '../../../../models/ui/nested-item.model';
import { CurrentJobLogService } from '../../../../services/current-items-services/current-job-log.service';
import { JobLogDto } from '../../../../models/permits/job-log.model';
import { PermitMenuService, PermitGroupBy } from '../../shared/permit-menu.service';
import { RfToggleMenuComponent } from '../../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';

/** How long the refresh spinner may stay up when the reload never reports back. */
const REFRESH_SPINNER_TIMEOUT_MS = 10_000;

@Component({
  selector: 'app-job-log-left-menu',
  standalone: true,
  imports: [CommonModule, RfToggleMenuComponent],
  templateUrl: './job-log-left-menu.component.html',
  styleUrl: './job-log-left-menu.component.css',
})
export class JobLogLeftMenuComponent implements OnInit {
  private currentJobLogService = inject(CurrentJobLogService);
  private permitMenuService = inject(PermitMenuService);
  private destroyRef = inject(DestroyRef);

  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  groupBy = signal<PermitGroupBy>('status');

  /** The last list received, so a re-group does not need a fresh subscription. */
  private items: any[] = [];

  ngOnInit(): void {
    this.currentJobLogService.allJobLogs$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      this.items = items ?? [];
      this.regroup();
      this.isLoading.set(false);
    });
  }

  setGrouping(groupBy: PermitGroupBy): void {
    // Just re-group what we already hold. This used to open a NEW subscription to the same
    // BehaviorSubject on every click, stacking one more each time.
    this.groupBy.set(groupBy);
    this.regroup();
  }

  private regroup(): void {
    // 'Open' is what a job with no status means — NgJobLogService seeds it, and two other screens
    // already assume it. It is NOT the same as a package's null status, which means 'Building'.
    const grouped = this.permitMenuService.groupPermits(this.items, this.groupBy(), 'foreman', 'Open');
    this.menuItems.set(grouped);
  }

  onItemClick(item: NestedItem): void {
    if (item.values && item.values.length > 0) return;
    this.currentJobLogService.setCurrentJobLog(Number(item.id));
  }

  createNewJob(): void {
    this.currentJobLogService.setCurrentJobLogWithDto(new JobLogDto());
  }

  refresh(): void {
    // Actually re-fetch. This used to re-subscribe to the cached subject, so the Refresh button
    // re-rendered the same stale data and looked like it had worked.
    //
    // The spinner is cleared on a TIMER as well as by the subscription, because loadJobLogs() never
    // emits when the request errors or comes back without responseData — so a failed refresh would
    // otherwise leave the menu spinning for ever with no way to retry.
    this.isLoading.set(true);
    this.currentJobLogService.refresh();
    setTimeout(() => this.isLoading.set(false), REFRESH_SPINNER_TIMEOUT_MS);
  }
}
