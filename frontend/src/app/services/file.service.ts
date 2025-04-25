import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { FileDto } from '../models/file/file.model';
import { SpringApiResponse } from '../models/api/spring-api-response.model';
import { SpringPaginatedResponse } from '../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../models/api/search-criteria.model';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = `${environment.apiUrl}/files`;

  constructor(private http: HttpClient) {}

  // getFiles(params?: any): Observable<SpringPaginatedResponse<FileDto[]>> {
  //   let httpParams = new HttpParams();
  //   if (params) {
  //     Object.keys(params).forEach(key => {
  //       httpParams = httpParams.append(key, params[key]);
  //     });
  //   }
  //   const url = `${this.apiUrl}/paginated`;
  //   return this.http.get<SpringPaginatedResponse<FileDto[]>>(url, {
  //     params: httpParams,
  //     headers: new HttpHeaders({
  //       'Accept': 'application/json'
  //     })
  //   });
  // }

  getFiles(page: number = 1, pageSize: number = 50): Observable<SpringPaginatedResponse<FileDto[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<FileDto[]>>(`${this.apiUrl}/paginated`, { params });
  }

  searchFiles(criteria: SearchCriteria, pageSize: number): Observable<SpringPaginatedResponse<FileDto[]>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<FileDto[]>>(`${this.apiUrl}/search`, criteria, { params });
  }
  getFileById(id: string): Observable<SpringApiResponse<FileDto>> {
    return this.http.get<SpringApiResponse<FileDto>>(`${this.apiUrl}/${id}`);
  }

  
  getFileByUrl(imageUrl: string): Observable<SpringApiResponse<FileDto>> {
    const body = { url: imageUrl };
    return this.http.post<SpringApiResponse<FileDto>>(`${this.apiUrl}/by-url`, body);
  }

  createFile(file: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, file);
  }

  updateFile(formData: FormData): Observable<SpringApiResponse<FileDto>> {
    return this.http.put<SpringApiResponse<FileDto>>(`${this.apiUrl}/files/${id}`, formData);
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

  getMockFiles(params?: any): Observable<any[]> {

        // Mock data
        const testElements = [
          {
            shapeType: { name: 'rectangle' },
            color: '#FF0000',
            shapeData: {
              x: 1200,
              y: 100,
              width: 200,
              height: 800
            }
          },
          {
            shapeType: { name: 'rectangle' },
            color: '#FF0000',
            shapeData: {
              x: 0,
              y: 0,
              width: 200,
              height: 200
            }
          },
          {
            shapeType: { name: 'rectangle' },
            color: '#FF0000',
            shapeData: {
              x: 7144,
              y: 4552,
              width: 200,
              height: 200
            }
          },
          {
            shapeType: { name: 'circle' },
            color: '#00FF00',
            shapeData: {
              x: 2300,
              y: 1300,
              radius: 75
            }
          },
          {
            shapeType: { name: 'line' },
            color: '#0000FF',
            shapeData: {
              x1: 50,
              y1: 50,
              x2: 250,
              y2: 250
            }
          },
          {
            shapeType: { name: 'text' },
            color: '#FFFF00',
            shapeData: {
              x: 400,
              y: 400,
              text: 'Sample Text',
              fontSize: 20
            }
          }
        ];
        const mockFiles = [
          { id: '1', name: 'Document1.pdf', type: 'pdf', size: '1.2 MB', uploadDate: '2023-05-15', category: 'document', tags: ['important']},
          { id: '2', name: 'Image1.jpg', type: 'jpg', size: '3.5 MB', uploadDate: '2023-05-16', category: 'image', tags: ['archived'], url:'assets/images/Image1.jpg', elements: testElements },
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
}