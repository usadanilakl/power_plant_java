import { Component, computed, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { EquipmentDto } from '../../../models/equipment/equipment.model';
import { Option } from '../../../models/option.model';
import { catchError, forkJoin, map, Observable, of, tap } from 'rxjs';
import { SharedDataService } from '../../../services/shared-data.service';
import { CurrentFileService } from '../../../services/current-file.service';
import { CurrentEquipmentService } from '../../../services/current-items-services/current-equipment.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '../../../models/ui/form-field.model';
import { ValueDto } from '../../../models/value.model';
import { DetailsFormComponent } from "../../../shared/details-form/details-form.component";
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { LotoPointTableComponent } from "../../loto-points/loto-point-table/loto-point-table.component";
import { LotoPointSimpleTableComponent } from "../../loto-points/loto-point-simple-table/loto-point-simple-table.component";

@Component({
  selector: 'app-equipment-form',
  imports: [DetailsFormComponent, LotoPointTableComponent, LotoPointSimpleTableComponent],
  templateUrl: './equipment-form.component.html',
  styleUrl: './equipment-form.component.css'
})
export class EquipmentFormComponent implements OnInit {

  private sharedDataService = inject(SharedDataService);
  private currentFileService = inject(CurrentFileService);
  private currentEquipmentService = inject(CurrentEquipmentService);
  private destroyRef = inject(DestroyRef);

  values = input<EquipmentDto>(new EquipmentDto());

  formSubmit = output<any>();
  formDelete = output<void>();
  valuesChange = output<EquipmentDto>();

  systems = signal<Option[]>([]);
  locations = signal<Option[]>([]);
  vendors = signal<Option[]>([]);
  eqTypes = signal<Option[]>([]);

  isFormReady = signal<boolean>(true);
  fields = computed(() => this.createFields());

  lotoPoints$ = this.currentEquipmentService.getlotoPoints();

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
        this.isFormReady.set(true);
      }),
      catchError(error => {
        console.error('Error loading form data:', error);
        return of({ isoPositions: [], normPositions: [] });
      })
    ).subscribe();
  }



  private createFields(): FormField[] {
    const currentPresetData = this.values();
    return [
      {
        name: 'system',
        label: 'System',
        type: 'select',
        options: this.addDefaultOption(this.systems(), 'Select System'),
        initialValue: currentPresetData.system?.id || ''
      },
      {
        name: 'location',
        label: 'Location',
        type: 'select',
        options: this.addDefaultOption(this.locations(), 'Select Location'),
        initialValue: currentPresetData.location?.id || ''
      },
      {
        name: 'vendor',
        label: 'Vendor',
        type: 'select',
        options: this.addDefaultOption(this.vendors(), 'Select Vendor'),
        initialValue: currentPresetData.vendor?.id || ''
      },
      {
        name: 'eqType',
        label: 'Equipment Type',
        type: 'select',
        options: this.addDefaultOption(this.eqTypes(), 'Select Equipment Type'),
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
      },
      {
        name: 'specificLocation',
        label: 'Specific Location',
        type: 'text',
        options: [],
        initialValue: currentPresetData.specificLocation || null
      }
    ];
  }

  private addDefaultOption(options: Option[], defaultLabel: string): Option[] {
    return [{ value: '', label: defaultLabel }, ...options];
  }

  onFormSubmit(updatedValues: any) {
    const updatedEquipment = new EquipmentDto({ ...this.values(), ...updatedValues });
    this.valuesChange.emit(updatedEquipment);
    this.formSubmit.emit(updatedEquipment);
  }
  
  onFormDelete() {
    this.formDelete.emit();
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
