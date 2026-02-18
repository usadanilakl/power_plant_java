import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImageTextExtractorService {
  private apiUrl = '/images-api';

  constructor(private http: HttpClient) {}

  extractText(imageFile: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.http.post(`${this.apiUrl}/extract-text`, formData, {
      responseType: 'text',
    });
  }
}
