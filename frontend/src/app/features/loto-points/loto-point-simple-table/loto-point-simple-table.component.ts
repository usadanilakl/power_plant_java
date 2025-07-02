import { Component, computed, inject, input, output, OnInit, DestroyRef, effect } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { TableComponent } from "../../../shared/table/table.component";
import { LotoPointService } from '../../../services/loto/loto-point.service';
import { SearchCriteria } from '../../../models/api/search-criteria.model';
import { BehaviorSubject, Observable, isObservable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Column } from '../../../models/column.model';

@Component({
  selector: 'app-loto-point-simple-table',
  standalone: true,
  imports: [TableComponent],
  templateUrl: './loto-point-simple-table.component.html',
  styleUrl: './loto-point-simple-table.component.css'
})
export class LotoPointSimpleTableComponent implements OnInit {
  private lotoPointService = inject(LotoPointService);
  private destroyRef = inject(DestroyRef);

  initialItems = input<Observable<LotoPointDto[]> | LotoPointDto[]>();
  enableSearch = input<boolean>();
  initialSearchQuery = input<SearchCriteria>();

  private itemsSubject = new BehaviorSubject<LotoPointDto[]>([]);
  items$ = this.itemsSubject.asObservable();

  columns = computed(() => LotoPointDto.toTableColumns(['tagNumber', 'description', 'specificLocation']));

  itemsUpdated = output<LotoPointDto[]>();
  doubleClickEvent = output<LotoPointDto>();
  cellDboubleClickEvent = output<{item: LotoPointDto,column: Column}>();
  rightClickEvent = output<LotoPointDto>();
  leftClickEvent = output<LotoPointDto>();

    constructor() {
    effect(() => {
      const searchCriteria = this.initialSearchQuery();
      if (searchCriteria) {
        this.onSearch(searchCriteria);
      }
    });
  }

  ngOnInit() {
    const initialItems = this.initialItems();
    if (isObservable(initialItems)) {
      initialItems.pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(items => {
        this.itemsSubject.next(items);
      });
    } else if (Array.isArray(initialItems)) {
      this.itemsSubject.next(initialItems);
    }
  }

  onSearch(searchCriteria: SearchCriteria) {
    if (!this.enableSearch()) return;
    
    this.lotoPointService.searchLotoPoints(searchCriteria, 500).subscribe({
      next: (response) => {
        if (response && response.responseData && Array.isArray(response.responseData.content)) {
          const newItems = response.responseData.content.map(item => LotoPointDto.fromJson(item));
          this.itemsSubject.next(newItems);
          this.itemsUpdated.emit(newItems);
        } else {
          console.error('Unexpected response format:', response);
        }
      },
      error: (error) => {
        console.error('Error searching LOTO points:', error);
        // Handle error (e.g., show an error message to the user)
      }
    });
  }

  onRowDoubleClick(item: LotoPointDto) {
    this.doubleClickEvent.emit(item);
  }

  onCellDbouleClick(item: LotoPointDto,column: Column) {
    this.cellDboubleClickEvent.emit({item, column});
  }

  onRowRightClick(item: LotoPointDto) {
    this.rightClickEvent.emit(item);
  }

  onRowClick = (item: LotoPointDto) => {
    this.leftClickEvent.emit(item);
  }
}