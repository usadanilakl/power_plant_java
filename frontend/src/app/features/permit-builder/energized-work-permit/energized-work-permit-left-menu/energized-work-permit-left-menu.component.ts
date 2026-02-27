import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrentEnergizedWorkPermitService } from '../../../../services/current-items-services/current-energized-work-permit.service';
import { PermitMenuService, PermitGroupBy } from '../../shared/permit-menu.service';
import { NestedItem } from '../../../../models/ui/nested-item.model';
import { RfToggleMenuComponent } from '../../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';

@Component({
  selector: 'app-energized-work-permit-left-menu',
  standalone: true,
  imports: [RfToggleMenuComponent],
  templateUrl: './energized-work-permit-left-menu.component.html',
  styleUrl: './energized-work-permit-left-menu.component.css'
})
export class EnergizedWorkPermitLeftMenuComponent implements OnInit {
  private currentService = inject(CurrentEnergizedWorkPermitService);
  private permitMenuService = inject(PermitMenuService);
  private destroyRef = inject(DestroyRef);

  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  groupBy = signal<PermitGroupBy>('status');

  ngOnInit() {
    this.currentService.allActivePermits$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => this.regroup(items));
  }

  private regroup(items: any[]) {
    if (!items) return;
    const grouped = this.permitMenuService.groupPermits(items, this.groupBy(), 'requester');
    this.menuItems.set(grouped);
  }

  setGrouping(groupBy: PermitGroupBy) {
    this.groupBy.set(groupBy);
    this.currentService.allActivePermits$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => this.regroup(items));
  }

  onItemClick(item: NestedItem) {
    if (item.id) { this.currentService.setCurrentPermit(Number(item.id)); }
  }

  refresh() {
    this.currentService.allActivePermits$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => this.regroup(items));
  }
}
