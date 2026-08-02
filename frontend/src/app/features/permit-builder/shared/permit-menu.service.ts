import { Injectable } from '@angular/core';
import { NestedItem, NestedItemImpl } from '../../../models/ui/nested-item.model';
import { BaseDto } from '../../../models/base/base.model';

export type PermitGroupBy = 'status' | 'location' | 'requestor';

@Injectable({
  providedIn: 'root'
})
export class PermitMenuService {

  groupPermits(
    items: any[],
    groupBy: PermitGroupBy,
    requestorField: string = 'requestedBy'
  ): NestedItem[] {
    const grouped = items.reduce((acc, item) => {
      let groupName: string;

      switch (groupBy) {
        case 'status':
          groupName = item.permitStatus?.name || 'Unknown';
          break;
        case 'location':
          groupName = item.location || item.space || 'No Location';
          break;
        case 'requestor':
          groupName = item[requestorField] || 'Unknown';
          break;
      }

      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped).map(([groupName, groupItems]) => {
      const parentItem = new NestedItemImpl({
        id: groupBy + '_' + groupName,
        name: groupName,
        isExpanded: false,
        objectType: groupBy
      });

      parentItem.values = (groupItems as any[]).map(item => new NestedItemImpl({
        id: item.id.toString(),
        name: this.getItemDisplayName(item),
        subtitle: item.workScope || '',
        isExpanded: false,
        objectType: item.objectType || '',
        color: this.getStatusColor(item)
      }));

      return parentItem;
    });
  }

  private getItemDisplayName(item: any): string {
    // Prefer permit number + a human-readable qualifier. The date-first fallback
    // was showing "2026-07-30 - <blank>" for LOTOs, which is what the user
    // called "random creation time".
    const qualifier = item.workScope || item.equipmentSystem || item.location || item.space || '';
    if (item.permitNumber) {
      return qualifier ? `${item.permitNumber} — ${qualifier}` : item.permitNumber;
    }
    if (item.name) return item.name;
    if (item.date) {
      return qualifier ? `${item.date} - ${qualifier}` : item.date;
    }
    if (item.docNum) return `#${item.docNum}`;
    if (qualifier) return qualifier;
    if (item.id) return `LOTO #${item.id}`;
    return 'Unnamed Permit';
  }

  private getStatusColor(item: any): string {
    const status = item.permitStatus?.name?.toLowerCase() || '';
    if (status.includes('approved') || status.includes('closed') || status.includes('complete')) {
      return 'green';
    }
    if (status.includes('pending') || status.includes('review')) {
      return 'yellow';
    }
    if (status.includes('rejected') || status.includes('expired')) {
      return 'red';
    }
    return '';
  }
}
