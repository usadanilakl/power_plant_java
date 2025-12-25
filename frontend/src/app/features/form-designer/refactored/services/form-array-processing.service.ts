import { Injectable } from '@angular/core';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { FormField } from '../../../../models/ui/form-field.model';

/**
 * Handles form array processing and pagination logic for repeating sections
 */
@Injectable({
  providedIn: 'root'
})
export class FormArrayProcessingService {
  private readonly PIXELS_PER_INCH = 96;

  /**
   * Processes all form arrays in the form definition to handle pagination
   */
  processFormArrays(
    formDefinition: PrintableFormDto,
    formData: any,
    formValue: any
  ): PrintableFormDto {
    if (!formDefinition || !formDefinition.formContainers) {
      return formDefinition;
    }

    const processedContainers: FormContainerDto[] = [];

    for (const container of formDefinition.formContainers) {
      if (
        container.contentType === 'formField' &&
        this.isFormField(container.content) &&
        container.content.type === 'form-array'
      ) {
        const arrayContainers = this.processFormArray(
          container,
          formData,
          formValue,
          formDefinition.size
        );
        processedContainers.push(...arrayContainers);
      } else {
        processedContainers.push(container);
      }
    }

    return new PrintableFormDto({
      ...formDefinition,
      formContainers: processedContainers
    });
  }

  /**
   * Processes a single form array container and splits it across pages if needed
   */
  private processFormArray(
    container: FormContainerDto,
    formData: any,
    formValue: any,
    formSize: { width: number; height: number }
  ): FormContainerDto[] {
    const field = container.content as FormField;
    const fieldName = field.name || '';
    const arrayData = this.getNestedValue(formValue, fieldName) || [];
    const arrayLength = Array.isArray(arrayData) ? arrayData.length : 0;

    if (arrayLength === 0) {
      return [container];
    }

    // Get the nested form definition
    const nestedForm = field.nestedForm;
    if (!nestedForm) {
      return [container];
    }

    // Calculate heights
    const containerHeight = container.size.height;
    const nestedFormHeight = nestedForm.size.height * this.PIXELS_PER_INCH;
    const pageHeight = formSize.height * this.PIXELS_PER_INCH;

    // Calculate pagination
    const pagination = this.calculatePagination(
      container,
      nestedFormHeight,
      arrayLength,
      pageHeight
    );

    return pagination.containers;
  }

  /**
   * Calculates pagination for a form array based on available space
   */
  private calculatePagination(
    originalContainer: FormContainerDto,
    nestedFormHeight: number,
    arrayLength: number,
    pageHeight: number
  ): { containers: FormContainerDto[] } {
    const containers: FormContainerDto[] = [];
    const containerY = originalContainer.position.y;
    const containerHeight = originalContainer.size.height;
    const currentPage = originalContainer.pageNumber || 1;

    // Calculate how many items fit on first page
    const spaceOnFirstPage = pageHeight - containerY;
    const itemsOnFirstPage = Math.max(1, Math.floor(spaceOnFirstPage / nestedFormHeight));

    let remainingItems = arrayLength;
    let startIndex = 0;
    let pageNumber = currentPage;

    while (remainingItems > 0) {
      const isFirstPage = pageNumber === currentPage;
      const itemsOnThisPage = isFirstPage
        ? Math.min(itemsOnFirstPage, remainingItems)
        : Math.min(Math.floor(pageHeight / nestedFormHeight), remainingItems);

      const endIndex = startIndex + itemsOnThisPage;

      // Create container for this page
      const container = new FormContainerDto({
        ...originalContainer,
        pageNumber: pageNumber,
        position: {
          x: originalContainer.position.x,
          y: isFirstPage ? containerY : 0
        },
        size: {
          width: originalContainer.size.width,
          height: nestedFormHeight * itemsOnThisPage
        }
      });

      // Store arrayIndexRange as dynamic property (not in model)
      (container as any).arrayIndexRange = { start: startIndex, end: endIndex };

      containers.push(container);

      remainingItems -= itemsOnThisPage;
      startIndex = endIndex;
      pageNumber++;
    }

    return { containers };
  }

  /**
   * Gets the value at a nested path in an object
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) {
      return null;
    }
    return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj);
  }

  /**
   * Type guard for FormField
   */
  private isFormField(content: any): content is FormField {
    return content && typeof content === 'object' && 'name' in content && 'type' in content;
  }

  /**
   * Groups containers by page number
   */
  groupContainersByPage(containers: FormContainerDto[]): { pageNumber: number; containers: FormContainerDto[] }[] {
    const pageMap = new Map<number, FormContainerDto[]>();

    for (const container of containers) {
      const pageNumber = container.pageNumber || 1;
      if (!pageMap.has(pageNumber)) {
        pageMap.set(pageNumber, []);
      }
      pageMap.get(pageNumber)!.push(container);
    }

    return Array.from(pageMap.entries())
      .map(([pageNumber, containers]) => ({ pageNumber, containers }))
      .sort((a, b) => a.pageNumber - b.pageNumber);
  }

  /**
   * Filters form array items based on the container's index range
   */
  getArrayItemsForContainer(
    container: FormContainerDto,
    arrayData: any[]
  ): any[] {
    const arrayIndexRange = (container as any).arrayIndexRange;
    if (!arrayIndexRange || !Array.isArray(arrayData)) {
      return arrayData;
    }

    const { start, end } = arrayIndexRange;
    return arrayData.slice(start, end);
  }
}
