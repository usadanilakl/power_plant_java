import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrentExcavationPermitService } from '../../../../services/current-items-services/current-excavation-permit.service';
import { PermitMenuService, PermitGroupBy } from '../../shared/permit-menu.service';
import { NestedItem } from '../../../../models/ui/nested-item.model';
import { RfToggleMenuComponent } from '../../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';

@Component({
  selector: 'app-excavation-permit-left-menu',
  standalone: true,
  imports: [RfToggleMenuComponent],
  templateUrl: './excavation-permit-left-menu.component.html',
  styleUrl: './excavation-permit-left-menu.component.css'
})
export class ExcavationPermitLeftMenuComponent implements OnInit {
  private currentService = inject(CurrentExcavationPermitService);
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
    const grouped = this.permitMenuService.groupPermits(items, this.groupBy(), 'supervisor');
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
