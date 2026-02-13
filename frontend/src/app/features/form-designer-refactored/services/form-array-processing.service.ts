import { Injectable } from '@angular/core';
import { PrintableFormDto } from '../models/printable-form.model';
import { FormContainerDto } from '../models/form-container.model';
import { FormField } from '../../../models/ui/form-field.model';

@Injectable({ providedIn: 'root' })
export class FormArrayProcessingService {
  private readonly PIXELS_PER_INCH = 96;

  processFormArrays(
    formDefinition: PrintableFormDto,
    formData: any,
    formValue: any,
  ): PrintableFormDto {
    if (!formDefinition || !formDefinition.formContainers) return formDefinition;

    const processed: FormContainerDto[] = [];

    for (const container of formDefinition.formContainers) {
      if (
        (container.contentType === 'formField' || container.contentType === 'repeatingSection') &&
        this.isFormField(container.content) &&
        container.content.type === 'form-array'
      ) {
        processed.push(...this.processFormArray(container, formData, formValue, formDefinition.size));
      } else {
        processed.push(container);
      }
    }

    return new PrintableFormDto({ ...formDefinition, formContainers: processed });
  }

  private processFormArray(
    container: FormContainerDto,
    formData: any,
    formValue: any,
    formSize: { width: number; height: number },
  ): FormContainerDto[] {
    const field = container.content as FormField;
    const fieldName = field.name || '';
    const arrayData = this.getNestedValue(formValue, fieldName) || [];
    const arrayLength = Array.isArray(arrayData) ? arrayData.length : 0;

    if (arrayLength === 0) return [container];

    let nestedForm = field.nestedForm;
    if (!nestedForm && field.fields && field.fields.length > 0) {
      nestedForm = this.buildNestedFormFromFields(field.fields, formSize);
      field.nestedForm = nestedForm;
    }
    if (!nestedForm) return [container];

    const nestedFormHeight = nestedForm.size.height * this.PIXELS_PER_INCH;
    const pageHeight = formSize.height * this.PIXELS_PER_INCH;

    return this.calculatePagination(container, nestedFormHeight, arrayLength, pageHeight).containers;
  }

  private calculatePagination(
    originalContainer: FormContainerDto,
    nestedFormHeight: number,
    arrayLength: number,
    pageHeight: number,
  ): { containers: FormContainerDto[] } {
    const containers: FormContainerDto[] = [];
    const containerY = originalContainer.position.y;
    const currentPage = originalContainer.pageNumber || 1;

    const spaceOnFirstPage = pageHeight - containerY;
    const itemsOnFirstPage = Math.max(1, Math.floor(spaceOnFirstPage / nestedFormHeight));

    let remaining = arrayLength;
    let startIndex = 0;
    let pageNumber = currentPage;

    while (remaining > 0) {
      const isFirst = pageNumber === currentPage;
      const items = isFirst
        ? Math.min(itemsOnFirstPage, remaining)
        : Math.min(Math.floor(pageHeight / nestedFormHeight), remaining);

      const endIndex = startIndex + items;

      const c = new FormContainerDto({
        ...originalContainer,
        pageNumber,
        position: {
          x: originalContainer.position.x,
          y: isFirst ? containerY : 0,
        },
        size: {
          width: originalContainer.size.width,
          height: nestedFormHeight * items,
        },
      });

      (c as any).arrayIndexRange = { start: startIndex, end: endIndex };
      containers.push(c);

      remaining -= items;
      startIndex = endIndex;
      pageNumber++;
    }

    return { containers };
  }

  groupContainersByPage(containers: FormContainerDto[]): { pageNumber: number; containers: FormContainerDto[] }[] {
    const pageMap = new Map<number, FormContainerDto[]>();

    for (const c of containers) {
      const page = c.pageNumber || 1;
      if (!pageMap.has(page)) pageMap.set(page, []);
      pageMap.get(page)!.push(c);
    }

    return Array.from(pageMap.entries())
      .map(([pageNumber, containers]) => ({ pageNumber, containers }))
      .sort((a, b) => a.pageNumber - b.pageNumber);
  }

  getArrayItemsForContainer(container: FormContainerDto, arrayData: any[]): any[] {
    const range = (container as any).arrayIndexRange;
    if (!range || !Array.isArray(arrayData)) return arrayData;
    return arrayData.slice(range.start, range.end);
  }

  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return null;
    return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj);
  }

  private buildNestedFormFromFields(fields: FormField[], formSize: { width: number; height: number }): any {
    const rowHeight = 30;
    const gap = 5;
    let yOffset = 0;
    const containers: any[] = [];

    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const h = f.type === 'textarea' ? rowHeight * 2 : rowHeight;
      containers.push({
        id: -(i + 1),
        contentType: 'formField',
        content: f,
        position: { x: 0, y: yOffset },
        size: { width: formSize.width * this.PIXELS_PER_INCH - 20, height: h },
        pageNumber: 1,
      });
      yOffset += h + gap;
    }

    const totalHeight = yOffset / this.PIXELS_PER_INCH + 0.2;
    return {
      formContainers: containers,
      size: { width: formSize.width, height: Math.max(0.5, totalHeight) },
    };
  }

  private isFormField(content: any): content is FormField {
    return content && typeof content === 'object' && 'name' in content && 'type' in content;
  }
}
