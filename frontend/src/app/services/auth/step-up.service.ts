import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StepUpTokenResponse {
  token: string;
  expiresAt: string;
}

/**
 * Exchanges a combined initials+PIN code (e.g. "DK1234") for a one-shot step-up
 * token, and produces the HTTP headers needed to use that token on the next
 * action request. See project/features/users/pin-authentication.md.
 */
@Injectable({ providedIn: 'root' })
export class StepUpService {
  private http = inject(HttpClient);

  /** POST /api/auth/step-up — returns a token bound to the user the code resolves to. */
  authorize(code: string): Observable<StepUpTokenResponse> {
    return this.http.post<StepUpTokenResponse>(`${environment.apiUrl}/auth/step-up`, { code });
  }

  /** Promise variant for use inside async/await dialog flows. */
  authorizeAsync(code: string): Promise<StepUpTokenResponse> {
    return firstValueFrom(this.authorize(code));
  }

  /** Build the headers to attach to the next action request that should run under the stepped-up identity. */
  headers(token: string): HttpHeaders {
    return new HttpHeaders({ 'X-Sign-As-Token': token });
  }
}
