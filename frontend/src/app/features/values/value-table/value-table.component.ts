import { Component, inject, OnInit, output, signal } from '@angular/core';
import { TableComponent } from "../../../shared/table/table.component";
import { Column } from '../../../models/column.model';
import { CurrentValueService } from '../../../services/current-value.service';
import { ValueDto } from '../../../models/value.model';
import { tap } from 'rxjs';

@Component({
  selector: 'app-value-table',
  imports: [TableComponent],
  templateUrl: './value-table.component.html',
  styleUrl: './value-table.component.css',
  standalone: true,
})
export class ValueTableComponent implements OnInit {

  private currentValueService = inject(CurrentValueService);

  rowClicked = output<ValueDto>();

  columns = signal<Column[]>([
    {id: 'name', header: 'Value', accessorKey: 'name' },
    {id: 'category.name', header: 'Category', accessorKey: 'category.name' },
  ]);
  items = signal<ValueDto[]>([]);

  ngOnInit(): void {
    this.currentValueService.getAllValueDtos().pipe(
      tap(values => {
        this.items.set(values);
        // console.log('Loaded categories:', values);
      })
    ).subscribe({
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  onRowClick(row: ValueDto): void  {
    this.rowClicked.emit(row);
  }

}
