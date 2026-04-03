import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { SpringApiResponse } from '../models/api/spring-api-response.model';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private testModeSubject = new BehaviorSubject<boolean>(false);
  testMode$ = this.testModeSubject.asObservable();

  constructor(private http: HttpClient) {
    this.http.get<SpringApiResponse<boolean>>(`${environment.apiUrl}/config/test-mode`)
      .subscribe({
        next: res => this.testModeSubject.next(res.responseData ?? false),
        error: () => this.testModeSubject.next(false)
      });
  }

  get isTestMode(): boolean {
    return this.testModeSubject.value;
  }
}
