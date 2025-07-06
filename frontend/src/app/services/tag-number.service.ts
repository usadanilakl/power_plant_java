import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment'
import { TagNumber } from '../models/tag-number.model';
import { LotoPointDto } from '../models/loto/loto-point.model';
import { SpringApiResponse } from '../models/api/spring-api-response.model';

// Define an interface for the TagNumber entity


@Injectable({
  providedIn: 'root'
})
export class TagNumberService {
  private apiUrl = `${environment.apiUrl}/tag-numbers`;

  constructor(private http: HttpClient) { }
  // Get all tag numbers
  getAllTagNumbers(): Observable<SpringApiResponse<LotoPointDto[]>> {
    return this.http.get<SpringApiResponse<LotoPointDto[]>>(this.apiUrl);
  }

  // Create a new tag number
  createTagNumber(tagNumber: { [key: string]: string }): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(this.apiUrl, tagNumber);
  }


}