import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { QrForbiddenError } from '../qr/qr-api.service';
import { FinderRequest, FinderResult } from './equipment-finder.model';

/**
 * Equipment Finder search API.
 *
 * No offline mirror on purpose: the nav entry is hubOnly, and a cached answer to a filter combination
 * nobody typed twice is worth less than the storage it occupies. The DRAWINGS reached from a result
 * still cache, through QrApiService and LotoDrawingService.
 */
@Injectable({ providedIn: 'root' })
export class EquipmentFinderApiService {
  private http = inject(HttpClient);
  private base = `${environment.serverUrl}/api/pwa/secured/equipment-finder`;

  /** Run the filters. Throws {@link QrForbiddenError} on 403 so the page can name the reason. */
  async search(request: FinderRequest): Promise<FinderResult | null> {
    try {
      const r = await firstValueFrom(
        this.http.post<{ responseData: FinderResult }>(`${this.base}/search`, request).pipe(timeout(30000))
      );
      return r?.responseData ?? null;
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 403) throw new QrForbiddenError('No plant access');
      return null;
    }
  }
}
