import { Injectable } from '@angular/core';
import { WorkAreaDto, WorkAreaPermitCounts } from '../../../../models/permits/work-area.model';
import { NestedItem } from '../../../../models/ui/nested-item.model';
import { WorkAreaMapMode } from '../work-area-map/work-area-map-state.service';

export type WorkAreaGroupingCriteria = 'areaType' | 'mappingStatus' | 'permitActivity';

@Injectable({
  providedIn: 'root',
})
export class WorkAreaLeftMenuService {
  readonly groupingOptions: { value: WorkAreaGroupingCriteria; label: string }[] = [
    { value: 'areaType', label: 'Area Type' },
    { value: 'mappingStatus', label: 'Mapping' },
    { value: 'permitActivity', label: 'Permits' },
  ];

  buildGroupedWorkAreaItems(
    workAreas: WorkAreaDto[],
    mode: WorkAreaMapMode,
    groupBy: WorkAreaGroupingCriteria,
    permitCounts: WorkAreaPermitCounts[] = []
  ): NestedItem[] {
    const grouped = new Map<string, WorkAreaDto[]>();
    const sortedAreas = this.sortWorkAreasForTable(workAreas, groupBy, permitCounts);

    sortedAreas.forEach((area) => {
      const key = this.getGroupNameForWorkArea(area, groupBy, permitCounts);
      const bucket = grouped.get(key) ?? [];
      bucket.push(area);
      grouped.set(key, bucket);
    });

    return Array.from(grouped.entries()).map(([groupName, areas]) => ({
      id: `group-${groupBy}-${groupName}`,
      name: groupName,
      objectType: 'WorkAreaGroup',
      color: '#64748b',
      isExpanded: mode !== 'operator',
      values: areas.map((area) => ({
        id: area.id,
        name: area.name,
        subtitle: this.getWorkAreaSubtitle(area, permitCounts),
        objectType: 'WorkArea',
        color: this.getWorkAreaColor(area, permitCounts),
      })),
    }));
  }

  buildOverviewMenuItems(
    permitCounts: WorkAreaPermitCounts[],
    groupBy: WorkAreaGroupingCriteria
  ): NestedItem[] {
    const grouped = new Map<string, NestedItem[]>();
    const sortedCounts = this.sortPermitCounts(permitCounts, groupBy);

    sortedCounts.forEach((count) => {
      if (!count.workArea) {
        return;
      }

      const key = this.getGroupNameForPermitCounts(count, groupBy);
      const bucket = grouped.get(key) ?? [];
      bucket.push({
        id: count.workArea.id,
        name: count.workArea.name,
        subtitle: this.getOverviewSubtitle(count),
        objectType: 'WorkArea',
        color: this.getOverviewColor(count),
      });
      grouped.set(key, bucket);
    });

    return Array.from(grouped.entries()).map(([groupName, values]) => ({
      id: `overview-${groupBy}-${groupName}`,
      name: groupName,
      objectType: 'WorkAreaGroup',
      color: '#64748b',
      isExpanded: true,
      values,
    }));
  }

  sortWorkAreasForTable(
    workAreas: WorkAreaDto[],
    groupBy: WorkAreaGroupingCriteria,
    permitCounts: WorkAreaPermitCounts[] = []
  ): WorkAreaDto[] {
    return [...workAreas].sort((a, b) => {
      const groupCompare = this.getGroupNameForWorkArea(a, groupBy, permitCounts)
        .localeCompare(this.getGroupNameForWorkArea(b, groupBy, permitCounts));
      if (groupCompare !== 0) {
        return groupCompare;
      }
      return a.name.localeCompare(b.name);
    });
  }

  sortOverviewItems(
    permitCounts: WorkAreaPermitCounts[],
    groupBy: WorkAreaGroupingCriteria
  ): WorkAreaDto[] {
    return this.sortPermitCounts(permitCounts, groupBy)
      .map((count) => count.workArea)
      .filter((workArea): workArea is WorkAreaDto => !!workArea);
  }

  private sortPermitCounts(
    permitCounts: WorkAreaPermitCounts[],
    groupBy: WorkAreaGroupingCriteria
  ): WorkAreaPermitCounts[] {
    return [...permitCounts].sort((a, b) => {
      const groupCompare = this.getGroupNameForPermitCounts(a, groupBy)
        .localeCompare(this.getGroupNameForPermitCounts(b, groupBy));
      if (groupCompare !== 0) {
        return groupCompare;
      }
      return (a.workArea?.name ?? '').localeCompare(b.workArea?.name ?? '');
    });
  }

  private getGroupNameForWorkArea(
    area: WorkAreaDto,
    groupBy: WorkAreaGroupingCriteria,
    permitCounts: WorkAreaPermitCounts[]
  ): string {
    switch (groupBy) {
      case 'mappingStatus':
        return area.shapeId ? 'Mapped Areas' : 'Unmapped Areas';
      case 'permitActivity':
        return this.getPermitCountForArea(area.id, permitCounts) > 0
          ? 'Areas With Active Permits'
          : 'Areas Without Active Permits';
      case 'areaType':
      default:
        return area.areaType?.name || 'Uncategorized';
    }
  }

  private getGroupNameForPermitCounts(
    permitCounts: WorkAreaPermitCounts,
    groupBy: WorkAreaGroupingCriteria
  ): string {
    switch (groupBy) {
      case 'mappingStatus':
        return permitCounts.workArea?.shapeId ? 'Mapped Areas' : 'Unmapped Areas';
      case 'permitActivity':
        return (permitCounts.safeWorkCount + permitCounts.hotWorkCount + permitCounts.confinedSpaceCount) > 0
          ? 'Areas With Active Permits'
          : 'Areas Without Active Permits';
      case 'areaType':
      default:
        return permitCounts.workArea?.areaType?.name || 'Uncategorized';
    }
  }

  private getWorkAreaSubtitle(area: WorkAreaDto, permitCounts: WorkAreaPermitCounts[]): string {
    const parts: string[] = [];
    if (area.areaType?.name) {
      parts.push(area.areaType.name);
    }
    parts.push(area.shapeId ? 'Mapped' : 'Unmapped');

    const totalPermits = this.getPermitCountForArea(area.id, permitCounts);
    if (totalPermits > 0) {
      parts.push(`${totalPermits} active permit${totalPermits === 1 ? '' : 's'}`);
    }

    return parts.join(' | ');
  }

  private getWorkAreaColor(area: WorkAreaDto, permitCounts: WorkAreaPermitCounts[]): string {
    const totalPermits = this.getPermitCountForArea(area.id, permitCounts);
    if (totalPermits > 0) {
      return this.getPermitColor(totalPermits);
    }
    return area.shapeId ? '#3b82f6' : '#94a3b8';
  }

  private getOverviewSubtitle(permitCounts: WorkAreaPermitCounts): string {
    const parts: string[] = [];
    if (permitCounts.safeWorkCount > 0) parts.push(`SW ${permitCounts.safeWorkCount}`);
    if (permitCounts.hotWorkCount > 0) parts.push(`HW ${permitCounts.hotWorkCount}`);
    if (permitCounts.confinedSpaceCount > 0) parts.push(`CS ${permitCounts.confinedSpaceCount}`);
    return parts.length > 0 ? parts.join(' | ') : 'No active permits';
  }

  private getOverviewColor(permitCounts: WorkAreaPermitCounts): string {
    return this.getPermitColor(
      permitCounts.safeWorkCount + permitCounts.hotWorkCount + permitCounts.confinedSpaceCount
    );
  }

  private getPermitColor(totalPermits: number): string {
    if (totalPermits > 5) return '#ef4444';
    if (totalPermits > 2) return '#f59e0b';
    if (totalPermits > 0) return '#22c55e';
    return '#94a3b8';
  }

  private getPermitCountForArea(workAreaId: number, permitCounts: WorkAreaPermitCounts[]): number {
    const found = permitCounts.find((count) => count.workArea?.id === workAreaId);
    if (!found) {
      return 0;
    }
    return found.safeWorkCount + found.hotWorkCount + found.confinedSpaceCount;
  }
}
