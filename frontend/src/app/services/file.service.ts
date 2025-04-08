import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = `${environment.apiUrl}/files`;

  constructor(private http: HttpClient) {}

  getFiles(params?: any): Observable<any[]> {
    // let httpParams = new HttpParams();
    // if (params) {
    //   Object.keys(params).forEach(key => {
    //     httpParams = httpParams.append(key, params[key]);
    //   });
    // }
    // return this.http.get<any[]>(this.apiUrl, { params: httpParams });

        // Mock data
        const mockFiles = [
          { id: '1', name: 'Document1.pdf', type: 'pdf', size: '1.2 MB', uploadDate: '2023-05-15', category: 'document', tags: ['important']},
          { id: '2', name: 'Image1.jpg', type: 'jpg', size: '3.5 MB', uploadDate: '2023-05-16', category: 'image', tags: ['archived'], url:'assets/images/Image1.jpg' },
          { id: '3', name: 'Spreadsheet1.xlsx', type: 'xlsx', size: '0.8 MB', uploadDate: '2023-05-17', category: 'spreadsheet', tags: ['confidential'] },
          { id: '4', name: 'Document2.docx', type: 'docx', size: '2.1 MB', uploadDate: '2023-05-18', category: 'document', tags: ['important', 'confidential'] },
          { id: '5', name: 'Presentation1.pptx', type: 'pptx', size: '5.3 MB', uploadDate: '2023-05-19', category: 'other', tags: [] }
        ];
    
        // Simulate filtering based on params
        let filteredFiles = mockFiles;
        if (params && params.lastId) {
          const lastIndex = mockFiles.findIndex(file => file.id === params.lastId);
          filteredFiles = mockFiles.slice(lastIndex + 1);
        }
    
        // Return the mock data as an Observable
        return of(filteredFiles);


  }

  searchFiles(criteria: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/search`, criteria);
  }

  getFileById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createFile(file: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, file);
  }

  updateFile(id: string, file: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, file);
  }

  deleteFile(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<any>(`${this.apiUrl}/upload`, formData);
  }

  downloadFile(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
  }
}