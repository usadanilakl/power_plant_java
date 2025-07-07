import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../models/api/spring-api-response.model";
import { ValueDto } from "../models/value.model";
import { CategoryDto } from "../models/category.model";

@Injectable({
  providedIn: 'root'
})
export class ValueService {

  private apiUrl = `${environment.apiUrl}/values`;

  constructor(private http: HttpClient) {}  

  addValueToCategoryById(categoryId: string, value: string): Observable<SpringApiResponse<ValueDto>> {
    return this.http.post<SpringApiResponse<ValueDto>>(`${this.apiUrl}/add-to-category-by-id/${categoryId}`, value);
  }

    
  addValueToCategoryByName(categoryName: string, value: string, valueAlias: string = ''): Observable<SpringApiResponse<ValueDto>> {
      return this.http.post<SpringApiResponse<ValueDto>>(`${this.apiUrl}/add-to-category-by-name`,{category:categoryName, value:value, valueAlias:valueAlias});
    }

  getAllCategories(): Observable<SpringApiResponse<CategoryDto[]>> {
    return this.http.get<SpringApiResponse<CategoryDto[]>>(`${this.apiUrl}/categories`);
  }

  updateValue(valueId: number, newName: string, newAlias:string=""): Observable<SpringApiResponse<ValueDto>> {
    return this.http.put<SpringApiResponse<ValueDto>>(`${this.apiUrl}/${valueId}`, { name: newName, alias: newAlias });
  }

  deleteValueAndTransfer(valueIdToDelete: number, transferToValueId: number): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.apiUrl}/delete-and-transfer`, {
      valueIdToDelete: valueIdToDelete,
      transferToValueId: transferToValueId
    });
  }

}