import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment'

// Define an interface for the TagNumber entity
export interface TagNumber {
  id?: number;
  number: string;
  description: string;
  // Add other properties as needed
}

@Injectable({
  providedIn: 'root'
})
export class TagNumberService {
  private apiUrl = `${environment.apiUrl}/tag-numbers`;

  constructor(private http: HttpClient) { }

  // Get all tag numbers
  getAllTagNumbers(): Observable<TagNumber[]> {
    // return this.http.get<TagNumber[]>(this.apiUrl);
    const testData: TagNumber[] = [
      { id: 1, number: 'TN001', description: 'Pump 1' },
      { id: 2, number: 'TN002', description: 'Valve 2' },
      { id: 3, number: 'TN003', description: 'Sensor 3' },
      { id: 4, number: 'TN004', description: 'Motor 4' },
      { id: 5, number: 'TN005', description: 'Switch 5' },
    ];

    // Return the test data as an Observable
    return of(testData);
  }

  // Get a single tag number by ID
  getTagNumberById(id: number): Observable<TagNumber> {
    return this.http.get<TagNumber>(`${this.apiUrl}/${id}`);
  }

  // Create a new tag number
  createTagNumber(tagNumber: TagNumber): Observable<TagNumber> {
    return this.http.post<TagNumber>(this.apiUrl, tagNumber);
  }

  // Update an existing tag number
  updateTagNumber(id: number, tagNumber: TagNumber): Observable<TagNumber> {
    return this.http.put<TagNumber>(`${this.apiUrl}/${id}`, tagNumber);
  }

  // Delete a tag number
  deleteTagNumber(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Search tag numbers
  searchTagNumbers(query: string): Observable<TagNumber[]> {
    return this.http.get<TagNumber[]>(`${this.apiUrl}/search?q=${query}`);
  }

  // You can add more methods as needed, for example:
  // - getTagNumbersByCategory(category: string): Observable<TagNumber[]>
  // - bulkUpdateTagNumbers(tagNumbers: TagNumber[]): Observable<TagNumber[]>
  // - exportTagNumbers(): Observable<Blob>
}