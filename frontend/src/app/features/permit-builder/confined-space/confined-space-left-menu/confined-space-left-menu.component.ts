import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NestedItem } from '../../../../models/ui/nested-item.model';
import { CurrentConfinedSpaceService } from '../../../../services/current-items-services/current-confined-space.service';
import { PermitMenuService, PermitGroupBy } from '../../shared/permit-menu.service';
import { RfToggleMenuComponent } from '../../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';

@Component({
  selector: 'app-confined-space-left-menu',
  standalone: true,
  imports: [CommonModule, RfToggleMenuComponent],
  templateUrl: './confined-space-left-menu.component.html',
  styleUrl: './confined-space-left-menu.component.css',
})
export class ConfinedSpaceLeftMenuComponent implements OnInit {
  private currentConfinedSpaceService = inject(CurrentConfinedSpaceService);
  private permitMenuService = inject(PermitMenuService);
  private destroyRef = inject(DestroyRef);

  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  groupBy = signal<PermitGroupBy>('status');

  ngOnInit(): void {
    this.currentConfinedSpaceService.allActiveConfinedSpaces$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      this.regroup(items);
      this.isLoading.set(false);
    });
  }

  setGrouping(groupBy: PermitGroupBy): void {
    this.groupBy.set(groupBy);
    this.currentConfinedSpaceService.allActiveConfinedSpaces$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      this.regroup(items);
    });
  }

  private regroup(items: any[]): void {
    const grouped = this.permitMenuService.groupPermits(items, this.groupBy(), 'issuedTo');
    this.menuItems.set(grouped);
  }

  onItemClick(item: NestedItem): void {
    if (item.values && item.values.length > 0) return;
    this.currentConfinedSpaceService.setCurrentConfinedSpace(Number(item.id));
  }

  refresh(): void {
    this.isLoading.set(true);
    this.currentConfinedSpaceService.allActiveConfinedSpaces$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      this.regroup(items);
      this.isLoading.set(false);
    });
  }
}
