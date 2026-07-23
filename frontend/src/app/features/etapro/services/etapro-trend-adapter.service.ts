import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TrendDataAdapter, TrendSeries, TrendSeriesRequest } from '../../../models/trend/trend-series.model';
import { EtaProApiService } from './etapro-api.service';
import { EtaProPointDto } from '../../../models/etapro/etapro-point.model';

@Injectable({ providedIn: 'root' })
export class EtaProTrendAdapterService implements TrendDataAdapter {

  private apiService = inject(EtaProApiService);
  readonly sourceName = 'EtaPro';

  fetchSeries(request: TrendSeriesRequest): Observable<TrendSeries[]> {
    if (!request.ids.length) return of([]);

    // 1. Fetch metadata for all points (for labels/units)
    return this.apiService.getPoints().pipe(
      switchMap(metaRes => {
        const pointMap = new Map<string, EtaProPointDto>();
        for (const raw of (metaRes.responseData || [])) {
          const p = EtaProPointDto.fromJson(raw);
          if (p.pointId) pointMap.set(p.pointId, p);
        }

        // 2. Fetch on-demand trend data for each requested ID in parallel (historian pass-through —
        //    not limited to what's been collected, so any window works).
        const requests = request.ids.map(id =>
          this.apiService.getTrend(id, request.startTime, request.endTime).pipe(
            map(res => {
              const point = pointMap.get(id);
              const readings = res.responseData || [];
              const series: TrendSeries = {
                id,
                label: point?.description ? `${id} — ${point.description}` : id,
                unit: point?.unit || undefined,
                points: readings
                  .filter((r: any) => r.readingValue != null && r.readingTime != null)
                  .map((r: any) => ({
                    timestamp: r.readingTime,
                    value: r.readingValue,
                    quality: r.quality
                  }))
              };
              return series;
            })
          )
        );

        return forkJoin(requests);
      })
    );
  }

  fetchAvailableSeries(): Observable<{ id: string; label: string; unit?: string; category?: string }[]> {
    return this.apiService.getPoints().pipe(
      map(res => (res.responseData || [])
        .map((p: any) => EtaProPointDto.fromJson(p))
        .filter(p => p.pointId)
        .map(p => ({
          id: p.pointId!,
          label: `${p.pointId} — ${p.description || ''}`.trim(),
          unit: p.unit || undefined,
          category: p.category || undefined,
        }))
      )
    );
  }
}
