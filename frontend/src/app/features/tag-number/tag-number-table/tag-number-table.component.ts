import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { TagNumberService } from '../../../services/tag-number.service';
import { Column } from '../../../models/column.model';

@Component({
  selector: 'app-tag-number-table',
  standalone: true,
  imports: [CommonModule, TableComponent],
  template: `
    <app-shared-table
      [columns]="columns"
      [initialItems]="initialItems"
      [loadMoreCallback]="loadMoreItems"
      [searchCallback]="searchItems"
    ></app-shared-table>
  `
})
export class TagNumberTableComponent implements OnInit {
  columns: Column[] = [
    { id: 'tagNumber', header: 'Tag Number', accessorKey: 'tagNumber' },
    { id: 'description', header: 'Description', accessorKey: 'description' },
    { id: 'area', header: 'Area', accessorKey: 'area' },
    { id: 'system', header: 'System', accessorKey: 'system' }
  ];

  initialItems: any[] = [];

  constructor(private tagNumberService: TagNumberService) {}

  ngOnInit() {
    this.loadInitialItems();
  }

  loadInitialItems() {
    this.tagNumberService.getTagNumbers({}).subscribe(
      (data) => {
        this.initialItems = data;
      },
      (error) => {
        console.error('Error loading initial items:', error);
      }
    );
  }

  loadMoreItems = async () => {
    const lastItem = this.initialItems[this.initialItems.length - 1];
    const params = { lastId: lastItem.id };
    return new Promise<any[]>((resolve, reject) => {
      this.tagNumberService.getTagNumbers(params).subscribe(
        (data) => resolve(data),
        (error) => {
          console.error('Error loading more items:', error);
          reject([]);
        }
      );
    });
  };

  searchItems = async (criteria: any) => {
    return new Promise<any[]>((resolve, reject) => {
      this.tagNumberService.searchTagNumbers(criteria).subscribe(
        (data) => resolve(data),
        (error) => {
          console.error('Error searching items:', error);
          reject([]);
        }
      );
    });
  };
}