import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RouteDataEncoderService {
  
  /**
   * Encodes an array of objects to a base64 URL-safe string
   */
  encode<T>(data: T[]): string {
    const jsonString = JSON.stringify(data);
    return btoa(jsonString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Decodes a base64 URL-safe string back to an array of objects
   */
  decode<T>(encodedData: string): T[] {
    try {
      // Restore base64 padding and special characters
      const base64 = encodedData
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      const padding = '='.repeat((4 - (base64.length % 4)) % 4);
      const jsonString = atob(base64 + padding);
      
      return JSON.parse(jsonString, this.dateReviver);
    } catch (error) {
      console.error('Error decoding route data:', error);
      return [];
    }
  }

  /**
   * Reviver function to convert ISO date strings back to Date objects
   */
  private dateReviver(key: string, value: any): any {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    if (typeof value === 'string' && isoDateRegex.test(value)) {
      return new Date(value);
    }
    return value;
  }
}