import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { FloatingMenuComponent, MenuPosition } from "../../../../shared/menu/floating-menu/floating-menu.component";
import { Shape } from '../../../../models/shape.model';
import { CurrentFileService } from '../../../../services/current-file.service';
import { EquipmentDto, EquipmentFormField } from '../../../../models/equipment/equipment.model';
import { CurrentEquipmentService } from '../../../../services/current-items-services/current-equipment.service';
import { catchError, debounceTime, forkJoin, map, Observable, of, Subject, tap } from 'rxjs';
import { EquipmentTableComponent } from "../../../equipment/equipment-table/equipment-table.component";
import { PopupProjectionComponent } from "../../../../shared/popup-projection/popup-projection.component";
import { DetailsFormComponent } from "../../../../shared/details-form/details-form.component";
import { Column } from '../../../../models/column.model';
import { ValueDto } from '../../../../models/value.model';
import { Option } from '../../../../models/option.model';
import { SharedDataService } from '../../../../services/shared-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EquipmentService } from '../../../../services/equipment.service';
import { FileLookupMenuComponent } from "../file-lookup-menu/file-lookup-menu.component";

@Component({
  selector: 'app-file-bulk-editor-menu',
  imports: [FloatingMenuComponent, EquipmentTableComponent, PopupProjectionComponent, DetailsFormComponent, FileLookupMenuComponent],
  templateUrl: './file-bulk-editor-menu.component.html',
  styleUrl: './file-bulk-editor-menu.component.css'
})
export class FileBulkEditorMenuComponent implements OnInit {

  private currentFileService = inject(CurrentFileService);
  private currentEquipmentService = inject(CurrentEquipmentService);
  private sharedDataService = inject(SharedDataService);
  private equipmentService = inject(EquipmentService);
  private destroyRef = inject(DestroyRef);

  private hoverSubject = new Subject<number | null>();
  
  shapes = input<Shape[]>([]);
  isOpen = input<boolean>(false);

  closeEvent = output<void>();
  selectedItemsEvent = output<EquipmentDto[]>();
  
  equipmentData = signal<EquipmentDto[]>([]);
  itemToEdit = signal<EquipmentDto | null>(null);
  fields: EquipmentFormField[] = [];
  isPopupOpen = false;
  isFormReady = false;
  DetailsFormComponent = DetailsFormComponent;

  systems = signal<Option[]>([]);
  locations = signal<Option[]>([]);
  vendors = signal<Option[]>([]);
  eqTypes = signal<Option[]>([]);

  MenuPosition = MenuPosition;

  selectedItems = signal<EquipmentDto[]>([]);
  isLookupMenuOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.currentFileService.getElementsToRender().subscribe(equipmentList => {
      this.equipmentData.set(equipmentList);
    });
    forkJoin({
      systems: this.loadOptions(this.sharedDataService.loadSystems()),
      locations: this.loadOptions(this.sharedDataService.loadLocations()),
      vendors: this.loadOptions(this.sharedDataService.loadVendors()),
      eqTypes: this.loadOptions(this.sharedDataService.loadEqTypes()),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(({ systems, locations, vendors, eqTypes }) => {
        this.systems.set(systems);
        this.locations.set(locations);
        this.vendors.set(vendors);
        this.eqTypes.set(eqTypes);
      }),
      catchError(error => {
        console.error('Error loading form data:', error);
        return of({ isoPositions: [], normPositions: [] });
      })
    ).subscribe();
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
    this.fields = [];
    this.isFormReady = false;
  }

  onFormSubmit(formData: any) {
    if (this.itemToEdit()) {
      // Create a new object with the updated fields
      const updatedEquipment = new EquipmentDto({...this.itemToEdit(), ...formData});

      // Update the itemToEdit signal
      this.itemToEdit.set(updatedEquipment);
  
      // Update on the server
      this.equipmentService.updateEquipment(updatedEquipment).pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(updatedItem => {
          // Update the equipment in the equipmentData list
        this.currentFileService.updateEquipmentInList(updatedItem.responseData);
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

  onEquipmentSelected(item: EquipmentDto) {
    this.currentEquipmentService.setCurrentShapeWithId(item.id);
  }

  onEquipmentEdit(equipment: EquipmentDto, column: Column) {
    this.itemToEdit.set(equipment);
    this.setupEditFields(equipment, column);
    this.isPopupOpen = true;
  }

  onEquipmentContextMenu(equipment: EquipmentDto) {
    // Handle right-click context menu
  }

  onEquipmentHover(equipment: EquipmentDto) {
    // this.currentEquipmentService.setCurrentShapeWithId(equipment.id);
  }

  onEquipmentDelete(id: string) {
    this.equipmentService.deleteEquipment(Number(id)).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(() => {
        // Remove the item from the equipmentData list
        // this.currentFileService.removeEquipmentFromList(id);//need to implement.
      }),
      catchError(error => {
        console.error('Error deleting equipment:', error);
        // Handle error (e.g., show error message to user)
        return of(null);
      })
    ).subscribe();
  }

  onSelectedItems(items: EquipmentDto[]) {
    this.selectedItems.set(items);
  }

  applyPresetValues() {
    this.currentEquipmentService.getCurrentPresetData().pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(presetData => {
        if (presetData) {
          const updatedItems = this.selectedItems().map(item => (new EquipmentDto({
            ...item,
            ...presetData,
            id: item.id,
          })));
  
          // Update the selected items in the component
          this.selectedItems.set([]);
  
          // Update the items in the equipmentData
          const updatedEquipmentData = this.equipmentData().map(item => 
            updatedItems.find(updatedItem => updatedItem.id === item.id) || item
          );
          this.equipmentData.set(updatedEquipmentData);

          console.log('items: ', this.equipmentData())
  
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
  
  private updateItemsOnServer(items: EquipmentDto[]) {
    // Create an array of observables for each item update
    const updateObservables = items.map(item => 
      this.equipmentService.updateEquipment(item)
    );
  
    // Use forkJoin to execute all updates in parallel
    forkJoin(updateObservables).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(results => {
        this.currentFileService.updateRenderedEquipment(results.map(result => result.responseData));
      }),
      catchError(error => {
        console.error('Error updating items on server:', error);
        // Handle the error (e.g., show an error message to the user)
        return of(null);
      })
    ).subscribe();
  }


  
  
    private setupEditFields(item: EquipmentDto, column: Column) {
      if (EquipmentDto.isValidKey(column.id)) {
        this.fields = EquipmentDto.toFormFields(
          item,
          this.eqTypes(),
          this.vendors(),
          this.locations(),
          this.systems(),
          [column.id]
        );
        this.isFormReady = true;
      } else {
        console.error(`Invalid column id: ${column.id}`);
        // Handle the error case, maybe set a default field or show an error message
      }
    }    
    
    private loadOptions(source: Observable<ValueDto[]>): Observable<Option[]> {
      return source.pipe(
        map(items => items.map(item => new ValueDto(item).toOption())),
        catchError(error => {
          console.error('Error loading options:', error);
          return of([]);
        })
      );
    }

    toggleLookupMenu() {
      this.isLookupMenuOpen.set(!this.isLookupMenuOpen());
    }

}
