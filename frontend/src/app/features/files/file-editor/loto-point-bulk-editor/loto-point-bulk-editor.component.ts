import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { FloatingMenuComponent, MenuPosition } from "../../../../shared/menu/floating-menu/floating-menu.component";
import { LotoPointSimpleTableComponent } from "../../../loto-points/loto-point-simple-table/loto-point-simple-table.component";
import { PopupProjectionComponent } from "../../../../shared/popup-projection/popup-projection.component";
import { DetailsFormComponent } from "../../../../shared/details-form/details-form.component";
import { CurrentFileService } from '../../../../services/current-file.service';
import { CurrentEquipmentService } from '../../../../services/current-items-services/current-equipment.service';
import { SharedDataService } from '../../../../services/shared-data.service';
import { catchError, forkJoin, map, Observable, of, Subject, tap } from 'rxjs';
import { Shape } from '../../../../models/shape.model';
import { LotoPointDto, LotoPointFormField } from '../../../../models/loto/loto-point.model';
import { Option } from '../../../../models/option.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { Column } from '../../../../models/column.model';
import { ValueDto } from '../../../../models/value.model';
import { LotoPointService } from '../../../../services/loto/loto-point.service';
import { CurrentValueService } from '../../../../services/current-value.service';
import { BaseDto } from '../../../../models/base/base.model';
import { FormField } from '../../../../models/ui/form-field.model';
import { ReactiveFormComponent } from "../../../../shared/reactive-form/reactive-form.component";

@Component({
  selector: 'app-loto-point-bulk-editor',
  imports: [FloatingMenuComponent, LotoPointSimpleTableComponent, PopupProjectionComponent, DetailsFormComponent, ReactiveFormComponent],
  templateUrl: './loto-point-bulk-editor.component.html',
  styleUrl: './loto-point-bulk-editor.component.css'
})
export class LotoPointBulkEditorComponent implements OnInit {

  private currentFileService = inject(CurrentFileService);
  private currentEquipmentService = inject(CurrentEquipmentService);
  private currentValueService = inject(CurrentValueService);
  private lotoPointService = inject(LotoPointService);
  private destroyRef = inject(DestroyRef);

  private hoverSubject = new Subject<number | null>();
  
  shapes = input<Shape[]>([]);
  isOpen = input<boolean>(false);

  closeEvent = output<void>();
  selectedItemsEvent = output<LotoPointDto[]>();
  
  lotoPoints = signal<LotoPointDto[]>([]);
  lotoPoints$: Observable<LotoPointDto[]>;
  itemToEdit = signal<LotoPointDto | null>(null);
  fields = signal<LotoPointFormField[]>([]);
  isPopupOpen = false;
  isFormReady = false;
  DetailsFormComponent = DetailsFormComponent;

  isoPosOptions = signal<Option[]>([]);
  normPosOptions = signal<Option[]>([]);

  MenuPosition = MenuPosition;

  selectedItems = signal<LotoPointDto[]>([]);

  constructor() {
    this.lotoPoints$ = this.currentFileService.getAssociatedLotoPoints();
  }


  ngOnInit(): void {
    this.currentFileService.getAssociatedLotoPoints().subscribe(lotoPointList => {
      this.lotoPoints.set(lotoPointList);
    });
    
    this.loadOptions('isoPos', this.isoPosOptions);
    this.loadOptions('normPos', this.normPosOptions);

  }

  handleClose() {
    this.closeEvent.emit();
  }

  updateSelectedShape(shapeId: number | null) {
    this.hoverSubject.next(shapeId);
  }

  onClosePopup() {
    this.isPopupOpen = false;
    this.itemToEdit.set(null);
    this.fields.set([]);
    this.isFormReady = false;
  }

  onFormSubmit(formData: any) {
    if (this.itemToEdit()) {
      // Create a new object with the updated fields
      console.log('onFormSubmit', formData);
      const updatedLotoPoint = new LotoPointDto({...this.itemToEdit(), ...formData});
      console.log('Updated LotoPoint:', updatedLotoPoint);

      // Update the itemToEdit signal
      this.itemToEdit.set(updatedLotoPoint);
  
      // Update on the server
      this.lotoPointService.updateLotoPoint(updatedLotoPoint).pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(updatedItem => {
          // Update the equipment in the equipmentData list
        this.currentFileService.updateAssociatedLotoPoint(updatedItem.responseData);
          // Close the popup
          this.onClosePopup();
        }),
        catchError(error => {
          console.error('Error updating equipment:', error);
          // Handle error (e.g., show error message to user)
          return of(null);
        })
      ).subscribe();
    }
  }


  //Table related methods

  onLotoPointSelected(item: LotoPointDto) {
    this.currentEquipmentService.setCurrentShapeWithIds(item.equipmentIdList!);
  }

  onEquipmentEdit(lotoPoint: LotoPointDto, column: Column) {
    this.itemToEdit.set(lotoPoint);
    this.setupEditFields(lotoPoint, column);
    this.isPopupOpen = true;
  }

  onEquipmentContextMenu(equipment: EquipmentDto) {
    // Handle right-click context menu
  }

  onEquipmentHover(equipment: EquipmentDto) {
    // this.currentEquipmentService.setCurrentShapeWithId(equipment.id);
  }

  onEquipmentDelete(id: string) {
    // Handle equipment deletion
  }

  onSelectedItems(items: LotoPointDto[]) {
    console.log('onSelectedItems', items);
    this.selectedItems.set(items);
  }

  applyPresetValues() {
    this.currentEquipmentService.getCurrentPresetLotoPointData().pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(presetData => {
        if (presetData) {
          const updatedItems = this.selectedItems().map(item => new LotoPointDto({
            ...item,
            ...presetData,
            id: item.id,
          }));

          console.log('current :', this.selectedItems());
          console.log('Preset values applied to items:', presetData);
          console.log('Updated items:', updatedItems);
  
          // Update the selected items in the component
          this.selectedItems.set(updatedItems);
  
          // Update the items in the equipmentData
          const updatedEquipmentData = this.lotoPoints().map(item => 
            updatedItems.find(updatedItem => updatedItem.id === item.id) || item
          );
          this.lotoPoints.set(updatedEquipmentData);
  
          // Optionally, update the items on the server
          this.updateItemsOnServer(updatedItems);
        }
      }),
      catchError(error => {
        console.error('Error applying preset values:', error);
        // Handle the error (e.g., show an error message to the user)
        return of(null);
      })
    ).subscribe();
  }
  
  private updateItemsOnServer(items: LotoPointDto[]) {
    // Create an array of observables for each item update
    const updateObservables = items.map(item => 
      this.lotoPointService.updateLotoPoint(item)
    );
  
    // Use forkJoin to execute all updates in parallel
    forkJoin(updateObservables).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(results => {
        // Optionally, you can update the local data with the server responses here
      }),
      catchError(error => {
        console.error('Error updating items on server:', error);
        // Handle the error (e.g., show an error message to the user)
        return of(null);
      })
    ).subscribe();
  }


  
  
    private setupEditFields(item: LotoPointDto, column: Column) {
      if (LotoPointDto.isValidKey(column.id)) {
        this.fields.set(LotoPointDto.toFormFields(
          item,
          this.isoPosOptions(),
          this.normPosOptions(),
          [column.id]
        ));
        this.isFormReady = true;
      } else {
        console.error(`Invalid column id: ${column.id}`);
        // Handle the error case, maybe set a default field or show an error message
      }
    }    
    


  private loadOptions(category: string, optionsSignal: ReturnType<typeof signal<Option[]>>) {
    this.currentValueService.getOptionsByCategory(category).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(options => {
      optionsSignal.set(options);
    });
  }
}
