import { Component, Input, OnInit, DestroyRef, input, output, computed, signal} from '@angular/core';
import { DetailsFormComponent } from '../../../shared/details-form/details-form.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable} from 'rxjs';
import { Option } from '../../../models/option.model';
import { Validators } from '@angular/forms';
import { ImageCarouselComponent } from "../../../shared/image/image-carusel/image-carousel.component";
import { CommonModule  } from '@angular/common';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { NonNullablePipe } from "../../../pipes/nonNullable.pipe";
import { ReactiveFormComponent } from "../../../shared/reactive-form/reactive-form.component";
import { CurrentValueService } from '../../../services/current-value.service';

@Component({
  selector: 'app-loto-point-detail-form',
  standalone: true,
  imports: [DetailsFormComponent, ImageCarouselComponent, CommonModule, NonNullablePipe, ReactiveFormComponent],
  templateUrl: './loto-point-detail-form.component.html',
  styleUrl: './loto-point-detail-form.component.css'
})
export class LotoPointDetailFormComponent implements OnInit {
  values = input<any>({});
  openImage = output<void>();
  formSubmit = output<any>();
  formDelete = output<void>();
  @Input() imageUrls$: Observable<string[]> = new Observable<string[]>();
  private _selectedItem: LotoPointDto | null = null;
  
  @Input() set selectedItem(value: LotoPointDto | null) {
    this._selectedItem = value;
    if (value) {
      this.initializeFilters();
    } else {
      this.equipmentFilter$.next([]);  // Emit an empty array when there's no selected item
    }
  }
  
  get selectedItem(): LotoPointDto | null {
    return this._selectedItem;
  }


  private isoPosOptions = signal<Option[]>([]);
  private normPosOptions = signal<Option[]>([]);
  equipmentFilter$ = new BehaviorSubject<{ key: string; filterFn: (value: any) => boolean }[]>([]);

  fields = computed(() => [
      { name: 'tagNumber', label: 'Tag Number', type: 'text', validators: [Validators.required] },
      { name: 'description', label: 'Description', type: 'text', validators: [Validators.required] },
      { name: 'unit', label: 'Unit', type: 'text' },
      { name: 'tagged', label: 'Tagged', type: 'text' },
      { name: 'isoPos', label: 'Isolated Position', type: 'select', options: this.isoPosOptions },
      { name: 'normPos', label: 'Normal Position', type: 'select', options: this.normPosOptions },
      { name: 'specificLocation', label: 'Specific Location', type: 'text' },
      { name: 'standard', label: 'Standard', type: 'text' },
      { name: 'generalLocation', label: 'General Location', type: 'text' },
      // { name: 'equipmentList', label: 'Equipment', type: 'multi-select', options: this.equipmentOptions },
    ]);
    
    isFormReady = signal<boolean>(false);;

  constructor(
      private currentValueService: CurrentValueService,
    private destroyRef: DestroyRef
  ) {}
  
  ngOnInit() {
    this.loadOptions('isoPos', this.isoPosOptions);
    this.loadOptions('normPos', this.normPosOptions);
    this.initializeFilters();
  }

  private loadOptions(category: string, optionsSignal: ReturnType<typeof signal<Option[]>>) {
    this.currentValueService.getOptionsByCategory(category).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(options => {
      optionsSignal.set(options);
      this.checkFormReady();
    });
  }
  
  // private loadOptions(category: string, optionsSignal: ReturnType<typeof signal<Option[]>>) {
  //   this.currentValueService.getOptionsByCategory(category).pipe(
  //     takeUntilDestroyed(this.destroyRef)
  //   ).subscribe(options => {
  //     optionsSignal.set(options);
  //     this.checkFormReady();
  //   });
  // }

    private checkFormReady() {
    if (this.isoPosOptions().length > 0 && 
        this.normPosOptions().length > 0) {
      this.isFormReady.set(true);
    }
  }


  private initializeFilters() {
    const newFilter = [
      {
        key: 'lotoPoints',
        filterFn: (value: LotoPointDto[]) => {
          return value.some(lotoPoint => lotoPoint.id === this._selectedItem?.id);
        }
      }
    ];
    this.equipmentFilter$.next(newFilter);
  }

  onFormSubmit(formData: any) {
    this.formSubmit.emit(formData);
  }

  onFormDelete() {
    this.formDelete.emit();
  }

  onOpenImage() {
    this.openImage.emit();
  }
}