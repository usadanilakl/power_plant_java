import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
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

@Component({
  selector: 'app-file-bulk-editor-menu',
  imports: [FloatingMenuComponent, EquipmentTableComponent, PopupProjectionComponent, DetailsFormComponent],
  templateUrl: './file-bulk-editor-menu.component.html',
  styleUrl: './file-bulk-editor-menu.component.css'
})
export class FileBulkEditorMenuComponent implements OnInit {

  private currentFileService = inject(CurrentFileService);
  private currentEquipmentService = inject(CurrentEquipmentService);
  private sharedDataService = inject(SharedDataService);
  private destroyRef = inject(DestroyRef);

  private hoverSubject = new Subject<number | null>();
  
  shapes = input<Shape[]>([]);
  isOpen = input<boolean>(false);
  
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
    // Handle menu close
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

  }

  onFormDelete(){}


  //Table related methods

  onEquipmentSelected(item: EquipmentDto) {
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
    this.currentEquipmentService.setCurrentShapeWithId(equipment.id);
  }

  onEquipmentDelete(id: string) {
    // Handle equipment deletion
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

}
