import { Injectable } from '@angular/core';
import { NestedItem, NestedItemImpl } from '../../../models/ui/nested-item.model';
import { BaseDto } from '../../../models/base/base.model';

export type PermitGroupBy = 'status' | 'location' | 'requestor';

@Injectable({
  providedIn: 'root'
})
export class PermitMenuService {

  /**
   * @param unknownStatusLabel what an item with no status is called. Deliberately a parameter:
   *   a Job with no status is "Open" while a package with no status is "Building", and calling
   *   them the same thing would misreport both.
   */
  groupPermits(
    items: any[],
    groupBy: PermitGroupBy,
    requestorField: string = 'requestedBy',
    unknownStatusLabel: string = 'Unknown'
  ): NestedItem[] {
    const grouped = items.reduce((acc, item) => {
      let groupName: string;

      switch (groupBy) {
        case 'status':
          groupName = this.statusOf(item) || unknownStatusLabel;
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

  /**
   * The item's status name, whatever the entity calls it.
   *
   * <p>Permits name it `permitStatus`, a JobLog names it `jobStatus`, and a JHA exposes a plain
   * `status` string. This service only ever read `permitStatus`, and nothing spreads unknown keys
   * into these DTOs — so for every Job the property was `undefined` and the whole list collapsed
   * into one "Unknown" group. The same bug silently broke the JHA menu.
   *
   * <p>`||`, not `??`. SafeWork, HotWork, ConfinedSpace and Loto each default `permitStatus` to an
   * EMPTY ValueDto rather than null, and `ValueDto`'s constructor coerces its name to `''`. A `??`
   * chain would short-circuit on that empty string and produce a blank, unsearchable group header
   * — moving every currently-"Unknown" permit in the four working menus into it.
   */
  private statusOf(item: any): string {
    return item?.permitStatus?.name
        || item?.jobStatus?.name
        || (typeof item?.status === 'string' ? item.status : '')
        || '';
  }

  private getStatusColor(item: any): string {
    const status = this.statusOf(item).toLowerCase();
    if (!status) return '';

    // Job vocabulary first — Open / Building / Active / Closed. Without its own branch only
    // "Closed" matched below, and it came out GREEN while the sibling package menu colours a
    // closed package red.
    if (status === 'active') return 'green';
    if (status === 'open' || status === 'building') return 'yellow';
    if (status === 'closed') return '';

    if (status.includes('approved') || status.includes('complete')) {
      return 'green';
    }
    if (status.includes('pending') || status.includes('review')) {
      return 'yellow';
    }
    if (status.includes('rejected') || status.includes('expired') || status.includes('cancelled')) {
      return 'red';
    }
    return '';
  }
}
