import { Component, signal } from '@angular/core';
import { ValueDto } from '../../models/value.model';

@Component({
  selector: 'app-values',
  imports: [],
  templateUrl: './values.component.html',
  styleUrl: './values.component.css',
  standalone: true
})
export class ValuesComponent {

  isValueFormOpen = signal<boolean>(false);
  selectedValue = signal<ValueDto | null>(null);

  openValueForm(item: ValueDto) {
    this.selectedValue.set(item);
    this.isValueFormOpen.set(true);
  }

}
