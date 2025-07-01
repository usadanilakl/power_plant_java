import { Component, signal } from '@angular/core';
import { ValueTableComponent } from "./value-table/value-table.component";
import { ValueFormComponent } from "./value-form/value-form.component";
import { ValueDto } from '../../models/value.model';

@Component({
  selector: 'app-values',
  imports: [ValueTableComponent, ValueFormComponent],
  templateUrl: './values.component.html',
  styleUrl: './values.component.css',
  standalone: true
})
export class ValuesComponent {

  isValueFormOpen = signal<boolean>(false);
  selectedValue = signal<ValueDto | null>(null);

  openValueForm(item: ValueDto) {
    console.log('Open value form');
    this.selectedValue.set(item);
    this.isValueFormOpen.set(true);
  }

}
