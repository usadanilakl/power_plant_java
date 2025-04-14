import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { TagNumberService } from '../../../services/tag-number.service';
import { Column } from '../../../models/column.model';
import { TagNumberDetailFormComponent } from "../tag-number-detail-form/tag-number-detail-form.component";
import { PopupComponent } from "../../../shared/popup/popup.component";
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-tag-number-table',
  standalone: true,
  imports: [CommonModule, TableComponent, TagNumberDetailFormComponent, PopupComponent],
  templateUrl: `./tag-number-table.component.html`,
})
export class TagNumberTableComponent implements OnInit {
  columns: Column[] = [
    { id: 'tagNumber', header: 'Tag Number', accessorKey: 'number' },
    { id: 'description', header: 'Description', accessorKey: 'description' },
    { id: 'area', header: 'Area', accessorKey: 'area' },
    { id: 'system', header: 'System', accessorKey: 'system' }
  ];

  initialItems$: Observable<any[]>;
  selectedItem: any = null;
  isPopupOpen: boolean = false;
  TagNumberDetailFormComponent = TagNumberDetailFormComponent;

  constructor(private tagNumberService: TagNumberService) {
    this.initialItems$ = new BehaviorSubject<any[]>([]);
  }

  ngOnInit() {
    this.loadInitialItems();
  }

  loadInitialItems() {
    this.tagNumberService.getTagNumbers().subscribe(
      (data) => {
        (this.initialItems$ as BehaviorSubject<any[]>).next(data);
      },
      (error) => {
        console.error('Error loading initial items:', error);
      }
    );
  }

  loadMoreItems = async () => {
    const currentItems = (this.initialItems$ as BehaviorSubject<any[]>).getValue();
    const lastItem = currentItems[currentItems.length - 1];
    const params = { lastId: lastItem.id };
    return new Promise<any[]>((resolve, reject) => {
      this.tagNumberService.getTagNumbers(params).subscribe(
        (data) => {
          const updatedItems = [...currentItems, ...data];
          (this.initialItems$ as BehaviorSubject<any[]>).next(updatedItems);
          resolve(data);
        },
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

  onItemClick = (item: any) => {
    this.selectedItem = item;
    this.isPopupOpen = true;
  }

  closePopup() {
    this.isPopupOpen = false;
    this.selectedItem = null;
  }

  onFormSubmit(formData: any) {
    if (!this.selectedItem) {
      console.error('No item selected for update');
      return;
    }
  
    const updatedItem = { ...this.selectedItem, ...formData };
  
    this.tagNumberService.updateTagNumber(this.selectedItem.id, updatedItem).subscribe(
      (response) => {
        console.log('Tag number updated successfully', response);
        const currentItems = (this.initialItems$ as BehaviorSubject<any[]>).getValue();
        const updatedItems = currentItems.map(item => 
          item.id === this.selectedItem.id ? updatedItem : item
        );
        (this.initialItems$ as BehaviorSubject<any[]>).next(updatedItems);
        this.selectedItem = null;
      },
      error => {
        console.error('Error updating tag number:', error);
      }
    );
  }
  
  onFormDelete() {
    if (this.selectedItem) {
      this.tagNumberService.deleteTagNumber(this.selectedItem.id).subscribe(
        () => {
          console.log('Tag number deleted successfully');
          const currentItems = (this.initialItems$ as BehaviorSubject<any[]>).getValue();
          const updatedItems = currentItems.filter(item => item.id !== this.selectedItem.id);
          (this.initialItems$ as BehaviorSubject<any[]>).next(updatedItems);
          this.selectedItem = null;
        },
        error => console.error('Error deleting tag number:', error)
      );
    }
  }
}