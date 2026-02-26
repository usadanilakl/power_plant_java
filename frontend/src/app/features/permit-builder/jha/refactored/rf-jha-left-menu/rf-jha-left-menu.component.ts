import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NestedItem } from '../../../../../models/ui/nested-item.model';
import { RfJhaStateService } from '../services/rf-jha-state.service';
import { PermitMenuService, PermitGroupBy } from '../../../shared/permit-menu.service';
import { RfToggleMenuComponent } from '../../../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';

@Component({
  selector: 'app-rf-jha-left-menu',
  standalone: true,
  imports: [CommonModule, RfToggleMenuComponent],
  templateUrl: './rf-jha-left-menu.component.html',
  styleUrl: './rf-jha-left-menu.component.css',
})
export class RfJhaLeftMenuComponent implements OnInit {
  private stateService = inject(RfJhaStateService);
  private permitMenuService = inject(PermitMenuService);
  private destroyRef = inject(DestroyRef);

  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  groupBy = signal<PermitGroupBy>('status');

  ngOnInit(): void {
    this.stateService.allLoadedJhas$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      this.regroup(items);
      this.isLoading.set(false);
    });
  }

  setGrouping(groupBy: PermitGroupBy): void {
    this.groupBy.set(groupBy);
    this.stateService.allLoadedJhas$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      this.regroup(items);
    });
  }

  private regroup(items: any[]): void {
    const grouped = this.permitMenuService.groupPermits(items, this.groupBy(), 'analysisBy');
    this.menuItems.set(grouped);
  }

  onItemClick(item: NestedItem): void {
    if (item.values && item.values.length > 0) return;
    this.stateService.loadItemById(Number(item.id));
  }

  refresh(): void {
    this.isLoading.set(true);
    this.stateService.reloadData();
  }
}
