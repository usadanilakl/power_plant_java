import { inject, Injectable, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, tap, forkJoin, switchMap, Observable } from 'rxjs';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { ZeroEnergyDto } from '../../../../models/loto/zero-energy.model';
import { RfLotoPointApiService } from './rf-loto-point-api.service';
import { GlobalMessageService } from '../../../../shared/global-message/global-message.service';

/** Counterpart status for UI display */
export type CounterpartStatus = 'linked' | 'found' | 'suggested' | 'not-found';

/** Fields that can be synced between units */
export type SyncableField = keyof Pick<LotoPointDto,
  'tagNumber' | 'description' | 'specificLocation' | 'isoPos' | 'normPos' | 'zeroEnergy' | 'eqType' | 'location'
>;

/** List of all syncable fields */
export const SYNCABLE_FIELDS: SyncableField[] = [
  'tagNumber',
  'description',
  'specificLocation',
  'isoPos',
  'normPos',
  'zeroEnergy',
  'eqType',
  'location',
];

/** Short labels for syncable fields (for UI display) */
export const FIELD_LABELS: Record<SyncableField, string> = {
  tagNumber: 'Tag',
  description: 'Desc',
  specificLocation: 'Loc',
  isoPos: 'Iso',
  normPos: 'Norm',
  eqType: 'Type',
  location: 'Area',
  zeroEnergy: 'Zero',
};

/**
 * Service for managing LOTO point counterpart operations.
 * Handles unit-specific (U1/U2) LOTO point pairing, field synchronization,
 * and text transformations between counterpart units.
 *
 * This service is designed to be injectable and reusable across:
 * - LotoPointDualFormComponent
 * - LotoBuilderFormPopupComponent
 * - CounterpartSelectionDialogComponent
 * - RfLotoPointPageComponent (future)
 */
@Injectable({
  providedIn: 'root',
})
export class LotoPointCounterpartService {
  private apiService = inject(RfLotoPointApiService);
  private messageService = inject(GlobalMessageService);

  // ========== Unit Detection ==========

  /**
   * Check if a LOTO point is unit-specific (tag starts with 01 or 02)
   */
  isUnitSpecific(lotoPoint: LotoPointDto | null): boolean {
    if (!lotoPoint) return false;
    return this.isUnitValue(lotoPoint.tagNumber) || this.isUnitValue(lotoPoint.unit);
  }

  /**
   * Check if a value indicates unit-specific (starts with 01 or 02)
   */
  isUnitValue(val: string | null | undefined): boolean {
    if (!val) return false;
    return val.startsWith('01') || val.startsWith('02');
  }

  /**
   * Get the source unit from a LOTO point (01 or 02)
   */
  getSourceUnit(lotoPoint: LotoPointDto | null): string {
    if (!lotoPoint) return '01';

    const tagNumber = lotoPoint.tagNumber || '';
    const unit = lotoPoint.unit || '';

    if (tagNumber.startsWith('01') || unit.startsWith('01')) {
      return '01';
    }
    if (tagNumber.startsWith('02') || unit.startsWith('02')) {
      return '02';
    }
    return '01'; // Default to 01
  }

  /**
   * Get the target unit (opposite of source)
   */
  getTargetUnit(sourceUnit: string): string {
    return sourceUnit === '01' ? '02' : '01';
  }

  // ========== Text Transformation ==========

  /**
   * Convert a tag number to its counterpart (01 <-> 02)
   */
  convertTagToCounterpart(tagNumber: string | null | undefined): string {
    if (!tagNumber) return '';

    if (tagNumber.startsWith('01')) {
      return '02' + tagNumber.substring(2);
    }
    if (tagNumber.startsWith('02')) {
      return '01' + tagNumber.substring(2);
    }
    return tagNumber;
  }

  /**
   * Transform unit references in text (01<->02, Unit1<->Unit2, etc.)
   * Handles: U1, U 1, Unit1, Unit 1, u1, u 1, unit1, unit 1, UNIT1, UNIT 1, #1, #2
   */
  transformUnitText(text: string | null | undefined, fromUnit: string, toUnit: string): string {
    if (!text) return '';

    let result = text;

    // Get numeric versions (1 or 2) from unit strings (01 or 02)
    const fromNum = fromUnit.replace(/^0/, '');
    const toNum = toUnit.replace(/^0/, '');

    // Replace patterns in order of specificity (longer patterns first to avoid partial replacements)

    // Pattern: "Unit 1" or "Unit 2" (with space)
    result = result.replace(new RegExp(`(Unit\\s+)${fromNum}\\b`, 'gi'), `$1${toNum}`);

    // Pattern: "Unit1" or "Unit2" (no space)
    result = result.replace(new RegExp(`(Unit)${fromNum}\\b`, 'gi'), `$1${toNum}`);

    // Pattern: "U 1" or "U 2" (with space)
    result = result.replace(new RegExp(`(U\\s+)${fromNum}\\b`, 'gi'), `$1${toNum}`);

    // Pattern: "U1" or "U2" (no space)
    result = result.replace(new RegExp(`\\bU${fromNum}\\b`, 'gi'), `U${toNum}`);

    // Pattern: "#1" or "#2"
    result = result.replace(new RegExp(`#${fromNum}\\b`, 'g'), `#${toNum}`);

    // Pattern: Standalone "01" or "02" at word boundaries (for tag-like references)
    result = result.replace(new RegExp(`\\b${fromUnit}\\b`, 'g'), toUnit);

    return result;
  }

  // ========== Field Transformation ==========

  /**
   * Transform a single field value for syncing between units
   * Transfer rules:
   * 1. tagNumber: swap 01<->02 prefix
   * 2. description, specificLocation: transform unit text patterns
   * 3. isoPos, normPos, eqType, location: copy as-is (value-select fields)
   * 4. zeroEnergy: handled separately with async equipment lookup
   */
  transformFieldValue(
    source: LotoPointDto,
    field: SyncableField,
    fromUnit: string,
    toUnit: string
  ): any {
    const value = (source as any)[field];

    // 1. Transform tag number prefix (01<->02)
    if (field === 'tagNumber') {
      if (typeof value === 'string' && value.startsWith(fromUnit)) {
        return toUnit + value.substring(fromUnit.length);
      }
      return value;
    }

    // 2. Transform text fields with unit patterns
    if (field === 'description' || field === 'specificLocation') {
      return this.transformUnitText(value, fromUnit, toUnit);
    }

    // 3. Value-select fields - copy as-is
    if (field === 'isoPos' || field === 'normPos' || field === 'eqType' || field === 'location') {
      return value;
    }

    // 4. ZeroEnergy - needs async handling, return as-is for now
    if (field === 'zeroEnergy') {
      return value;
    }

    // For other fields, copy as-is
    return value;
  }

  /**
   * Sync a field from source to target LOTO point (excluding zeroEnergy)
   * Returns the updated target
   */
  syncField(
    source: LotoPointDto,
    target: LotoPointDto,
    field: SyncableField,
    fromUnit: string,
    toUnit: string
  ): LotoPointDto {
    if (field === 'zeroEnergy') {
      // ZeroEnergy requires async handling - use syncZeroEnergy instead
      console.warn('Use syncZeroEnergy for zeroEnergy field sync');
      return target;
    }

    const transformedValue = this.transformFieldValue(source, field, fromUnit, toUnit);

    return new LotoPointDto({
      ...target,
      [field]: transformedValue,
    });
  }

  /**
   * Sync all fields (except zeroEnergy) from source to target
   * Returns the updated target
   */
  syncAllFields(
    source: LotoPointDto,
    target: LotoPointDto,
    fromUnit: string,
    toUnit: string,
    excludeTagNumber: boolean = true
  ): LotoPointDto {
    let updated = { ...target };

    for (const field of SYNCABLE_FIELDS) {
      // Skip tagNumber if requested (usually we don't want to change tags)
      if (excludeTagNumber && field === 'tagNumber') continue;
      // Skip zeroEnergy - needs async handling
      if (field === 'zeroEnergy') continue;

      const transformedValue = this.transformFieldValue(source, field, fromUnit, toUnit);
      (updated as any)[field] = transformedValue;
    }

    return new LotoPointDto(updated);
  }

  // ========== ZeroEnergy Sync (Async) ==========

  /**
   * Sync zeroEnergy field from source to target with API lookup for equipment IDs
   * Returns an Observable of the updated target
   */
  syncZeroEnergy(
    source: LotoPointDto,
    target: LotoPointDto,
    sourceUnit: string,
    destroyRef: DestroyRef
  ): Observable<LotoPointDto> {
    const sourceZeroEnergy = source.zeroEnergy;

    if (!sourceZeroEnergy) {
      // No zeroEnergy to sync - clear it on target
      return of(new LotoPointDto({
        ...target,
        zeroEnergy: null,
      }));
    }

    const sourceEquipmentIds = sourceZeroEnergy.templateEquipmentIds || [];

    if (sourceEquipmentIds.length === 0) {
      // No equipment IDs to lookup - just copy template and method
      const counterpartZeroEnergy = new ZeroEnergyDto({
        zeroEnergyTemplate: sourceZeroEnergy.zeroEnergyTemplate,
        method: sourceZeroEnergy.method,
        templateEquipment: [],
        templateEquipmentIds: [],
      });

      return of(new LotoPointDto({
        ...target,
        zeroEnergy: counterpartZeroEnergy,
      }));
    }

    // Call API to lookup counterpart equipment
    return this.apiService.lookupCounterpartEquipment(sourceEquipmentIds, sourceUnit).pipe(
      takeUntilDestroyed(destroyRef),
      switchMap((response) => {
        const counterpartEquipment = response.responseData || [];
        const counterpartEquipmentIds = counterpartEquipment.map(eq => eq.id);

        const counterpartZeroEnergy = new ZeroEnergyDto({
          zeroEnergyTemplate: sourceZeroEnergy.zeroEnergyTemplate,
          method: sourceZeroEnergy.method,
          templateEquipment: counterpartEquipment,
          templateEquipmentIds: counterpartEquipmentIds,
        });

        return of(new LotoPointDto({
          ...target,
          zeroEnergy: counterpartZeroEnergy,
        }));
      }),
      catchError((error) => {
        console.error('Error looking up counterpart equipment:', error);

        // Fallback: copy template without equipment
        const counterpartZeroEnergy = new ZeroEnergyDto({
          zeroEnergyTemplate: sourceZeroEnergy.zeroEnergyTemplate,
          method: sourceZeroEnergy.method,
          templateEquipment: [],
          templateEquipmentIds: [],
        });

        return of(new LotoPointDto({
          ...target,
          zeroEnergy: counterpartZeroEnergy,
        }));
      })
    );
  }

  // ========== Counterpart Generation ==========

  /**
   * Generate a new counterpart LOTO point based on primary
   * Transfer rules:
   * 1. tagNumber: swap 01<->02 prefix
   * 2. unit, description, specificLocation: transform unit text patterns
   * 3. isoPos, normPos, eqType, location: copy as-is (value-select fields)
   * 4. zeroEnergy: keep template, will lookup equipment via API
   * 5. equipmentList: starts empty (to be set manually)
   *
   * Note: For async zeroEnergy equipment lookup, use generateCounterpartWithZeroEnergy
   */
  generateCounterpart(
    primary: LotoPointDto,
    targetUnit?: string
  ): LotoPointDto {
    const sourceUnit = this.getSourceUnit(primary);
    const target = targetUnit || this.getTargetUnit(sourceUnit);

    // 1. Transform tag number (swap 01<->02 prefix)
    const counterpartTag = this.convertTagToCounterpart(primary.tagNumber);

    // 2. Transform text fields with unit patterns
    const counterpartDescription = this.transformUnitText(primary.description, sourceUnit, target);
    const counterpartSpecificLocation = this.transformUnitText(primary.specificLocation, sourceUnit, target);

    // 4. ZeroEnergy without equipment lookup (sync version)
    let counterpartZeroEnergy: ZeroEnergyDto | null = null;
    if (primary.zeroEnergy) {
      counterpartZeroEnergy = new ZeroEnergyDto({
        zeroEnergyTemplate: primary.zeroEnergy.zeroEnergyTemplate,
        method: primary.zeroEnergy.method,
        templateEquipment: [],
        templateEquipmentIds: [],
      });
    }

    return new LotoPointDto({
      ...primary,
      id: undefined, // New item
      // 1. Transformed tag number
      tagNumber: counterpartTag,
      // 2. Transformed text fields
      unit: target,
      description: counterpartDescription,
      specificLocation: counterpartSpecificLocation,
      // 3. Value-select fields copied as-is (already spread from primary)
      // Set counterpart link
      counterpartId: primary.id || undefined,
      // 4. Transfer zeroEnergy template (without equipment)
      zeroEnergy: counterpartZeroEnergy,
      // 5. Clear equipment list - will be set manually
      equipmentList: [],
      equipmentIdList: [],
    });
  }

  /**
   * Generate a new counterpart with zeroEnergy equipment lookup (async)
   * Returns an Observable of the generated counterpart
   */
  generateCounterpartWithZeroEnergy(
    primary: LotoPointDto,
    destroyRef: DestroyRef,
    targetUnit?: string
  ): Observable<LotoPointDto> {
    const sourceUnit = this.getSourceUnit(primary);
    const target = targetUnit || this.getTargetUnit(sourceUnit);

    // Generate base counterpart
    const baseCounterpart = this.generateCounterpart(primary, target);

    // If no zeroEnergy or no equipment, return sync version
    const sourceEquipmentIds = primary.zeroEnergy?.templateEquipmentIds || [];
    if (!primary.zeroEnergy || sourceEquipmentIds.length === 0) {
      return of(baseCounterpart);
    }

    // Lookup counterpart equipment via API
    return this.apiService.lookupCounterpartEquipment(sourceEquipmentIds, sourceUnit).pipe(
      takeUntilDestroyed(destroyRef),
      switchMap((response) => {
        const counterpartEquipment = response.responseData || [];
        const counterpartEquipmentIds = counterpartEquipment.map(eq => eq.id);

        const counterpartZeroEnergy = new ZeroEnergyDto({
          zeroEnergyTemplate: primary.zeroEnergy?.zeroEnergyTemplate,
          method: primary.zeroEnergy?.method,
          templateEquipment: counterpartEquipment,
          templateEquipmentIds: counterpartEquipmentIds,
        });

        return of(new LotoPointDto({
          ...baseCounterpart,
          zeroEnergy: counterpartZeroEnergy,
        }));
      }),
      catchError((error) => {
        console.error('Error looking up counterpart equipment:', error);
        // Return base counterpart without equipment
        return of(baseCounterpart);
      })
    );
  }

  // ========== Field Comparison ==========

  /**
   * Get a set of fields that differ between two LOTO points
   * Excludes tagNumber by default since it always differs
   */
  getDifferentFields(
    primary: LotoPointDto | null,
    counterpart: LotoPointDto | null,
    excludeTagNumber: boolean = true
  ): Set<SyncableField> {
    const different = new Set<SyncableField>();

    if (!primary || !counterpart) return different;

    for (const field of SYNCABLE_FIELDS) {
      if (excludeTagNumber && field === 'tagNumber') continue;

      const primaryValue = this.getFieldValue(primary, field);
      const counterpartValue = this.getFieldValue(counterpart, field);

      if (!this.areValuesEqual(primaryValue, counterpartValue)) {
        different.add(field);
      }
    }

    return different;
  }

  /**
   * Check if a specific field is different between two LOTO points
   */
  isFieldDifferent(
    primary: LotoPointDto | null,
    counterpart: LotoPointDto | null,
    field: SyncableField
  ): boolean {
    if (!primary || !counterpart) return false;

    const primaryValue = this.getFieldValue(primary, field);
    const counterpartValue = this.getFieldValue(counterpart, field);

    return !this.areValuesEqual(primaryValue, counterpartValue);
  }

  /**
   * Get field value for comparison (extracts id for objects with id)
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

  // ========== UI Helpers ==========

  /**
   * Get a short label for a syncable field
   */
  getFieldLabel(field: SyncableField): string {
    return FIELD_LABELS[field] || field;
  }

  /**
   * Get the list of syncable fields
   */
  getSyncableFields(): SyncableField[] {
    return [...SYNCABLE_FIELDS];
  }
}
