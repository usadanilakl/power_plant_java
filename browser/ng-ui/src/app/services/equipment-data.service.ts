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
  private loaded = signal(false);

  loadAll(): void {
    if (this.loaded()) return;
    this.loadLotoPoints();
    this.loadWorkAreas();
    this.loadLocations();
    this.loaded.set(true);
  }

  private loadLotoPoints(): void {
    // Try server, fallback to static JSON, fallback to localStorage
    this.serverApi.getLotoPoints().subscribe({
      next: points => {
        this.lotoPoints.set(points);
        localStorage.setItem('pwa_loto_points', JSON.stringify(points));
      },
      error: () => {
        this.http.get<PwaLotoPointEntry[]>('data/loto-points.json').subscribe({
          next: points => {
            this.lotoPoints.set(points);
            localStorage.setItem('pwa_loto_points', JSON.stringify(points));
          },
          error: () => {
            const cached = localStorage.getItem('pwa_loto_points');
            if (cached) this.lotoPoints.set(JSON.parse(cached));
          }
        });
      }
    });
  }

  private loadWorkAreas(): void {
    this.serverApi.getWorkAreas().subscribe({
      next: (areas: any[]) => {
        const mapped: PwaWorkAreaEntry[] = areas.map(a => ({
          id: a.id,
          name: a.name,
          locationIds: a.locationIds || []
        }));
        this.workAreas.set(mapped);
        localStorage.setItem('pwa_work_areas_ext', JSON.stringify(mapped));
      },
      error: () => {
        this.http.get<PwaWorkAreaEntry[]>('data/work-areas.json').subscribe({
          next: areas => {
            this.workAreas.set(areas);
            localStorage.setItem('pwa_work_areas_ext', JSON.stringify(areas));
          },
          error: () => {
            const cached = localStorage.getItem('pwa_work_areas_ext');
            if (cached) this.workAreas.set(JSON.parse(cached));
          }
        });
      }
    });
  }

  private loadLocations(): void {
    this.serverApi.getLocations().subscribe({
      next: locations => {
        this.locations.set(locations);
        localStorage.setItem('pwa_locations', JSON.stringify(locations));
      },
      error: () => {
        this.http.get<PwaLocationEntry[]>('data/locations.json').subscribe({
          next: locations => {
            this.locations.set(locations);
            localStorage.setItem('pwa_locations', JSON.stringify(locations));
          },
          error: () => {
            const cached = localStorage.getItem('pwa_locations');
            if (cached) this.locations.set(JSON.parse(cached));
          }
        });
      }
    });
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
    // Every token must be found somewhere in the combined text (AND logic)
    return tokens.every(token => searchable.includes(token));
  }

  private tokenize(query: string): string[] {
    return (query ?? '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  }

  getAllPoints(): PwaLotoPointEntry[] {
    return this.lotoPoints();
  }
}
