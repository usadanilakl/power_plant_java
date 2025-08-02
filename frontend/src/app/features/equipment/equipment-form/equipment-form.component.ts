import { Component, computed, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { EquipmentDto } from '../../../models/equipment/equipment.model';
import { Option } from '../../../models/option.model';
import { catchError, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { SharedDataService } from '../../../services/shared-data.service';
import { CurrentEquipmentService } from '../../../services/current-items-services/current-equipment.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '../../../models/ui/form-field.model';
import { DetailsFormComponent } from "../../../shared/details-form/details-form.component";
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { LotoPointSimpleTableComponent } from "../../loto-points/loto-point-simple-table/loto-point-simple-table.component";
import { EquipmentService } from '../../../services/equipment.service';
import { ReactiveFormComponent } from "../../../shared/reactive-form/reactive-form.component";
import { CurrentValueService } from '../../../services/current-value.service';
import { SearchCriteria, SearchCriteriaDto } from '../../../models/api/search-criteria.model';
import { Validators } from '@angular/forms';
import { Question } from '../../../models/ui/question.model';
import { ConfirmationService } from '../../../services/ui/confirmation.service';

@Component({
  selector: 'app-equipment-form',
  imports: [DetailsFormComponent, LotoPointSimpleTableComponent, ReactiveFormComponent],
  templateUrl: './equipment-form.component.html',
  styleUrl: './equipment-form.component.css',
  standalone: true
})
export class EquipmentFormComponent implements OnInit {

  private sharedDataService = inject(SharedDataService);
  private currentValueService = inject(CurrentValueService);
  private currentEquipmentService = inject(CurrentEquipmentService);
  private equipmentService = inject(EquipmentService);
  private destroyRef = inject(DestroyRef);
  private confirmationService = inject(ConfirmationService);

  values = input<EquipmentDto>(new EquipmentDto());
  layout = input<'column' | 'row' | 'reactive'>('reactive');

  formSubmit = output<any>();
  formDelete = output<void>();
  valuesChange = output<EquipmentDto>();
  addNewLotoPointEvent = output<number>();
  createNewEqAndAddLotoPointEvent = output<EquipmentDto>();

  systems = signal<Option[]>([]);
  locations = signal<Option[]>([]);
  vendors = signal<Option[]>([]);
  eqTypes = signal<Option[]>([]);

  isFormReady = signal<boolean>(true);
  fields = computed(() => this.createFields());

  lotoPoints$ = this.currentEquipmentService.getlotoPoints();





  lotoPointsWithDefault = computed<Observable<LotoPointDto[]>>(() => {
    return this.lotoPoints$.pipe(
      switchMap(points => {
        if (points && points.length > 0) {
          console.log('loto points in observable: ', points);
          return of(points);
        } else {
          console.log('loto points: ', this.values().lotoPoints);
          return of(this.values().lotoPoints || []);
        }
      })
    );
  });

  lotoPointRowRightClickEvent = output<LotoPointDto>();

  initialSearchCriteria = computed<SearchCriteria>(() => {
    return new SearchCriteriaDto({
      type: 'column',
      filters: { tagNumber: this.values().tagNumber || '' }
    });
  });

  ngOnInit(): void {
    
    this.loadOptions('system', this.systems);
    this.loadOptions('vendor', this.vendors);
    this.loadOptions('location', this.locations);
    this.loadOptions('eqType', this.eqTypes);
  }


//Equipment form
  private createFields(): FormField[] {
    const currentPresetData = this.values();
    const fields: FormField[] = [
      {
        name: 'system',
        label: 'System',
        type: 'select',
        options: this.addDefaultOption(this.systems(), 'Select System'),
        initialValue: currentPresetData.system?.id || '',
        // question: { type: 'text', content: "Select the system"} as Question,
        validators: [Validators.required]
      },
      {
        name: 'location',
        label: 'Location',
        type: 'select',
        options: this.addDefaultOption(this.locations(), 'Select Location'),
        initialValue: currentPresetData.location?.id || '',
        question: { type: 'text', content: "This is general location, if more detailed location description is needed, it can be provided in attached Loto Points"} as Question,
        validators: [Validators.required]
      },
      {
        name: 'vendor',
        label: 'Vendor',
        type: 'select',
        options: this.addDefaultOption(this.vendors(), 'Select Vendor'),
        initialValue: currentPresetData.vendor?.id || '',
        validators: [Validators.required]
      },
      {
        name: 'eqType',
        label: 'Equipment Type',
        type: 'select',
        options: this.addDefaultOption(this.eqTypes(), 'Select Equipment Type'),
        initialValue: currentPresetData.eqType?.id || '',
        validators: [Validators.required]
      },
      {
        name: 'description',
        label: 'Description',
        type: 'text',
        options: [],
        initialValue: currentPresetData.description || null,
        question: { 
          type: 'text', 
          content: `Description conventions:<br>
          • Air Operated Valve - AOV<br>
          • Motor Operated Valve - MOV`
        } as Question,
        validators: [Validators.required]
      },
      {
        name: 'tagNumber',
        label: 'Tag Number',
        type: 'text',
        options: [],
        initialValue: currentPresetData.tagNumber || null,
        validators: [Validators.required]
      },
      {
        name: 'specificLocation',
        label: 'Specific Location',
        type: 'text',
        options: [],
        initialValue: currentPresetData.specificLocation || null
      }
    ];
    return fields;
  }

  private addDefaultOption(options: Option[], defaultLabel: string): Option[] {
    if(options.length>0)return [{ value: '', label: defaultLabel }, ...options];
    return [];
  }

  onFormSubmit(updatedValues: any) {
    const updatedEquipment = new EquipmentDto({ ...this.values(), ...updatedValues });
    this.valuesChange.emit(updatedEquipment);
    this.formSubmit.emit(updatedEquipment);
  }
  
  onFormDelete() {
    this.formDelete.emit();
  }

  private loadOptions(category: string, optionsSignal: ReturnType<typeof signal<Option[]>>) {
    this.currentValueService.getOptionsByCategory(category).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(options => {
      optionsSignal.set(options);
      this.checkFormReady();
    });
  }

  private checkFormReady() {
    if (this.eqTypes().length > 0 && 
        this.systems().length > 0 && 
        this.locations().length > 0 && 
        this.vendors().length > 0) {
      this.isFormReady.set(true);
    }
  }

  onExistingLotoPointDoubleClick(lotoPoint: LotoPointDto) {
    if (!lotoPoint || !lotoPoint.id) {
      console.error('Invalid LOTO point');
      return;
    }
  
    const currentEquipment = this.values();
    if (!currentEquipment || !currentEquipment.id) {
      console.error('No current equipment selected');
      return;
    }
  
    const updatedEquipment = new EquipmentDto({
      ...currentEquipment,
      lotoPoints: currentEquipment.lotoPoints?.filter(lp => lp.id !== lotoPoint.id)
    });
  
    this.equipmentService.updateEquipment(updatedEquipment).pipe(
      tap(resp => {
        if (resp && resp.responseData) {
          const updatedEquipmentDto = new EquipmentDto(resp.responseData);
          this.currentEquipmentService.setCurrentEquipment(updatedEquipmentDto);
          this.valuesChange.emit(updatedEquipmentDto);
        } else {
          throw new Error('Invalid response from server');
        }
      }),
      catchError(error => {
        console.error('Error updating equipment:', error);
        // Optionally, you can emit an error event or show a user-friendly error message
        return of(null);
      })
    ).subscribe();
  }

  onSearchedLotoPointDoubleClick(lotoPoint: LotoPointDto) {
    if (!lotoPoint || !lotoPoint.id) {
      console.error('Invalid LOTO point');
      return;
    }
  
    const currentEquipment = this.values();
    if (!currentEquipment) {
      console.error('No current equipment selected');
      return;
    }
  
    // Check if the LOTO point is already in the equipment's list
    if (currentEquipment.lotoPoints?.some(lp => lp.id === lotoPoint.id)) {
      console.warn('LOTO point already exists in the equipment');
      return;
    }
  
    const updatedEquipment = new EquipmentDto({
      ...currentEquipment,
      lotoPoints: [...currentEquipment.lotoPoints? currentEquipment.lotoPoints : [], lotoPoint]
    });

    if(!updatedEquipment.id || updatedEquipment.id === 0) {
      // this.confirmationService.confirm('The current equipment is not saved. Do you want to save it first?')
      //   .then((result) => {
      //     if (result) {
      //       // User clicked "OK", save the equipment first
      //       this.createNewEqAndAddLotoPointEvent.emit(updatedEquipment);
      //     } else {
      //       // User clicked "Cancel", do nothing or show a message
      //       console.log('Operation cancelled by user');
      //     }
      //   });
      this.createNewEqAndAddLotoPointEvent.emit(updatedEquipment);
      return;
    }
  
    this.equipmentService.updateEquipment(updatedEquipment).pipe(
      tap(resp => {
        if (resp && resp.responseData) {
          const updatedEquipmentDto = new EquipmentDto(resp.responseData);
          const shape = updatedEquipmentDto.toShapeObject();
          this.currentEquipmentService.addShapeToAllShapes(shape!);
          this.currentEquipmentService.setCurrentShape(shape!);
          // this.currentEquipmentService.setCurrentEquipment(updatedEquipmentDto);
          this.valuesChange.emit(updatedEquipmentDto);
        } else {
          throw new Error('Invalid response from server');
        }
      }),
      catchError(error => {
        console.error('Error updating equipment:', error);
        // Optionally, you can emit an error event or show a user-friendly error message
        return of(null);
      })
    ).subscribe();
  }

  onLotoPointRowRightClick(lotoPoint: LotoPointDto) {
    this.lotoPointRowRightClickEvent.emit(lotoPoint);
  }

  onAddNewLotoPoint(){
    this.addNewLotoPointEvent.emit(this.values().id);
  }




}
