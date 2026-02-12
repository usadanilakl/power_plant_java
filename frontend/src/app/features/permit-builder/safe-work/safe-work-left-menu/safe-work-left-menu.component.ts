import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NestedItem } from '../../../../models/ui/nested-item.model';
import { CurrentSafeWorkService } from '../../../../services/current-items-services/current-safe-work.service';
import { PermitMenuService, PermitGroupBy } from '../../shared/permit-menu.service';
import { RfToggleMenuComponent } from '../../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';

@Component({
  selector: 'app-safe-work-left-menu',
  standalone: true,
  imports: [CommonModule, RfToggleMenuComponent],
  templateUrl: './safe-work-left-menu.component.html',
  styleUrl: './safe-work-left-menu.component.css',
})
export class SafeWorkLeftMenuComponent implements OnInit {
  private currentSafeWorkService = inject(CurrentSafeWorkService);
  private permitMenuService = inject(PermitMenuService);
  private destroyRef = inject(DestroyRef);

  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  groupBy = signal<PermitGroupBy>('status');

  ngOnInit(): void {
    this.currentSafeWorkService.allActiveSafeWorks$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      this.regroup(items);
      this.isLoading.set(false);
    });
  }

  setGrouping(groupBy: PermitGroupBy): void {
    this.groupBy.set(groupBy);
    this.currentSafeWorkService.allActiveSafeWorks$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      this.regroup(items);
    });
  }

  private regroup(items: any[]): void {
    const grouped = this.permitMenuService.groupPermits(items, this.groupBy(), 'requestedBy');
    this.menuItems.set(grouped);
  }

  onItemClick(item: NestedItem): void {
    if (item.values && item.values.length > 0) return;
    this.currentSafeWorkService.setCurrentSafeWork(Number(item.id));
  }

  refresh(): void {
    this.isLoading.set(true);
    this.currentSafeWorkService.allActiveSafeWorks$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      this.regroup(items);
      this.isLoading.set(false);
    });
  }
}
