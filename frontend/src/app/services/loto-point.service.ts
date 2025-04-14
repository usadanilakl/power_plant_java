import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient } from "@angular/common/http";


@Injectable({
    providedIn: 'root'
  })
  export class TagNumberService {
    private apiUrl = `${environment.apiUrl}/ng-loto-points`;

    constructor(private http: HttpClient) { }

    getLotoPointsByFileId(fileId: number) {
        return this.http.get<any[]>(`${this.apiUrl}/file/${fileId}`);
    }

  }