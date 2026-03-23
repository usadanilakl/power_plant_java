import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormDataService {

  /**
   * Deep merges form values with original entity data
   */
  deepMerge(target: any, source: any): any {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        const sourceValue = source[key];
        const targetValue = target[key];

        if (this.isObject(sourceValue) && targetValue) {
          output[key] = this.deepMerge(targetValue, sourceValue);
        } else if (
          targetValue instanceof Date &&
          typeof sourceValue === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(sourceValue)
        ) {
          // Convert date strings back to Date objects
          const [year, month, day] = sourceValue.split('-').map(Number);
          output[key] = new Date(year, month - 1, day);
        } else {
          output[key] = sourceValue;
        }
      });
    }

    return output;
  }

  /**
   * Checks if an item is a plain object
   */
  private isObject(item: any): boolean {
    return (
      item &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      !(item instanceof Date)
    );
  }

  /**
   * Groups fields by their group label
   */
  groupFields(fields: any[]): { [key: string]: any[] } {
    const groupsMap: { [key: string]: any[] } = {};

    fields.forEach((field) => {
      const groupLabel = field.group?.label || 'Ungrouped';
      if (!groupsMap[groupLabel]) {
        groupsMap[groupLabel] = [];
      }
      groupsMap[groupLabel].push(field);
    });

    return groupsMap;
  }

  /**
   * Checks if a value is a Signal
   */
  isSignal(item: any): boolean {
    return (
      item &&
      typeof item === 'function' &&
      typeof item.asReadonly === 'function'
    );
  }

  /**
   * Gets field options, unwrapping from Signal if necessary
   */
  getFieldOptions(options: any): any[] {
    return this.isSignal(options) ? options() : options;
  }
}
