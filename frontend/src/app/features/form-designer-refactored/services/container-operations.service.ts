import { Injectable } from '@angular/core';
import { FormContainerDto } from '../models/form-container.model';

@Injectable({ providedIn: 'root' })
export class ContainerOperationsService {

  alignContainers(
    containers: FormContainerDto[],
    alignment: 'left' | 'right' | 'top' | 'bottom' | 'h-center' | 'v-center',
  ): FormContainerDto[] {
    if (containers.length < 2) return containers;

    const ref = containers[0];

    return containers.map(c => {
      if (c.id === ref.id) return c;

      const pos = { ...c.position! };

      switch (alignment) {
        case 'left':
          pos.x = ref.position!.x;
          break;
        case 'right':
          pos.x = ref.position!.x + ref.size!.width - c.size!.width;
          break;
        case 'top':
          pos.y = ref.position!.y;
          break;
        case 'bottom':
          pos.y = ref.position!.y + ref.size!.height - c.size!.height;
          break;
        case 'h-center':
          pos.x = ref.position!.x + (ref.size!.width / 2) - (c.size!.width / 2);
          break;
        case 'v-center':
          pos.y = ref.position!.y + (ref.size!.height / 2) - (c.size!.height / 2);
          break;
      }

      return new FormContainerDto({ ...c, position: pos });
    });
  }

  matchSize(
    containers: FormContainerDto[],
    dimension: 'width' | 'height' | 'both',
  ): FormContainerDto[] {
    if (containers.length < 2) return containers;

    const refSize = containers[0].size!;

    return containers.map(c => {
      if (c.id === containers[0].id) return c;

      const size = { ...c.size! };
      if (dimension === 'width' || dimension === 'both') size.width = refSize.width;
      if (dimension === 'height' || dimension === 'both') size.height = refSize.height;

      return new FormContainerDto({ ...c, size });
    });
  }

  distributeContainers(
    containers: FormContainerDto[],
    direction: 'horizontal' | 'vertical',
  ): FormContainerDto[] {
    if (containers.length < 3) return containers;

    const sorted = [...containers].sort((a, b) =>
      direction === 'horizontal'
        ? a.position!.x - b.position!.x
        : a.position!.y - b.position!.y,
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const middle = sorted.slice(1, -1);

    const startEdge = direction === 'horizontal'
      ? first.position!.x + first.size!.width
      : first.position!.y + first.size!.height;

    const endEdge = direction === 'horizontal'
      ? last.position!.x
      : last.position!.y;

    const totalMiddle = middle.reduce((sum, c) =>
      sum + (direction === 'horizontal' ? c.size!.width : c.size!.height), 0,
    );

    const spacing = (endEdge - startEdge - totalMiddle) / (middle.length + 1);

    const result: FormContainerDto[] = [first];
    let pos = startEdge + spacing;

    for (const c of middle) {
      const newPos = { ...c.position! };
      if (direction === 'horizontal') {
        newPos.x = pos;
        pos += c.size!.width + spacing;
      } else {
        newPos.y = pos;
        pos += c.size!.height + spacing;
      }
      result.push(new FormContainerDto({ ...c, position: newPos }));
    }

    result.push(last);
    return result;
  }

  arrangeSequentially(
    containers: FormContainerDto[],
    direction: 'horizontal' | 'vertical',
    gap: number = 0,
  ): FormContainerDto[] {
    if (containers.length < 2) return containers;

    const sorted = [...containers].sort((a, b) =>
      direction === 'horizontal'
        ? (a.position?.x ?? 0) - (b.position?.x ?? 0)
        : (a.position?.y ?? 0) - (b.position?.y ?? 0),
    );

    const result: FormContainerDto[] = [sorted[0]];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const cur = sorted[i];
      const newPos = { ...cur.position! };

      if (direction === 'horizontal') {
        newPos.x = prev.position!.x + prev.size!.width + gap;
      } else {
        newPos.y = prev.position!.y + prev.size!.height + gap;
      }

      const updated = new FormContainerDto({ ...cur, position: newPos });
      result.push(updated);
      prev = updated;
    }

    return result;
  }

  swapContainers(containers: FormContainerDto[]): FormContainerDto[] {
    if (containers.length !== 2) return containers;

    const [a, b] = containers;
    return [
      new FormContainerDto({ ...a, position: b.position }),
      new FormContainerDto({ ...b, position: a.position }),
    ];
  }

  groupContainers(containers: FormContainerDto[]): FormContainerDto[] {
    if (containers.length < 2) return containers;

    const groupId = `group-${Date.now()}`;
    return containers.map(c => new FormContainerDto({ ...c, groupId }));
  }

  ungroupContainers(containers: FormContainerDto[], allContainers: FormContainerDto[]): FormContainerDto[] {
    if (containers.length === 0 || !containers[0].groupId) return [];

    const groupId = containers[0].groupId;
    return allContainers
      .filter(c => c.groupId === groupId)
      .map(c => new FormContainerDto({ ...c, groupId: null }));
  }

  isGrouped(containers: FormContainerDto[]): boolean {
    return containers.length > 0 && !!containers[0].groupId;
  }
}
