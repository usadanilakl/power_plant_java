import { Component, computed, DestroyRef, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FloatingMenuComponent, MenuPosition } from "../../../../shared/menu/floating-menu/floating-menu.component";
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, tap } from 'rxjs';
import { ValueDto } from '../../../../models/value.model';
import { Option } from '../../../../models/option.model';
import { SharedDataService } from '../../../../services/shared-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '../../../../models/ui/form-field.model';
import { DetailsFormComponent } from "../../../../shared/details-form/details-form.component";
import { CurrentFileService } from '../../../../services/current-file.service';
import { CurrentEquipmentService } from '../../../../services/current-items-services/current-equipment.service';
import { DataPresetDto } from '../../../../models/equipment/data-preset.model';


@Component({
  selector: 'app-data-preset-menu',
  imports: [FloatingMenuComponent, DetailsFormComponent],
  templateUrl: './data-preset-menu.component.html',
  styleUrl: './data-preset-menu.component.css'
})
export class DataPresetMenuComponent implements OnInit {

  private sharedDataService = inject(SharedDataService);
  private currentFileService = inject(CurrentFileService);
  private currentEquipmentService = inject(CurrentEquipmentService);
  private destroyRef = inject(DestroyRef);

  isOpen = input<boolean>(false);

  closeEvent = output<void>();
  
  MenuPosition = MenuPosition;


  systems = signal<Option[]>([]);
  locations = signal<Option[]>([]);
  vendors = signal<Option[]>([]);
  eqTypes = signal<Option[]>([]);

  fields = computed(() => this.createFields());
  currentValues = signal<DataPresetDto>(new DataPresetDto());

  ngOnInit(): void {
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

  this.currentEquipmentService.getCurrentPresetData().pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(dataPresetData => {
    this.currentValues.set(dataPresetData);
  });
  }



  private createFields(): FormField[] {
    const currentPresetData = this.currentValues();
    return [
      {
        name: 'system',
        label: 'System',
        type: 'select',
        options: this.systems(),
        initialValue: currentPresetData.system?.value || null
      },
      {
        name: 'location',
        label: 'Location',
        type: 'select',
        options: this.locations(),
        initialValue: currentPresetData.location?.value || null
      },
      {
        name: 'vendor',
        label: 'Vendor',
        type: 'select',
        options: this.vendors(),
        initialValue: currentPresetData.vendor?.value || null
      },
      {
        name: 'eqType',
        label: 'Equipment Type',
        type: 'select',
        options: this.eqTypes(),
        initialValue: currentPresetData.eqType?.value || null
      },
      {
        name: 'description',
        label: 'Description',
        type: 'text',
        options: [],
        initialValue: currentPresetData.description || null
      },
      {
        name: 'tagNumber',
        label: 'Tag Number',
        type: 'text',
        options: [],
        initialValue: currentPresetData.tagNumber || null
      }
    ];
  }


  handleClose() {
    this.closeEvent.emit();
  }    

  onFormSubmit(values: DataPresetDto) {
    this.currentEquipmentService.setCurrentPresetData(values);
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
