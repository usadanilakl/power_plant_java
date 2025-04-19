import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nonNullable',
  standalone: true
})
export class NonNullablePipe implements PipeTransform {
  transform<T>(value: T | null | undefined): T {
    return value ?? [] as unknown as T;
  }
}