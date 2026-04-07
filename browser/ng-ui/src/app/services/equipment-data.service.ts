import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ServerApiService } from './server-api.service';

export interface PwaLotoPointEntry {
  id: number;
  tagNumber: string;
  description: string;
  specificLocation: string;
  eqType: string;
  locationId: number | null;
}

export interface PwaWorkAreaEntry {
  id: number;
  name: string;
  locationIds: number[];
}

export interface PwaLocationEntry {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class EquipmentDataService {

  private http = inject(HttpClient);
  private serverApi = inject(ServerApiService);

  private lotoPoints = signal<PwaLotoPointEntry[]>([]);
  private workAreas = signal<PwaWorkAreaEntry[]>([]);
  private locations = signal<PwaLocationEntry[]>([]);
  private loadAttempted = false;
  private serverLoaded = false;

  loadAll(): void {
    if (this.loadAttempted && this.serverLoaded) return;
    this.loadAttempted = true;
    this.loadLotoPoints();
    this.loadWorkAreas();
    this.loadLocations();
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
        // Only use fallbacks if we have no data yet
        if (this.lotoPoints().length === 0) {
          this.loadFromFallback<PwaLotoPointEntry[]>('data/loto-points.json', 'pwa_loto_points',
            points => this.lotoPoints.set(points));
        }
      }
    });
  }

  private loadWorkAreas(): void {
    this.serverApi.getWorkAreas().subscribe({
      next: (areas: any[]) => {
        if (areas && areas.length > 0) {
          const mapped: PwaWorkAreaEntry[] = areas.map(a => ({
            id: a.id,
            name: a.name,
            locationIds: a.locationIds || []
          }));
          this.workAreas.set(mapped);
          localStorage.setItem('pwa_work_areas_ext', JSON.stringify(mapped));
        }
      },
      error: () => {
        if (this.workAreas().length === 0) {
          this.loadFromFallback<PwaWorkAreaEntry[]>('data/work-areas.json', 'pwa_work_areas_ext',
            areas => this.workAreas.set(areas));
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
          this.loadFromFallback<PwaLocationEntry[]>('data/locations.json', 'pwa_locations',
            locations => this.locations.set(locations));
        }
      }
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

  getPointsForWorkArea(workAreaId: number): PwaLotoPointEntry[] {
    const area = this.workAreas().find(a => a.id === workAreaId);
    if (!area || !area.locationIds || area.locationIds.length === 0) return [];
    const locationIdSet = new Set(area.locationIds);
    return this.lotoPoints().filter(lp => lp.locationId != null && locationIdSet.has(lp.locationId));
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
