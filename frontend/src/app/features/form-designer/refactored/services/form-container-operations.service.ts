import { Injectable } from '@angular/core';
import { FormContainerDto } from '../../../../models/forms/form-container.model';

/**
 * Handles operations on form containers including:
 * - Alignment (left, right, top, bottom, h-center, v-center)
 * - Size matching (width, height, both)
 * - Distribution (horizontal, vertical)
 * - Sequential arrangement
 * - Swapping
 * - Grouping/ungrouping
 */
@Injectable({
  providedIn: 'root'
})
export class FormContainerOperationsService {

  /**
   * Aligns containers based on the first selected container as reference
   */
  alignContainers(
    containers: FormContainerDto[],
    alignment: 'left' | 'right' | 'top' | 'bottom' | 'h-center' | 'v-center'
  ): FormContainerDto[] {
    if (containers.length < 2) return containers;

    const referenceContainer = containers[0];

    return containers.map(container => {
      if (container.id === referenceContainer.id) {
        return container;
      }

      const newPosition = { ...container.position! };

      switch (alignment) {
        case 'left':
          newPosition.x = referenceContainer.position!.x;
          break;
        case 'right':
          newPosition.x =
            referenceContainer.position!.x +
            referenceContainer.size!.width -
            container.size!.width;
          break;
        case 'top':
          newPosition.y = referenceContainer.position!.y;
          break;
        case 'bottom':
          newPosition.y =
            referenceContainer.position!.y +
            referenceContainer.size!.height -
            container.size!.height;
          break;
        case 'h-center':
          newPosition.x =
            referenceContainer.position!.x +
            (referenceContainer.size!.width / 2) -
            (container.size!.width / 2);
          break;
        case 'v-center':
          newPosition.y =
            referenceContainer.position!.y +
            (referenceContainer.size!.height / 2) -
            (container.size!.height / 2);
          break;
      }

      return new FormContainerDto({ ...container, position: newPosition });
    });
  }

  /**
   * Matches size of containers based on the first selected container
   */
  matchSize(
    containers: FormContainerDto[],
    dimension: 'width' | 'height' | 'both'
  ): FormContainerDto[] {
    if (containers.length < 2) return containers;

    const referenceContainer = containers[0];
    const referenceSize = referenceContainer.size!;

    return containers.map(container => {
      if (container.id === referenceContainer.id) {
        return container;
      }

      const newSize = { ...container.size! };

      if (dimension === 'width' || dimension === 'both') {
        newSize.width = referenceSize.width;
      }
      if (dimension === 'height' || dimension === 'both') {
        newSize.height = referenceSize.height;
      }

      return new FormContainerDto({ ...container, size: newSize });
    });
  }

  /**
   * Distributes containers evenly in the specified direction
   */
  distributeContainers(
    containers: FormContainerDto[],
    direction: 'horizontal' | 'vertical'
  ): FormContainerDto[] {
    if (containers.length < 3) return containers;

    const sortedContainers = [...containers].sort((a, b) =>
      direction === 'horizontal'
        ? a.position!.x - b.position!.x
        : a.position!.y - b.position!.y
    );

    const firstContainer = sortedContainers[0];
    const lastContainer = sortedContainers[sortedContainers.length - 1];
    const middleContainers = sortedContainers.slice(1, -1);

    const startEdge = direction === 'horizontal'
      ? firstContainer.position!.x + firstContainer.size!.width
      : firstContainer.position!.y + firstContainer.size!.height;

    const endEdge = direction === 'horizontal'
      ? lastContainer.position!.x
      : lastContainer.position!.y;

    const totalSpaceToDistribute = endEdge - startEdge;
    const totalMiddleContainersSize = middleContainers.reduce((sum, container) =>
      sum + (direction === 'horizontal' ? container.size!.width : container.size!.height), 0
    );

    const spacing = (totalSpaceToDistribute - totalMiddleContainersSize) / (middleContainers.length + 1);

    const updatedContainers: FormContainerDto[] = [firstContainer];
    let currentPosition = startEdge + spacing;

    for (const container of middleContainers) {
      const newPosition = { ...container.position! };

      if (direction === 'horizontal') {
        newPosition.x = currentPosition;
        currentPosition += container.size!.width + spacing;
      } else {
        newPosition.y = currentPosition;
        currentPosition += container.size!.height + spacing;
      }

      updatedContainers.push(new FormContainerDto({ ...container, position: newPosition }));
    }

    updatedContainers.push(lastContainer);
    return updatedContainers;
  }

  /**
   * Arranges containers sequentially with a specified gap
   */
  arrangeSequentially(
    containers: FormContainerDto[],
    direction: 'horizontal' | 'vertical',
    gap: number = 0
  ): FormContainerDto[] {
    if (containers.length < 2) return containers;

    const sortedContainers = [...containers].sort((a, b) =>
      direction === 'horizontal'
        ? (a.position?.x ?? 0) - (b.position?.x ?? 0)
        : (a.position?.y ?? 0) - (b.position?.y ?? 0)
    );

    const updatedContainers: FormContainerDto[] = [sortedContainers[0]];
    let previousContainer = sortedContainers[0];

    for (let i = 1; i < sortedContainers.length; i++) {
      const currentContainer = sortedContainers[i];
      const newPosition = { ...(currentContainer.position!) };

      if (direction === 'horizontal') {
        newPosition.x = (previousContainer.position!.x + previousContainer.size!.width) + gap;
      } else {
        newPosition.y = (previousContainer.position!.y + previousContainer.size!.height) + gap;
      }

      const updatedContainer = new FormContainerDto({ ...currentContainer, position: newPosition });
      updatedContainers.push(updatedContainer);
      previousContainer = updatedContainer;
    }

    return updatedContainers;
  }

  /**
   * Swaps positions of exactly two containers
   */
  swapContainers(containers: FormContainerDto[]): FormContainerDto[] {
    if (containers.length !== 2) return containers;

    const [containerA, containerB] = containers;

    return [
      new FormContainerDto({ ...containerA, position: containerB.position }),
      new FormContainerDto({ ...containerB, position: containerA.position })
    ];
  }

  /**
   * Groups containers with a unique group ID
   */
  groupContainers(containers: FormContainerDto[]): FormContainerDto[] {
    if (containers.length < 2) return containers;

    const groupId = `group-${Date.now()}`;

    return containers.map(container =>
      new FormContainerDto({ ...container, groupId })
    );
  }

  /**
   * Ungroups containers by removing their group ID
   */
  ungroupContainers(containers: FormContainerDto[], allContainers: FormContainerDto[]): FormContainerDto[] {
    if (containers.length === 0 || !containers[0].groupId) return [];

    const groupId = containers[0].groupId;
    const containersInGroup = allContainers.filter(c => c.groupId === groupId);

    return containersInGroup.map(container =>
      new FormContainerDto({ ...container, groupId: null })
    );
  }

  /**
   * Checks if containers are grouped
   */
  isGrouped(containers: FormContainerDto[]): boolean {
    return containers.length > 0 && !!containers[0].groupId;
  }
}
