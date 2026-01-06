import {
  Component,
  computed,
  DestroyRef,
  effect,
  EventEmitter,
  inject,
  input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { RfLotoPointApiService } from '../services/rf-loto-point-api.service';
import { LotoPointMapperService } from '../services/rf-loto-point-mapper.service';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { GlobalMessageService } from '../../../../shared/global-message/global-message.service';

/** Response structure from counterpart API */
interface CounterpartResponse {
  counterpart: LotoPointDto;
  isNew: boolean;
  sourceUnit: string;
  targetUnit: string;
}

/** Fields that can be synced between units */
type SyncableField = 'tagNumber' | 'description' | 'specificLocation' | 'isoPos' | 'normPos' | 'zeroEnergy' | 'eqType' | 'location';

@Component({
  selector: 'app-loto-point-dual-form',
  standalone: true,
  imports: [CommonModule, RfReactiveFormComponent],
  templateUrl: './loto-point-dual-form.component.html',
  styleUrl: './loto-point-dual-form.component.css',
})
export class LotoPointDualFormComponent {
  private apiService = inject(RfLotoPointApiService);
  private mapperService = inject(LotoPointMapperService);
  private messageService = inject(GlobalMessageService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  primaryLotoPoint = input.required<LotoPointDto>();
  fieldsToDisplay = input<(keyof LotoPointDto)[]>([
    'tagNumber',
    'description',
    'specificLocation',
    'eqType',
    'isoPos',
    'normPos',
    'location',
    'zeroEnergy',
  ]);

  // Outputs
  @Output() primarySaved = new EventEmitter<LotoPointDto>();
  @Output() counterpartSaved = new EventEmitter<LotoPointDto>();
  @Output() bothSaved = new EventEmitter<{ primary: LotoPointDto; counterpart: LotoPointDto }>();
  @Output() formClosed = new EventEmitter<void>();

  // State
  counterpartLotoPoint = signal<LotoPointDto | null>(null);
  isCounterpartNew = signal<boolean>(false);
  sourceUnit = signal<string>('01');
  targetUnit = signal<string>('02');
  isLoading = signal<boolean>(false);
  isSavingPrimary = signal<boolean>(false);
  isSavingCounterpart = signal<boolean>(false);
  isSavingBoth = signal<boolean>(false);

  // Track form values for syncing
  currentPrimaryValues = signal<LotoPointDto | null>(null);
  currentCounterpartValues = signal<LotoPointDto | null>(null);

  // Track which fields are different between forms
  differentFields = signal<Set<string>>(new Set());

  // Computed: Check if primary tag starts with 01 or 02
  isUnitSpecific = computed(() => {
    const tag = this.primaryLotoPoint()?.tagNumber;
    return tag?.startsWith('01') || tag?.startsWith('02');
  });

  // Computed: Form fields for primary
  primaryFields = computed(() => {
    const entity = this.currentPrimaryValues() || this.primaryLotoPoint();
    return this.mapperService.toFormFields(entity, this.fieldsToDisplay());
  });

  // Computed: Form fields for counterpart
  counterpartFields = computed(() => {
    const entity = this.currentCounterpartValues() || this.counterpartLotoPoint();
    if (!entity) return [];
    return this.mapperService.toFormFields(entity, this.fieldsToDisplay());
  });

  // List of syncable fields (excluding equipment associations)
  private syncableFields: SyncableField[] = [
    'tagNumber',
    'description',
    'specificLocation',
    'isoPos',
    'normPos',
    'zeroEnergy',
    'eqType',
    'location',
  ];

  constructor() {
    // Load counterpart when primary changes
    effect(() => {
      const primary = this.primaryLotoPoint();
      if (primary?.id && this.isUnitSpecific()) {
        this.loadCounterpart(primary.id);
      }
    });
  }

  /**
   * Load counterpart data from API
   */
  private loadCounterpart(primaryId: number): void {
    this.isLoading.set(true);

    this.apiService
      .getUnitCounterpart(primaryId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData) {
            const data = response.responseData;
            const counterpart = LotoPointDto.fromJson(data.counterpart);
            this.counterpartLotoPoint.set(counterpart);
            this.currentCounterpartValues.set(counterpart);
            this.isCounterpartNew.set(data.isNew);
            this.sourceUnit.set(data.sourceUnit);
            this.targetUnit.set(data.targetUnit);
            this.updateDifferentFields();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading counterpart:', error);
          this.messageService.showError('Failed to load unit counterpart');
          this.isLoading.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Handle primary form value changes
   */
  onPrimaryValueChange(values: LotoPointDto): void {
    this.currentPrimaryValues.set(values);
    this.updateDifferentFields();
  }

  /**
   * Handle counterpart form value changes
   */
  onCounterpartValueChange(values: LotoPointDto): void {
    this.currentCounterpartValues.set(values);
    this.updateDifferentFields();
  }

  /**
   * Update the set of fields that differ between forms
   */
  private updateDifferentFields(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();

    if (!primary || !counterpart) return;

    const different = new Set<string>();

    for (const field of this.syncableFields) {
      if (field === 'tagNumber') {
        // Skip tag number comparison since it will always differ
        continue;
      }

      const primaryValue = this.getFieldValue(primary, field);
      const counterpartValue = this.getFieldValue(counterpart, field);

      if (!this.areValuesEqual(primaryValue, counterpartValue)) {
        different.add(field);
      }
    }

    this.differentFields.set(different);
  }

  /**
   * Get field value for comparison
   */
  private getFieldValue(entity: LotoPointDto, field: string): any {
    const value = (entity as any)[field];
    if (value?.id !== undefined) {
      return value.id;
    }
    return value;
  }

  /**
   * Compare two values for equality
   */
  private areValuesEqual(val1: any, val2: any): boolean {
    if (val1 === val2) return true;
    if (val1 == null && val2 == null) return true;
    if (val1 == null || val2 == null) return false;

    // Compare by JSON for objects
    if (typeof val1 === 'object' && typeof val2 === 'object') {
      return JSON.stringify(val1) === JSON.stringify(val2);
    }

    return false;
  }

  /**
   * Check if a field is different between forms
   */
  isFieldDifferent(field: string): boolean {
    return this.differentFields().has(field);
  }

  /**
   * Sync a single field from primary to counterpart
   */
  syncFieldToCounterpart(field: SyncableField): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();

    if (!primary || !counterpart) return;

    const updatedCounterpart = new LotoPointDto({
      ...counterpart,
      [field]: this.transformFieldValue(primary, field, this.sourceUnit(), this.targetUnit()),
    });

    this.currentCounterpartValues.set(updatedCounterpart);
    this.counterpartLotoPoint.set(updatedCounterpart);
    this.updateDifferentFields();
  }

  /**
   * Sync a single field from counterpart to primary
   */
  syncFieldToPrimary(field: SyncableField): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();

    if (!primary || !counterpart) return;

    const updatedPrimary = new LotoPointDto({
      ...primary,
      [field]: this.transformFieldValue(counterpart, field, this.targetUnit(), this.sourceUnit()),
    });

    this.currentPrimaryValues.set(updatedPrimary);
    this.updateDifferentFields();
  }

  /**
   * Sync all fields from primary to counterpart
   */
  syncAllToCounterpart(): void {
    for (const field of this.syncableFields) {
      if (field !== 'tagNumber') {
        this.syncFieldToCounterpart(field);
      }
    }
    this.messageService.showSuccess(`All fields synced to Unit ${this.targetUnit()}`);
  }

  /**
   * Sync all fields from counterpart to primary
   */
  syncAllToPrimary(): void {
    for (const field of this.syncableFields) {
      if (field !== 'tagNumber') {
        this.syncFieldToPrimary(field);
      }
    }
    this.messageService.showSuccess(`All fields synced to Unit ${this.sourceUnit()}`);
  }

  /**
   * Transform field value for syncing between units
   */
  private transformFieldValue(
    source: LotoPointDto,
    field: SyncableField,
    fromUnit: string,
    toUnit: string
  ): any {
    const value = (source as any)[field];

    if (field === 'tagNumber') {
      // Transform tag number prefix
      if (typeof value === 'string' && value.startsWith(fromUnit)) {
        return toUnit + value.substring(fromUnit.length);
      }
      return value;
    }

    if (field === 'description' || field === 'specificLocation') {
      // Transform unit references in text
      return this.transformUnitText(value, fromUnit, toUnit);
    }

    // For other fields, copy as-is
    return value;
  }

  /**
   * Transform unit references in text (01<->02, Unit1<->Unit2, etc.)
   */
  private transformUnitText(text: string | null | undefined, fromUnit: string, toUnit: string): string {
    if (!text) return '';

    let result = text;

    // Transform common patterns
    const fromNum = fromUnit.replace(/^0/, '');
    const toNum = toUnit.replace(/^0/, '');

    // Unit 01 <-> Unit 02
    result = result.replace(new RegExp(`Unit ${fromUnit}`, 'gi'), `Unit ${toUnit}`);
    result = result.replace(new RegExp(`Unit${fromNum}`, 'gi'), `Unit${toNum}`);
    result = result.replace(new RegExp(`U${fromNum}`, 'gi'), `U${toNum}`);
    result = result.replace(new RegExp(`#${fromNum}`, 'gi'), `#${toNum}`);

    // Standalone unit prefixes at word boundaries
    result = result.replace(new RegExp(`\\b${fromUnit}\\b`, 'g'), toUnit);

    return result;
  }

  /**
   * Save primary LOTO point
   */
  savePrimary(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    if (!primary) return;

    this.isSavingPrimary.set(true);

    this.apiService
      .saveLotoPoint(primary)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData) {
            const saved = LotoPointDto.fromJson(response.responseData);
            this.currentPrimaryValues.set(saved);
            this.primarySaved.emit(saved);
            this.messageService.showSuccess(`Unit ${this.sourceUnit()} LOTO point saved`);
          }
          this.isSavingPrimary.set(false);
        }),
        catchError((error) => {
          console.error('Error saving primary:', error);
          this.messageService.showError('Failed to save primary LOTO point');
          this.isSavingPrimary.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Save counterpart LOTO point
   */
  saveCounterpart(): void {
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();
    if (!counterpart) return;

    this.isSavingCounterpart.set(true);

    this.apiService
      .saveLotoPoint(counterpart)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData) {
            const saved = LotoPointDto.fromJson(response.responseData);
            this.counterpartLotoPoint.set(saved);
            this.currentCounterpartValues.set(saved);
            this.isCounterpartNew.set(false);
            this.counterpartSaved.emit(saved);
            this.messageService.showSuccess(`Unit ${this.targetUnit()} LOTO point saved`);
          }
          this.isSavingCounterpart.set(false);
        }),
        catchError((error) => {
          console.error('Error saving counterpart:', error);
          this.messageService.showError('Failed to save counterpart LOTO point');
          this.isSavingCounterpart.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Save both LOTO points
   */
  saveBoth(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();

    if (!primary || !counterpart) return;

    this.isSavingBoth.set(true);

    // Save primary first
    this.apiService
      .saveLotoPoint(primary)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((primaryResponse) => {
          if (primaryResponse.responseData) {
            const savedPrimary = LotoPointDto.fromJson(primaryResponse.responseData);
            this.currentPrimaryValues.set(savedPrimary);

            // Then save counterpart
            this.apiService
              .saveLotoPoint(counterpart)
              .pipe(
                takeUntilDestroyed(this.destroyRef),
                tap((counterpartResponse) => {
                  if (counterpartResponse.responseData) {
                    const savedCounterpart = LotoPointDto.fromJson(counterpartResponse.responseData);
                    this.counterpartLotoPoint.set(savedCounterpart);
                    this.currentCounterpartValues.set(savedCounterpart);
                    this.isCounterpartNew.set(false);
                    this.bothSaved.emit({ primary: savedPrimary, counterpart: savedCounterpart });
                    this.messageService.showSuccess('Both LOTO points saved successfully');
                  }
                  this.isSavingBoth.set(false);
                }),
                catchError((error) => {
                  console.error('Error saving counterpart:', error);
                  this.messageService.showError('Primary saved but failed to save counterpart');
                  this.isSavingBoth.set(false);
                  return of(null);
                })
              )
              .subscribe();
          }
        }),
        catchError((error) => {
          console.error('Error saving primary:', error);
          this.messageService.showError('Failed to save primary LOTO point');
          this.isSavingBoth.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Close the form
   */
  close(): void {
    this.formClosed.emit();
  }
}
