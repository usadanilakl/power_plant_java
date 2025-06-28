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
import { EquipmentDto } from '../../../../models/equipment/equipment.model';


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
  currentValues = signal<EquipmentDto>(new EquipmentDto());

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
        options: this.addDefaultOption(this.systems(), 'Skip System'),
        initialValue: currentPresetData.system?.id || ''
      },
      {
        name: 'location',
        label: 'Location',
        type: 'select',
        options: this.addDefaultOption(this.locations(), 'Skip Location'),
        initialValue: currentPresetData.location?.id || ''
      },
      {
        name: 'vendor',
        label: 'Vendor',
        type: 'select',
        options: this.addDefaultOption(this.vendors(), 'Skip Vendor'),
        initialValue: currentPresetData.vendor?.id || ''
      },
      {
        name: 'eqType',
        label: 'Equipment Type',
        type: 'select',
        options: this.addDefaultOption(this.eqTypes(), 'Skip Equipment Type'),
        initialValue: currentPresetData.eqType?.id || ''
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

  private addDefaultOption(options: Option[], defaultLabel: string): Option[] {
    return [{ value: '', label: defaultLabel }, ...options];
  }


  handleClose() {
    this.closeEvent.emit();
  }    

  onFormSubmit(values: EquipmentDto) {
    this.currentEquipmentService.setCurrentPresetData(new EquipmentDto({ ...values }));
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
