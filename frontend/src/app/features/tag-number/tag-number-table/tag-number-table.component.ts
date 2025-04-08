import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { TagNumberService } from '../../../services/tag-number.service';
import { Column } from '../../../models/column.model';
import { TagNumberDetailFormComponent } from "../tag-number-detail-form/tag-number-detail-form.component";
import { PopupComponent } from "../../../shared/popup/popup.component";

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

  initialItems: any[] = [];
  selectedItem: any = null;
  isPopupOpen: boolean = false;
  TagNumberDetailFormComponent = TagNumberDetailFormComponent;

  constructor(private tagNumberService: TagNumberService) {}

  ngOnInit() {
    this.loadInitialItems();
  }

  loadInitialItems() {
    this.tagNumberService.getTagNumbers().subscribe(
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
  
    // Merge the existing item data with the new form data
    const updatedItem = { ...this.selectedItem, ...formData };
  
    // Update the item in the table
    const index = this.initialItems.findIndex(item => item.id === this.selectedItem.id);
    if (index !== -1) {
      this.initialItems[index] = updatedItem;
    }
  
    // Update in the backend
    this.tagNumberService.updateTagNumber(this.selectedItem.id, updatedItem).subscribe(
      (response) => {
        console.log('Tag number updated successfully', response);
        this.selectedItem = null; // Close the form
      },
      error => {
        console.error('Error updating tag number:', error);
        // Optionally, revert the change in the local array if the server update fails
        if (index !== -1) {
          this.initialItems[index] = this.selectedItem;
        }
      }
    );
  }

  onFormDelete() {
    if (this.selectedItem) {
      this.tagNumberService.deleteTagNumber(this.selectedItem.id).subscribe(
        () => {
          console.log('Tag number deleted successfully');
          this.initialItems = this.initialItems.filter(item => item.id !== this.selectedItem.id);
          this.selectedItem = null; // Close the form
        },
        error => console.error('Error deleting tag number:', error)
      );
    }
  }
}