import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, timeout, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { WorkRequest } from '../models/permits/work-request.model';

export interface PwaSubmissionResult {
  success: boolean;
  sharepointId?: string;
  method: 'server' | 'powerAutomate' | 'email' | 'local';
  message?: string;
  localUuid: string;
}

export interface PwaStatusResult {
  localUuid: string;
  sharepointId?: string;
  status: string;
  submittedAt?: Date;
  submissionMethod?: string;
}

export interface PwaWorkRequestDto {
  localUuid: string;
  company: string;
  dateOfWork: string;
  timeOfWork: string;
  locationOfWork: string;
  workRequestedBy: string;
  affectedEquipment: string;
  workScope: string;
  isLotoRequired: boolean;
  isHotWorkRequired: boolean;
  isConfinedSpaceEntryRequired: boolean;
  foremanName?: string;
  fireWatchName?: string;
  spaceToBeEntered?: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  submitterCompany: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServerApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.serverUrl;

  submitWorkRequest(dto: PwaWorkRequestDto): Observable<PwaSubmissionResult> {
    return this.http.post<{ payload: PwaSubmissionResult }>(`${this.baseUrl}/api/pwa/work-request/submit`, dto).pipe(
      timeout(15000),
      map(response => response.payload),
      catchError(this.handleError)
    );
  }

  getWorkRequestStatus(localUuid: string): Observable<PwaStatusResult | null> {
    return this.http.get<{ payload: PwaStatusResult }>(`${this.baseUrl}/api/pwa/work-request/status/${localUuid}`).pipe(
      timeout(10000),
      map(response => response.payload),
      catchError(err => {
        if (err.status === 404) {
          return of(null);
        }
        return throwError(() => err);
      })
    );
  }

  isAvailable(): Observable<boolean> {
    return this.http.get(`${this.baseUrl}/api/pwa/work-request/health`, { responseType: 'text' }).pipe(
      timeout(5000),
      map(() => true),
      catchError(() => of(false))
    );
  }

  convertWorkRequestToDto(workRequest: WorkRequest, userData: { name: string; email: string; phone: string; company: string }): PwaWorkRequestDto {
    const dateStr = workRequest.dateOfWork instanceof Date
      ? workRequest.dateOfWork.toISOString().split('T')[0]
      : String(workRequest.dateOfWork || '');

    return {
      localUuid: workRequest.localUuid || crypto.randomUUID(),
      company: workRequest.company || '',
      dateOfWork: dateStr,
      timeOfWork: workRequest.timeOfWork || '',
      locationOfWork: workRequest.locationOfWork || '',
      workRequestedBy: workRequest.workRequestedBy || '',
      affectedEquipment: workRequest.affectedEquipment || '',
      workScope: workRequest.workScope || '',
      isLotoRequired: workRequest.isLOTORequired === 'Yes',
      isHotWorkRequired: workRequest.isHotWorkRequired === 'Yes',
      isConfinedSpaceEntryRequired: workRequest.isConfinedSpaceEntryRequired === 'Yes',
      foremanName: workRequest.foremanName,
      fireWatchName: workRequest.fireWatchName,
      spaceToBeEntered: workRequest.spaceToBeEntered,
      submitterName: userData.name,
      submitterEmail: userData.email,
      submitterPhone: userData.phone,
      submitterCompany: userData.company
    };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Server request failed';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Network error: ${error.error.message}`;
    } else if (error.status === 0) {
      errorMessage = 'Server is unreachable';
    } else {
      errorMessage = `Server error: ${error.status} - ${error.message}`;
    }
    console.error('[ServerAPI]', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
