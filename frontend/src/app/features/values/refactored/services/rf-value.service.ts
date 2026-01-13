import { Injectable, inject, signal, computed } from '@angular/core';
import { RfValueApiService } from './rf-value-api.service';
import { RfValueDto, RfCategoryDto } from '../models/rf-value.model';
import { Option } from '../../../../models/option.model';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RfValueService {
  private api = inject(RfValueApiService);

  // State signals
  private valuesCache = signal<Map<string, RfValueDto[]>>(new Map());
  private categoriesCache = signal<RfCategoryDto[]>([]);

  // Public computed signals
  categories = computed(() => this.categoriesCache());

  constructor() {
    // Load categories on init
    this.loadCategories();

    // Preload common value categories for loto points
    this.preloadCommonCategories();
  }

  /**
   * Preload commonly used value categories to avoid race conditions
   */
  private preloadCommonCategories(): void {
    const commonCategories = ['isoPos', 'normPos', 'location', 'eqType', 'zeroEnergyPhrase'];
    commonCategories.forEach(alias => this.loadCategoryValues(alias));
  }

  // ==================== CATEGORY MANAGEMENT ====================

  private loadCategories(): void {
    this.api.getAllCategories().subscribe(categories => {
      this.categoriesCache.set(categories);
    });
  }

  getCategoryOptions() {
    return computed(() =>
      this.categoriesCache().map(cat => ({
        value: cat.alias || cat.name,
        label: cat.name
      }))
    );
  }

  // ==================== VALUE MANAGEMENT ====================

  /**
   * Get values for a category as a signal
   * Triggers loading from API if not in cache
   */
  getValuesByCategory(categoryAlias: string): RfValueDto[] {
    // Check cache first
    const cached = this.valuesCache().get(categoryAlias);

    // If not cached, trigger load
    if (!cached) {
      this.loadCategoryValues(categoryAlias);
      return [];
    }

    return cached;
  }

  /**
   * Load values for a category from API
   */
  private loadCategoryValues(categoryAlias: string): void {
    this.api.getValuesByCategory(categoryAlias).subscribe(values => {
      const cache = new Map(this.valuesCache());
      cache.set(categoryAlias, values);
      this.valuesCache.set(cache);
    });
  }

  /**
   * Get values as Options for dropdowns
   * Returns a computed signal that reactively updates
   */
  getValueOptions(categoryAlias: string) {
    return computed(() => {
      const cache = this.valuesCache();
      const values = cache.get(categoryAlias) || [];

      // Trigger load if not cached
      if (values.length === 0 && !cache.has(categoryAlias)) {
        // Schedule load outside of computed context
        setTimeout(() => this.loadCategoryValues(categoryAlias), 0);
      }

      return values.map(v => ({
        value: v.id,
        label: v.name
      } as Option));
    });
  }

  /**
   * Create a new value and update cache
   */
  createValue(categoryAlias: string, valueName: string, valueAlias?: string): Observable<RfValueDto> {
    return this.api.createValue(categoryAlias, valueName, valueAlias).pipe(
      tap(newValue => {
        // Update cache
        const cache = new Map(this.valuesCache());
        const categoryValues = cache.get(categoryAlias) || [];
        cache.set(categoryAlias, [...categoryValues, newValue]);
        this.valuesCache.set(cache);
      })
    );
  }

  /**
   * Update an existing value and update cache
   */
  updateValue(valueId: number, name: string, alias?: string): Observable<RfValueDto> {
    return this.api.updateValue(valueId, name, alias).pipe(
      tap(updatedValue => {
        // Update cache
        const cache = new Map(this.valuesCache());
        const categoryAlias = updatedValue.category?.alias || updatedValue.category?.name;
        if (categoryAlias) {
          const categoryValues = cache.get(categoryAlias) || [];
          const index = categoryValues.findIndex(v => v.id === valueId);
          if (index !== -1) {
            categoryValues[index] = updatedValue;
            cache.set(categoryAlias, [...categoryValues]);
            this.valuesCache.set(cache);
          }
        }
      })
    );
  }

  /**
   * Delete a value and update cache
   */
  deleteValue(valueId: number, categoryAlias: string, transferToValueId?: number): Observable<void> {
    return this.api.deleteValue(valueId, transferToValueId).pipe(
      tap(() => {
        // Remove from cache
        const cache = new Map(this.valuesCache());
        const categoryValues = cache.get(categoryAlias) || [];
        cache.set(categoryAlias, categoryValues.filter(v => v.id !== valueId));
        this.valuesCache.set(cache);
      })
    );
  }

  /**
   * Refresh values for a category (force reload from API)
   */
  refreshCategory(categoryAlias: string): void {
    this.api.getValuesByCategory(categoryAlias).subscribe(values => {
      const cache = new Map(this.valuesCache());
      cache.set(categoryAlias, values);
      this.valuesCache.set(cache);
    });
  }

  /**
   * Bulk load values for multiple categories
   */
  loadCategoriesValues(categoryAliases: string[]): Observable<Map<string, RfValueDto[]>> {
    return this.api.getValuesByCategories(categoryAliases).pipe(
      tap(valuesMap => {
        const cache = new Map(this.valuesCache());
        valuesMap.forEach((values, alias) => {
          cache.set(alias, values);
        });
        this.valuesCache.set(cache);
      })
    );
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.valuesCache.set(new Map());
  }
}
