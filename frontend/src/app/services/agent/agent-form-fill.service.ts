import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';

export interface FieldSpec {
  name: string;
  label: string;
  type: string;
  categoryAlias?: string;
}

export interface FormFillRequest {
  formType: string;
  userMessage: string;
  fields: FieldSpec[];
  currentValues?: Record<string, any>;
  formContext?: Record<string, string>;
}

export interface FormFillResponse {
  fieldValues: Record<string, any>;
  message: string;
  success: boolean;
  guidance?: string[];
}

@Injectable({ providedIn: 'root' })
export class AgentFormFillService {
  private http = inject(HttpClient);

  fillForm(request: FormFillRequest): Observable<SpringApiResponse<FormFillResponse>> {
    return this.http.post<SpringApiResponse<FormFillResponse>>(
      `${environment.apiUrl}/agent/form-fill`, request
    );
  }
}
