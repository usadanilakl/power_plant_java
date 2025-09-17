import { Pipe, PipeTransform } from '@angular/core';
import { FormContainerDto } from '../models/forms/form-container.model';
import { FormField } from '../models/ui/form-field.model';

@Pipe({
  name: 'containerContent',
  standalone: true,
})
export class ContainerContentPipe implements PipeTransform {
  transform(container: FormContainerDto | null | undefined): string {
    if (!container || !container.content) {
      return '';
    }

    switch (container.contentType) {
      case 'text':
        return typeof container.content === 'string' ? container.content : '';
      case 'formField':
        // Assuming content is a FormField-like object with a 'label'
        return this.formatLabel((container.content as FormField).name);
      case 'variable':
        // Assuming content is a FormField-like object with a 'label'
        return this.formatLabel(container.content as string);
      case 'image':
        // Assuming content is a URL string for the image
        return typeof container.content === 'string' ? container.content : '';
      default:
        if (typeof container.content === 'string') {
          return container.content;
        }
        // Fallback for formField or other object-like content
        return (container.content as FormField)?.label || '';
    }
  }

  private formatLabel(path: string): string {
    if (!path) return '';

    return path
      .split('.')
      .map((part) => {
        const result = part.replace(/([A-Z])/g, ' $1');
        return result.charAt(0).toUpperCase() + result.slice(1);
      })
      .join(' -> ');
  }
}