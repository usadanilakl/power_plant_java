import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RectangleShape, Shape } from '../models/shape.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private apiUrl = `${environment.baseApiUrl}/images-api`;;

  constructor(private http: HttpClient) { }

  getText(path: string | undefined, shape: Shape): Observable<string> {
    if (!path || !shape) {
      throw new Error('Path and Shape are required for text recognition');
    }
    const payload = {
      path: path,
      coordinates: this.generateCoordinates(shape)
    };

    return this.http.post<string>(`${this.apiUrl}/text`, payload, {
      responseType: 'text' as 'json'
    });
  }

  private generateCoordinates(shape: Shape): string {
    if (shape.type !== 'rectangle') {
      throw new Error('Only rectangle shapes are supported for text recognition');
    }
  
    const rect = shape as RectangleShape;
    const startX = Math.round(rect.x);
    const startY = Math.round(rect.y);
    const endX = Math.round(rect.x + rect.width);
    const endY = Math.round(rect.y + rect.height);
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
  
    return `startX:${startX},startY:${startY},endX:${endX},endY:${endY},width:${width},height:${height}`;
  }
}