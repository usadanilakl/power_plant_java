import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { WorkRequest } from '../../models/permits/work-request.model';
import { PwaWorkAreaRow, PwaWorkCategoryRow, ServerApiService } from '../../services/server-api.service';
import { SupabaseDataService } from '../../services/supabase-data.service';

type AreaSeed = PwaWorkAreaRow;
type CategorySeed = PwaWorkCategoryRow;

const AREA_CACHE_KEY = 'pwa_work_area_seeds';
const CATEGORY_CACHE_KEY = 'pwa_work_categories_full';

/**
 * Fills a work request in from what the plant already knows.
 *
 * <p>A contractor cannot be expected to know that a given part of the plant always carries stored
 * energy, or that insulation removal always implies a dust hazard. The plant knows both — work
 * areas carry constant hazards and constant LOTO standards, work categories carry a standard hazard
 * profile — so the submission flow applies them rather than asking.
 *
 * <h2>Seeding only ever turns hazards ON</h2>
 *
 * It never clears one. Two reasons, and they matter more than the convenience:
 *
 * <ul>
 *   <li>A requester who ticks a hazard knows something we do not. Nothing automatic should be able
 *       to remove it.</li>
 *   <li>Re-seeding happens whenever the area or work type changes, which can be after the hazards
 *       have been reviewed. If seeding could clear, changing the area at the last moment would
 *       silently undo that review.</li>
 * </ul>
 *
 * <p>The caller passes the set of hazards the requester has explicitly DECLINED; those are skipped,
 * so unticking something makes it stay unticked even if the area is changed afterwards.
 *
 * <h2>Offline</h2>
 *
 * Reference data comes from the hub, then the Supabase snapshot, then the static JSON bundled with
 * the PWA, and is cached in localStorage after any success. A submission made in a basement with no
 * signal has to seed the same hazards as one made at a desk — a request that carries fewer hazards
 * because of where it was filled in is the worst kind of difference to ship.
 */
@Injectable({ providedIn: 'root' })
export class WorkAreaSeedService {
  private http = inject(HttpClient);
  private serverApi = inject(ServerApiService);
  private supabaseData = inject(SupabaseDataService);

  private areas = new Map<number, AreaSeed>();
  private categories = new Map<string, CategorySeed>();

  constructor() {
    this.hydrateFromCache();
    this.refresh();
  }

  // ---------------------------------------------------------------- loading

  private hydrateFromCache(): void {
    this.areas = this.readCache<AreaSeed>(AREA_CACHE_KEY, a => a.id);
    this.categories = this.readCache<CategorySeed>(CATEGORY_CACHE_KEY, c => c.name);
  }

  private readCache<T>(key: string, keyOf: (row: T) => any): Map<any, T> {
    try {
      const raw = localStorage.getItem(key);
      const rows: T[] = raw ? JSON.parse(raw) : [];
      return new Map(rows.map(row => [keyOf(row), row]));
    } catch {
      return new Map();
    }
  }

  private refresh(): void {
    this.serverApi.getWorkAreas().subscribe({
      next: rows => this.acceptAreas(rows),
      error: () => this.supabaseData.snapshotOrElse(
        'work_areas',
        (rows: AreaSeed[]) => this.acceptAreas(rows),
        () => this.http.get<AreaSeed[]>('data/work-areas.json').subscribe({
          next: rows => this.acceptAreas(rows),
          error: () => { /* keep whatever the cache had */ },
        })),
    });

    this.serverApi.getWorkCategories().subscribe({
      next: rows => this.acceptCategories(rows),
      error: () => this.supabaseData.snapshotOrElse(
        'work_categories',
        (rows: CategorySeed[]) => this.acceptCategories(rows),
        () => this.http.get<CategorySeed[]>('data/work-categories.json').subscribe({
          next: rows => this.acceptCategories(rows),
          error: () => { /* keep whatever the cache had */ },
        })),
    });
  }

  private acceptAreas(rows: AreaSeed[]): void {
    if (!Array.isArray(rows) || !rows.length) return;
    this.areas = new Map(rows.map(r => [r.id, r]));
    try { localStorage.setItem(AREA_CACHE_KEY, JSON.stringify(rows)); } catch { /* quota */ }
  }

  private acceptCategories(rows: CategorySeed[]): void {
    if (!Array.isArray(rows) || !rows.length) return;
    this.categories = new Map(rows.map(r => [r.name, r]));
    try { localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(rows)); } catch { /* quota */ }
  }

  // ---------------------------------------------------------------- seeding

  /** LOTO standards the chosen area always carries — surfaced so the operator sees them. */
  lotoStandardIdsFor(workAreaId: number | null | undefined): number[] {
    if (workAreaId == null) return [];
    return this.areas.get(workAreaId)?.constantLotoIds ?? [];
  }

  /**
   * Apply the chosen area's standing profile: hazards, LOTO requirement, and confined space.
   *
   * <p>Confined space follows the rule the original form already established — a "Yes" the
   * requester chose themselves is never downgraded, because they may know about an entry the area's
   * own record does not.
   */
  applyAreaSeeding(wr: WorkRequest, declined: Set<string>): void {
    const area = wr.workAreaId != null ? this.areas.get(wr.workAreaId) : undefined;
    if (!area) return;

    this.merge(wr, 'declaredHazards', area.constantHazards, declined);
    this.merge(wr, 'declaredHotWorkMeasures', area.constantHotWorkMeasures, declined);
    this.merge(wr, 'declaredConfinedSpaceHazards', area.constantConfinedSpaceHazards, declined);

    if (area.isConfinedSpace) {
      wr.isConfinedSpaceEntryRequired = 'Yes';
      if (!String((wr as any).spaceToBeEntered ?? '').trim()) {
        (wr as any).spaceToBeEntered = area.name;
      }
    }

    // An area with constant LOTO standards is isolated for every job in it. Saying "no LOTO" there
    // would be wrong on the face of it, so the answer is pre-set — the requester can still say
    // otherwise, and the operator decides in the end regardless.
    if ((area.constantLotoIds?.length ?? 0) > 0 && !wr.isLOTORequired) {
      wr.isLOTORequired = 'Yes';
    }
  }

  /** Apply the chosen work type's standard hazard profile. */
  applyWorkTypeSeeding(wr: WorkRequest, declined: Set<string>): void {
    const category = wr.workCategoryName ? this.categories.get(wr.workCategoryName) : undefined;
    if (!category) return;
    this.merge(wr, 'declaredHazards', category.standardHazards, declined);
    this.merge(wr, 'declaredHotWorkMeasures', category.standardHotWorkMeasures, declined);
    this.merge(wr, 'declaredConfinedSpaceHazards', category.standardConfinedSpaceHazards, declined);
  }

  /** Turn on every true flag in `source` that the requester has not declined. Never turns one off. */
  private merge(
    wr: WorkRequest,
    block: 'declaredHazards' | 'declaredHotWorkMeasures' | 'declaredConfinedSpaceHazards',
    source: Record<string, boolean> | null | undefined,
    declined: Set<string>
  ): void {
    if (!source) return;
    const target: any = (wr as any)[block] ?? {};
    for (const [key, on] of Object.entries(source)) {
      if (on !== true) continue;
      if (declined.has(`${block}.${key}`)) continue;
      target[key] = true;
    }
    (wr as any)[block] = target;
  }
}
