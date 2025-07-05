
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private apiUrl = `${environment.baseApiUrl}/api/backup`;

  constructor(private http: HttpClient) {}

  backupDatabase(backupFileName?: string): Observable<string> {
    let params = new HttpParams();
    if (backupFileName) {
      params = params.set('backupFileName', backupFileName);
    }
    return this.http.post<string>(`${this.apiUrl}/backup-database`, null, { params, responseType: 'text' as 'json' });
  }

  restoreDatabase(backupFileName: string): Observable<string> {
    let params = new HttpParams().set('backupFileName', backupFileName);
    return this.http.post<string>(`${this.apiUrl}/restore-database`, null, { params, responseType: 'text' as 'json' });
  }

  listBackups(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/list-backups`);
  }
}