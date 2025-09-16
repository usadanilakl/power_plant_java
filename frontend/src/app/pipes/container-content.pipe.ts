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
        return (container.content as FormField)?.label || '';
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
}