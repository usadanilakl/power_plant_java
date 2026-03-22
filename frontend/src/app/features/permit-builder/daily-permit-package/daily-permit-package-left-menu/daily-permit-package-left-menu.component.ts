import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NestedItem, NestedItemImpl } from '../../../../models/ui/nested-item.model';
import { CurrentDailyPermitPackageService } from '../../../../services/current-items-services/current-daily-permit-package.service';
import { DailyPermitPackageDto } from '../../../../models/permits/dailt-permit-package.model';
import { RfToggleMenuComponent } from '../../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';

export type DppGroupBy = 'company' | 'person' | 'date' | 'status';

@Component({
  selector: 'app-daily-permit-package-left-menu',
  standalone: true,
  imports: [CommonModule, RfToggleMenuComponent],
  templateUrl: './daily-permit-package-left-menu.component.html',
  styleUrl: './daily-permit-package-left-menu.component.css',
})
export class DailyPermitPackageLeftMenuComponent implements OnInit {
  private currentService = inject(CurrentDailyPermitPackageService);
  private destroyRef = inject(DestroyRef);

  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  groupBy = signal<DppGroupBy>('company');

  ngOnInit(): void {
    this.currentService.allActiveDailyPermitPackages$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      this.regroup(items);
      this.isLoading.set(false);
    });
  }

  setGrouping(groupBy: DppGroupBy): void {
    this.groupBy.set(groupBy);
    this.currentService.allActiveDailyPermitPackages$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      this.regroup(items);
    });
  }

  private regroup(items: DailyPermitPackageDto[]): void {
    const grouped = items.reduce((acc, item) => {
      let groupName: string;
      switch (this.groupBy()) {
        case 'company':
          groupName = this.normalizeCompanyName(item.companyName || 'Unassigned');
          break;
        case 'person':
          groupName = item.personName?.trim() || 'Unassigned';
          break;
        case 'date':
          groupName = item.date || 'No Date';
          break;
        case 'status':
          groupName = item.packageStatus?.name ?? 'Building';
          break;
      }
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(item);
      return acc;
    }, {} as Record<string, DailyPermitPackageDto[]>);

    const result: NestedItem[] = Object.entries(grouped).map(([groupName, groupItems]) => {
      const parent = new NestedItemImpl({
        id: this.groupBy() + '_' + groupName,
        name: groupName,
        isExpanded: false,
        objectType: this.groupBy(),
      });
      parent.values = groupItems.map(item => new NestedItemImpl({
        id: item.id.toString(),
        name: this.getDisplayName(item),
        subtitle: this.getLeafSubtitle(item),
        color: this.getStatusColor(item),
        isExpanded: false,
        objectType: item.objectType || '',
      }));
      return parent;
    });

    this.menuItems.set(result);
  }

  private getDisplayName(item: DailyPermitPackageDto): string {
    const parts: string[] = [];
    if (item.permitNumber) parts.push(item.permitNumber);
    if (item.date) parts.push(item.date);
    if (item.personName) parts.push(item.personName);
    return parts.join(' - ') || item.name || 'Unnamed Package';
  }

  private getStatusColor(item: DailyPermitPackageDto): string {
    const status = item.packageStatus?.name ?? 'Building';
    switch (status) {
      case 'Active': return 'rgba(76, 175, 80, 0.08)';
      case 'Test': return 'rgba(255, 193, 7, 0.08)';
      case 'Closed': return 'rgba(244, 67, 54, 0.08)';
      default: return 'rgba(33, 150, 243, 0.08)';
    }
  }

  private getLeafSubtitle(item: DailyPermitPackageDto): string {
    const location = this.getPackageLocation(item);
    const scope = this.getPackageWorkScope(item);
    const parts = [location, scope].filter(Boolean);
    return parts.join(' · ') || (item.packageStatus?.name ?? 'Building');
  }

  private getPackageLocation(item: DailyPermitPackageDto): string {
    const permit = item.workRequests?.[0] || item.safeWorks?.[0] || item.hotWorks?.[0] || item.confinedSpaces?.[0];
    return ((permit as any)?.location || '').toString().trim();
  }

  private getPackageWorkScope(item: DailyPermitPackageDto): string {
    const permit = item.workRequests?.[0] || item.safeWorks?.[0] || item.hotWorks?.[0] || item.confinedSpaces?.[0];
    const scope = ((permit as any)?.workScope || item.name || '').toString().trim();
    return scope.length > 60 ? `${scope.substring(0, 60)}...` : scope;
  }

  private normalizeCompanyName(name: string): string {
    const lower = name.replace(/\s/g, '').toLowerCase();
    if (lower.includes('depue')) return 'Depue';
    if (lower.includes('kiewit')) return 'Kiewit';
    if (lower.includes('mitsu') || lower === 'mhi') return 'Mitsubishi';
    if (lower.includes('brand')) return 'Brand';
    if (lower.includes('synergy')) return 'Synergy';
    if (lower.includes('blockelec')) return 'Block Electric';
    if (lower === 'gts') return 'GTS';
    return name.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  onItemClick(item: NestedItem): void {
    if (item.values && item.values.length > 0) return;
    const pkg = this.currentService.allPackages().find(p => p.id === Number(item.id));
    if (pkg) {
      this.currentService.setSelectedPackage(pkg);
    }
  }

  refresh(): void {
    this.isLoading.set(true);
    this.currentService.allActiveDailyPermitPackages$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      this.regroup(items);
      this.isLoading.set(false);
    });
  }
}
