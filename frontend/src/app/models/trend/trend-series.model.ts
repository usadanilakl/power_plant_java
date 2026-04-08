import { Observable } from 'rxjs';

export interface TrendPoint {
  timestamp: string | Date;
  value: number;
  quality?: string;
}

export interface TrendSeries {
  id: string;
  label: string;
  unit?: string;
  color?: string;
  points: TrendPoint[];
}

export interface TrendSeriesRequest {
  ids: string[];
  startTime: string;  // ISO date-time
  endTime: string;
  resolution?: 'raw' | '1m' | '5m' | '1h';
}

/**
 * Adapter interface — each feature implements this to make its data available
 * to the shared trend chart. The chart component is unaware of the data source.
 */
export interface TrendDataAdapter {
  /** Display name shown in the trend window header */
  readonly sourceName: string;

  /** Fetch series data for given IDs and time range */
  fetchSeries(request: TrendSeriesRequest): Observable<TrendSeries[]>;

  /** Get list of available series IDs (for the picker) */
  fetchAvailableSeries(): Observable<{ id: string; label: string; unit?: string; category?: string }[]>;
}
