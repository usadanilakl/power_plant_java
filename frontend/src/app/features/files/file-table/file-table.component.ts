import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { Column } from '../../../models/column.model';
import { FileDetailFormComponent } from "../file-detail-form/file-detail-form.component";
import { PopupComponent } from "../../../shared/popup/popup.component";
import { FileService } from '../../../services/file.service';
import { ImageInteractiveComponent } from "../../../shared/image/image-interactive/image-interactive.component";
import { DrawingComponent } from '../../../shared/image/drawing/drawing.component';

@Component({
  selector: 'app-file-table',
  standalone: true,
  imports: [CommonModule, TableComponent, FileDetailFormComponent, PopupComponent, ImageInteractiveComponent],
  templateUrl: './file-table.component.html',
})
export class FileTableComponent implements OnInit {
  columns: Column[] = [
    { id: 'fileName', header: 'File Name', accessorKey: 'name' },
    { id: 'fileType', header: 'File Type', accessorKey: 'type' },
    { id: 'uploadDate', header: 'Upload Date', accessorKey: 'uploadDate' },
    { id: 'fileSize', header: 'File Size', accessorKey: 'size' }
  ];

  initialItems: any[] = [];
  selectedItem: any = null;
  isPopupOpen: boolean = false;
  FileDetailFormComponent = FileDetailFormComponent;
  ImageInteractiveComponent = ImageInteractiveComponent;
  DrawingComponent = DrawingComponent;
  isImagePopupOpen: boolean = false;
  selectedImagePath: string = '';

  constructor(private fileService: FileService) {}

  ngOnInit() {
    this.loadInitialItems();
  }

  loadInitialItems() {
    this.fileService.getFiles().subscribe(
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
      this.fileService.getFiles(params).subscribe(
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
      this.fileService.searchFiles(criteria).subscribe(
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
    this.fileService.updateFile(this.selectedItem.id, updatedItem).subscribe(
      (response) => {
        console.log('File updated successfully', response);
        this.selectedItem = null; // Close the form
      },
      error => {
        console.error('Error updating file:', error);
        // Optionally, revert the change in the local array if the server update fails
        if (index !== -1) {
          this.initialItems[index] = this.selectedItem;
        }
      }
    );
  }

  onFormDelete() {
    if (this.selectedItem) {
      this.fileService.deleteFile(this.selectedItem.id).subscribe(
        () => {
          console.log('File deleted successfully');
          this.initialItems = this.initialItems.filter(item => item.id !== this.selectedItem.id);
          this.selectedItem = null; // Close the form
        },
        error => console.error('Error deleting file:', error)
      );
    }
  }
  onOpenImage() {
    console.log('Opening image popup');
    if (this.selectedItem && this.selectedItem.type.startsWith('jpg')) {
      console.log('Selected image:', this.selectedItem.url);
      this.selectedImagePath = this.selectedItem.url;
      this.isImagePopupOpen = true;
    } else {
      console.log('Selected file is not an image or no file is selected');
    }
  }

  closeImagePopup() {
    this.isImagePopupOpen = false;
  }
}