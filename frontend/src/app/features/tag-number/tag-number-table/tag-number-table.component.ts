import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { TagNumberService } from '../../../services/tag-number.service';
import { Column } from '../../../models/column.model';
import { PopupComponent } from "../../../shared/popup/popup.component";
import { BehaviorSubject, Observable } from 'rxjs';
import { LotoPointService } from '../../../services/loto/loto-point.service';
import { LotoPointDetailFormComponent } from '../../loto-points/loto-point-detail-form/loto-point-detail-form.component';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { TagNumberGeneratorComponent } from "../tag-number-generator/tag-number-generator.component";
import { PopupProjectionComponent } from "../../../shared/popup-projection/popup-projection.component";

@Component({
  selector: 'app-tag-number-table',
  standalone: true,
  imports: [CommonModule, TableComponent, PopupComponent, LotoPointDetailFormComponent, TagNumberGeneratorComponent, PopupProjectionComponent],
  templateUrl: `./tag-number-table.component.html`,
})
export class TagNumberTableComponent implements OnInit {
  columns: Column[] = [
    { id: 'tagNumber', header: 'Tag Number', accessorKey: 'tagNumber' },
    { id: 'description', header: 'Description', accessorKey: 'description' },
    { id: 'specificLocation', header: 'Location', accessorKey: 'specificLocation' },
  ];

  initialItems$: Observable<LotoPointDto[]>;
  selectedItem = signal<LotoPointDto>(new LotoPointDto());
  isPopupOpen: boolean = false;
  LotoPointDetailFormComponent = LotoPointDetailFormComponent;

  isTagNumberGeneratorOpen = signal<boolean>(false);

  constructor(private tagNumberService: TagNumberService, private lotoPointService: LotoPointService) {
    this.initialItems$ = new BehaviorSubject<any[]>([]);
  }

  ngOnInit() {
    this.loadInitialItems();
  }

  loadInitialItems() {
    this.tagNumberService.getAllTagNumbers().subscribe(
      (data) => {
        (this.initialItems$ as BehaviorSubject<any[]>).next(data.responseData);
      },
      (error) => {
        console.error('Error loading initial items:', error);
      }
    );
  }


  onItemClick = (item: any) => {
    this.selectedItem.set(item);
    this.isPopupOpen = true;
  }

  closePopup() {
    this.isPopupOpen = false;
    this.selectedItem.set(new LotoPointDto());
  }

  onFormOpen(){
    this.isPopupOpen = true;
  }

  onFormSubmit(formData: any) {
    if (!this.selectedItem()) {
      console.error('No item selected for update');
      return;
    }
  
    const updatedItem = { ...this.selectedItem, ...formData };
  
    this.lotoPointService.updateLotoPoint(updatedItem).subscribe(
      (response) => {
        // console.log('Tag number updated successfully', response.responseData);
        const currentItems = (this.initialItems$ as BehaviorSubject<any[]>).getValue();
        const updatedItems = currentItems.map(item => 
          item.id === this.selectedItem().id ? updatedItem : item
        );
        (this.initialItems$ as BehaviorSubject<any[]>).next(updatedItems);
        this.selectedItem.set(new LotoPointDto());
      },
      error => {
        console.error('Error updating tag number:', error);
      }
    );
  }
  
  onFormDelete() {
    if (this.selectedItem()) {
      this.lotoPointService.deleteLotoPoint(this.selectedItem().id+"").subscribe(
        () => {
          const currentItems = (this.initialItems$ as BehaviorSubject<any[]>).getValue();
          const updatedItems = currentItems.filter(item => item.id !== this.selectedItem().id);
          (this.initialItems$ as BehaviorSubject<any[]>).next(updatedItems);
          this.selectedItem.set(new LotoPointDto());
        },
        error => console.error('Error deleting tag number:', error)
      );
    }
  }

  onGenerateNewTagNumber(){
    this.isTagNumberGeneratorOpen.set(true);
  }
  closeTagNumberGenerator(){
    this.isTagNumberGeneratorOpen.set(false);
  }
}