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
  isLinked: boolean;
  sourceUnit: string;
  targetUnit: string;
}

/** Counterpart status for UI display */
type CounterpartStatus = 'linked' | 'found' | 'suggested' | 'not-found';

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
  isCounterpartLinked = signal<boolean>(false);
  counterpartStatus = signal<CounterpartStatus>('not-found');
  sourceUnit = signal<string>('01');
  targetUnit = signal<string>('02');
  isLoading = signal<boolean>(false);
  isSavingPrimary = signal<boolean>(false);
  isSavingCounterpart = signal<boolean>(false);
  isSavingBoth = signal<boolean>(false);
  isLinking = signal<boolean>(false);

  // For manual search mode
  showManualSearch = signal<boolean>(false);

  // Track form values for syncing
  currentPrimaryValues = signal<LotoPointDto | null>(null);
  currentCounterpartValues = signal<LotoPointDto | null>(null);

  // Track which fields are different between forms
  differentFields = signal<Set<string>>(new Set());

  // Computed: Check if primary tag or unit starts with 01 or 02
  isUnitSpecific = computed(() => {
    const primary = this.primaryLotoPoint();
    const tag = primary?.tagNumber;
    const unit = primary?.unit;
    return tag?.startsWith('01') || tag?.startsWith('02') ||
           unit?.startsWith('01') || unit?.startsWith('02');
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
      if (!this.isUnitSpecific()) {
        // Not unit-specific, nothing to load
        return;
      }

      if (primary?.id) {
        // Existing item: load counterpart by ID
        this.loadCounterpart(primary.id);
      } else if (primary?.tagNumber) {
        // New item: try to find counterpart by tag number
        this.loadCounterpartByTagNumber(primary.tagNumber);
      } else if (primary?.unit) {
        // New item with only unit field set - use unit as the tag prefix
        // This happens when user types in unit field first
        this.loadCounterpartByTagNumber(primary.unit);
      }
    }, { allowSignalWrites: true });
  }

  /**
   * Load counterpart data from API
   */
  private loadCounterpart(primaryId: number): void {
    this.isLoading.set(true);
    this.showManualSearch.set(false);

    this.apiService
      .getUnitCounterpart(primaryId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData) {
            const data = response.responseData as any;
            const counterpart = LotoPointDto.fromJson(data.counterpart);
            this.counterpartLotoPoint.set(counterpart);
            this.currentCounterpartValues.set(counterpart);
            this.isCounterpartNew.set(data.isNew);
            this.isCounterpartLinked.set(data.isLinked ?? false);
            this.sourceUnit.set(data.sourceUnit);
            this.targetUnit.set(data.targetUnit);

            // Set status based on response
            if (data.isLinked) {
              this.counterpartStatus.set('linked');
            } else if (!data.isNew) {
              this.counterpartStatus.set('found');
            } else {
              this.counterpartStatus.set('suggested');
            }

            this.updateDifferentFields();
          } else {
            // No counterpart data returned
            this.counterpartStatus.set('not-found');
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading counterpart:', error);
          this.messageService.showError('Failed to load unit counterpart');
          this.counterpartStatus.set('not-found');
          this.isLoading.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Load counterpart by tag number (for new items)
   */
  loadCounterpartByTagNumber(tagNumber: string): void {
    if (!tagNumber || (!tagNumber.startsWith('01') && !tagNumber.startsWith('02'))) {
      this.counterpartStatus.set('not-found');
      return;
    }

    this.isLoading.set(true);

    this.apiService
      .getCounterpartByTagNumber(tagNumber)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData) {
            const data = response.responseData;
            const counterpart = LotoPointDto.fromJson(data.counterpart);
            this.counterpartLotoPoint.set(counterpart);
            this.currentCounterpartValues.set(counterpart);
            this.isCounterpartNew.set(data.isNew);
            this.isCounterpartLinked.set(false); // New items are never linked yet
            this.sourceUnit.set(data.sourceUnit);
            this.targetUnit.set(data.targetUnit);

            this.counterpartStatus.set(data.isNew ? 'suggested' : 'found');
            this.updateDifferentFields();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading counterpart by tag:', error);
          this.counterpartStatus.set('not-found');
          this.isLoading.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Set counterpart manually (from external selection like a table)
   */
  setCounterpartManually(lotoPoint: LotoPointDto): void {
    this.counterpartLotoPoint.set(lotoPoint);
    this.currentCounterpartValues.set(lotoPoint);
    this.isCounterpartNew.set(false);
    this.isCounterpartLinked.set(false);
    this.counterpartStatus.set('found');
    this.showManualSearch.set(false);
    this.updateDifferentFields();
  }

  /**
   * Create a new counterpart (empty form)
   */
  createNewCounterpart(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    if (!primary?.tagNumber) return;

    const fromUnit = primary.tagNumber.startsWith('01') ? '01' : '02';
    const toUnit = fromUnit === '01' ? '02' : '01';

    // Create new counterpart with transformed tag number
    const newCounterpart = new LotoPointDto({
      tagNumber: toUnit + primary.tagNumber.substring(2),
      description: this.transformUnitText(primary.description, fromUnit, toUnit),
      specificLocation: this.transformUnitText(primary.specificLocation, fromUnit, toUnit),
      isoPos: primary.isoPos,
      normPos: primary.normPos,
      zeroEnergy: primary.zeroEnergy,
      eqType: primary.eqType,
      location: primary.location,
      unit: toUnit === '01' ? 'Unit 1' : 'Unit 2',
    });

    this.counterpartLotoPoint.set(newCounterpart);
    this.currentCounterpartValues.set(newCounterpart);
    this.isCounterpartNew.set(true);
    this.isCounterpartLinked.set(false);
    this.counterpartStatus.set('suggested');
    this.showManualSearch.set(false);
    this.updateDifferentFields();
  }

  /**
   * Show manual search UI
   */
  openManualSearch(): void {
    this.showManualSearch.set(true);
  }

  /**
   * Hide manual search UI
   */
  closeManualSearch(): void {
    this.showManualSearch.set(false);
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
   * Save both LOTO points and link them
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

                    // Link counterparts if not already linked
                    if (!this.isCounterpartLinked() && savedPrimary.id && savedCounterpart.id) {
                      this.linkCounterpartsAfterSave(savedPrimary, savedCounterpart);
                    } else {
                      this.bothSaved.emit({ primary: savedPrimary, counterpart: savedCounterpart });
                      this.messageService.showSuccess('Both LOTO points saved successfully');
                      this.isSavingBoth.set(false);
                    }
                  } else {
                    this.isSavingBoth.set(false);
                  }
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
   * Link counterparts after both are saved
   */
  private linkCounterpartsAfterSave(primary: LotoPointDto, counterpart: LotoPointDto): void {
    if (!primary.id || !counterpart.id) {
      this.bothSaved.emit({ primary, counterpart });
      this.messageService.showSuccess('Both LOTO points saved (linking skipped - missing IDs)');
      this.isSavingBoth.set(false);
      return;
    }

    this.apiService
      .linkCounterparts(primary.id, counterpart.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          // Update local state with counterpartIds
          primary.counterpartId = counterpart.id;
          counterpart.counterpartId = primary.id;
          this.currentPrimaryValues.set(primary);
          this.currentCounterpartValues.set(counterpart);
          this.counterpartLotoPoint.set(counterpart);
          this.isCounterpartLinked.set(true);
          this.counterpartStatus.set('linked');

          this.bothSaved.emit({ primary, counterpart });
          this.messageService.showSuccess('Both LOTO points saved and linked');
          this.isSavingBoth.set(false);
        }),
        catchError((error) => {
          console.error('Error linking counterparts:', error);
          this.bothSaved.emit({ primary, counterpart });
          this.messageService.showWarning('Both saved, but linking failed. You may need to link manually.');
          this.isSavingBoth.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Manually link current primary and counterpart
   */
  linkCounterparts(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();

    if (!primary?.id || !counterpart?.id) {
      this.messageService.showError('Both LOTO points must be saved before linking');
      return;
    }

    this.isLinking.set(true);

    this.apiService
      .linkCounterparts(primary.id, counterpart.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          primary.counterpartId = counterpart.id;
          counterpart.counterpartId = primary.id;
          this.currentPrimaryValues.set(primary);
          this.currentCounterpartValues.set(counterpart);
          this.counterpartLotoPoint.set(counterpart);
          this.isCounterpartLinked.set(true);
          this.counterpartStatus.set('linked');
          this.messageService.showSuccess('LOTO points linked successfully');
          this.isLinking.set(false);
        }),
        catchError((error) => {
          console.error('Error linking counterparts:', error);
          this.messageService.showError('Failed to link counterparts');
          this.isLinking.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Unlink current counterpart
   */
  unlinkCounterpart(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();

    if (!primary?.id) {
      this.messageService.showError('Primary LOTO point must be saved');
      return;
    }

    this.isLinking.set(true);

    this.apiService
      .unlinkCounterpart(primary.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          primary.counterpartId = null;
          const counterpart = this.counterpartLotoPoint();
          if (counterpart) {
            counterpart.counterpartId = null;
            this.counterpartLotoPoint.set(counterpart);
            this.currentCounterpartValues.set(counterpart);
          }
          this.currentPrimaryValues.set(primary);
          this.isCounterpartLinked.set(false);
          this.counterpartStatus.set('found');
          this.messageService.showSuccess('Counterpart unlinked');
          this.isLinking.set(false);
        }),
        catchError((error) => {
          console.error('Error unlinking counterpart:', error);
          this.messageService.showError('Failed to unlink counterpart');
          this.isLinking.set(false);
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
