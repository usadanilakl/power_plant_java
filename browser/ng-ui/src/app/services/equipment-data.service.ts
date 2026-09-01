import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ServerApiService } from './server-api.service';
import { SupabaseDataService } from './supabase-data.service';

export interface PwaLotoPointEntry {
  id: number;
  tagNumber: string;
  description: string;
  specificLocation: string;
  eqType: string;
  locationId: number | null;
}

/**
 * One entry of the plant's System vocabulary.
 *
 * <p>Labelled by `name` and never by alias — several of these values have no alias at all, so an
 * alias-labelled list would show blanks.
 */
export interface PwaSystemEntry {
  id: number;
  name: string;
}

export interface PwaWorkAreaEntry {
  id: number;
  name: string;
  locationIds: number[];
  /**
   * `{ [locationId]: '01' | '02' }` — the unit whose equipment this area wants from that
   * location. Locations are shared between units (one "Duct Burner" serves both), so without
   * this a U1 area lists U2 equipment too. Absent entry = both units.
   */
  locationUnitFilters?: Record<string, string>;
  /** Work-area type name, e.g. "Confined Space". Used by pickers that only accept certain types. */
  areaTypeName?: string;
}

export interface PwaLocationEntry {
  id: number;
  name: string;
}

export type EquipmentFilterMode = 'AND' | 'OR';

export interface EquipmentWordBucket {
  terms: string[];
  mode: EquipmentFilterMode;
}

/**
 * One bucket per searchable field; populated buckets combine with AND.
 *
 * <p>These mirror the Equipment Finder's boxes for every dimension the OFFLINE snapshot actually
 * carries. Location is deliberately absent: a point stores `locationId`, not a location name, and
 * the picker already exposes locations as tabs — a second, text-matched location filter would be a
 * worse version of a control that is already there.
 *
 * <p>`filterPoints` indexes `point[field]` directly, so every key here must name a string property
 * of {@link PwaLotoPointEntry}.
 */
export interface EquipmentPointFilters {
  tagNumber?: EquipmentWordBucket;
  description?: EquipmentWordBucket;
  specificLocation?: EquipmentWordBucket;
  eqType?: EquipmentWordBucket;
}

@Injectable({ providedIn: 'root' })
export class EquipmentDataService {

  private http = inject(HttpClient);
  private serverApi = inject(ServerApiService);
  private supabaseData = inject(SupabaseDataService);

  private lotoPoints = signal<PwaLotoPointEntry[]>([]);
  private workAreas = signal<PwaWorkAreaEntry[]>([]);
  private locations = signal<PwaLocationEntry[]>([]);
  private systemValues = signal<PwaSystemEntry[]>([]);
  private loadAttempted = false;
  private serverLoaded = false;

  loadAll(): void {
    if (this.loadAttempted && this.serverLoaded) return;
    this.loadAttempted = true;
    this.loadLotoPoints();
    this.loadWorkAreas();
    this.loadLocations();
    this.loadSystems();
  }

  /** Retry fetching from server (e.g. when server comes online later) */
  retryFromServer(): void {
    if (this.serverLoaded) return;
    this.loadLotoPoints();
    this.loadWorkAreas();
    this.loadLocations();
  }

  private loadLotoPoints(): void {
    this.serverApi.getLotoPoints().subscribe({
      next: points => {
        if (points && points.length > 0) {
          this.lotoPoints.set(points);
          localStorage.setItem('pwa_loto_points', JSON.stringify(points));
          this.serverLoaded = true;
        }
      },
      error: () => {
        // Only use fallbacks if we have no data yet: Supabase (auth-gated) → static JSON → localStorage.
        if (this.lotoPoints().length === 0) {
          this.loadWithSupabaseFallback<PwaLotoPointEntry[]>('loto_points',
            'data/loto-points.json', 'pwa_loto_points', points => this.lotoPoints.set(points));
        }
      }
    });
  }

  private loadWorkAreas(): void {
    this.serverApi.getWorkAreas().subscribe({
      next: (areas: any[]) => {
        if (areas && areas.length > 0) {
          const mapped: PwaWorkAreaEntry[] = areas.map(a => EquipmentDataService.toWorkAreaEntry(a));
          this.workAreas.set(mapped);
          localStorage.setItem('pwa_work_areas_ext', JSON.stringify(mapped));
        }
      },
      error: () => {
        if (this.workAreas().length === 0) {
          // Supabase stores the raw hub shape, so map it to PwaWorkAreaEntry (as the live path does).
          this.loadWithSupabaseFallback<PwaWorkAreaEntry[]>('work_areas',
            'data/work-areas.json', 'pwa_work_areas_ext', areas => this.workAreas.set(areas),
            raw => raw.map(a => EquipmentDataService.toWorkAreaEntry(a)));
        }
      }
    });
  }

  private loadLocations(): void {
    this.serverApi.getLocations().subscribe({
      next: locations => {
        if (locations && locations.length > 0) {
          this.locations.set(locations);
          localStorage.setItem('pwa_locations', JSON.stringify(locations));
        }
      },
      error: () => {
        if (this.locations().length === 0) {
          this.loadWithSupabaseFallback<PwaLocationEntry[]>('locations',
            'data/locations.json', 'pwa_locations', locations => this.locations.set(locations));
        }
      }
    });
  }

  /**
   * The plant's system vocabulary — Combustion Turbine, HRSG, Fuel Gas System and the rest.
   *
   * <p>No hub call, unlike its siblings. The list is small, changes rarely, and — crucially — work
   * request submission is deliberately open to anonymous contractors, so reaching for a secured
   * endpoint here would mean either a 401 for the people who most need it or opening a new
   * anonymous surface. The publisher keeps both the Supabase snapshot and the static JSON current,
   * which is enough.
   */
  private loadSystems(): void {
    if (this.systemValues().length) return;
    this.loadWithSupabaseFallback<PwaSystemEntry[]>('systems',
      'data/systems.json', 'pwa_systems', systems => this.systemValues.set(systems));
  }

  /** The plant's systems, alphabetical. Empty until the reference data has loaded. */
  getSystems(): PwaSystemEntry[] {
    return [...this.systemValues()].sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Failover chain when the hub is unreachable: Supabase (auth-gated, fresh) → static JSON → localStorage.
   * `mapFn` adapts the raw Supabase payload to the entry shape (needed only for work areas).
   */
  private loadWithSupabaseFallback<T>(
    key: string, jsonPath: string, cacheKey: string,
    setter: (data: T) => void, mapFn?: (raw: any[]) => T,
  ): void {
    const toStatic = () => this.loadFromFallback<T>(jsonPath, cacheKey, setter);
    this.supabaseData.getSnapshot(key).subscribe({
      next: raw => {
        if (raw && raw.length) {
          const data = mapFn ? mapFn(raw) : (raw as unknown as T);
          setter(data);
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } else {
          toStatic();
        }
      },
      error: toStatic,
    });
  }

  /** Static JSON → localStorage fallback chain */
  private loadFromFallback<T>(jsonPath: string, cacheKey: string, setter: (data: T) => void): void {
    this.http.get<T>(jsonPath).subscribe({
      next: data => {
        if (data && (Array.isArray(data) ? data.length > 0 : true)) {
          setter(data);
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } else {
          this.loadFromCache(cacheKey, setter);
        }
      },
      error: () => this.loadFromCache(cacheKey, setter)
    });
  }

  private loadFromCache<T>(cacheKey: string, setter: (data: T) => void): void {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { setter(JSON.parse(cached)); } catch { /* ignore */ }
    }
  }

  /** Normalize one raw hub/snapshot work-area row. Shared by the live and failover paths. */
  private static toWorkAreaEntry(raw: any): PwaWorkAreaEntry {
    return {
      id: raw.id,
      name: raw.name,
      locationIds: raw.locationIds || [],
      locationUnitFilters: raw.locationUnitFilters || {},
      areaTypeName: raw.areaTypeName || '',
    };
  }

  /**
   * LOTO points this work area covers, honouring each location's unit pin.
   *
   * A location can be shared by both units, so the pin EXCLUDES THE OPPOSITE UNIT rather than
   * whitelisting its own: pinning '01' drops 02* tags and keeps everything else — 01* tags plus
   * 00* and any tag that doesn't open with a unit prefix at all. Only tags positively identified as
   * the other unit are removed, so a filter can never silently hide equipment whose tag doesn't
   * follow the 01/02 convention.
   */
  getPointsForWorkArea(workAreaId: number): PwaLotoPointEntry[] {
    const area = this.workAreas().find(a => a.id === workAreaId);
    if (!area || !area.locationIds || area.locationIds.length === 0) return [];

    const filters = area.locationUnitFilters ?? {};
    const locationIdSet = new Set(area.locationIds);

    return this.lotoPoints().filter(lp => {
      if (lp.locationId == null || !locationIdSet.has(lp.locationId)) return false;

      const pinnedUnit = filters[String(lp.locationId)];
      if (pinnedUnit !== '01' && pinnedUnit !== '02') return true; // no pin → both units

      const otherUnit = pinnedUnit === '01' ? '02' : '01';
      return EquipmentDataService.unitPrefixOf(lp.tagNumber) !== otherUnit;
    });
  }

  /** Location Value tabs for a work area, in the same order as the area relationship. */
  getLocationsForWorkArea(workAreaId: number): PwaLocationEntry[] {
    const area = this.workAreas().find(a => a.id === workAreaId);
    if (!area?.locationIds?.length) return [];

    const byId = new Map(this.locations().map(location => [location.id, location]));
    return area.locationIds
      .map(id => byId.get(id) ?? { id, name: `Location ${id}` })
      .filter((location, index, all) => all.findIndex(item => item.id === location.id) === index);
  }

  getLocationName(locationId: number | null | undefined): string {
    if (locationId == null) return '';
    return this.locations().find(location => location.id === locationId)?.name ?? '';
  }

  /**
   * Unit prefix of a LOTO tag: '01' for Unit 1, '02' for Unit 2, null for anything else (00*, tags
   * that start with a letter, blank). Per the plant convention any tag opening with those two digits
   * belongs to that unit. Single place to adjust if the convention ever widens.
   */
  private static unitPrefixOf(tagNumber: string | null | undefined): string | null {
    const tag = (tagNumber ?? '').trim();
    if (tag.startsWith('01')) return '01';
    if (tag.startsWith('02')) return '02';
    return null;
  }

  getPointsGroupedByEqType(points: PwaLotoPointEntry[]): Map<string, PwaLotoPointEntry[]> {
    const groups = new Map<string, PwaLotoPointEntry[]>();
    for (const point of points) {
      const type = point.eqType || 'Other';
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type)!.push(point);
    }
    return groups;
  }

  searchPoints(query: string, points?: PwaLotoPointEntry[]): PwaLotoPointEntry[] {
    const tokens = this.tokenize(query);
    if (tokens.length === 0) return [];
    const source = points ?? this.lotoPoints();
    return source.filter(lp => this.matchesTokens(lp, tokens)).slice(0, 50);
  }

  searchAllPoints(query: string): PwaLotoPointEntry[] {
    return this.searchPoints(query);
  }

  /**
   * Apply Equipment Finder-style word buckets locally. Terms within a field use that field's
   * AND/OR mode; tag and description buckets always combine with AND.
   */
  filterPoints(
    filters: EquipmentPointFilters,
    points?: PwaLotoPointEntry[],
    limit?: number,
  ): PwaLotoPointEntry[] {
    const source = points ?? this.lotoPoints();
    const active = (Object.entries(filters) as [keyof EquipmentPointFilters, EquipmentWordBucket | undefined][])
      .filter((entry): entry is [keyof EquipmentPointFilters, EquipmentWordBucket] =>
        !!entry[1]?.terms.some(term => !!term.trim()));

    if (active.length === 0) return limit == null ? source : source.slice(0, limit);

    const matches = source.filter(point => active.every(([field, bucket]) => {
      const value = (point[field] ?? '').toLowerCase();
      const terms = bucket.terms.map(term => term.trim().toLowerCase()).filter(Boolean);
      return bucket.mode === 'OR'
        ? terms.some(term => value.includes(term))
        : terms.every(term => value.includes(term));
    }));
    return limit == null ? matches : matches.slice(0, limit);
  }

  private matchesTokens(lp: PwaLotoPointEntry, tokens: string[]): boolean {
    const searchable = [
      lp.tagNumber ?? '',
      lp.description ?? '',
      lp.specificLocation ?? '',
      lp.eqType ?? ''
    ].join(' ').toLowerCase();
    return tokens.every(token => searchable.includes(token));
  }

  private tokenize(query: string): string[] {
    return (query ?? '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  }

  getAllPoints(): PwaLotoPointEntry[] {
    return this.lotoPoints();
  }
}
