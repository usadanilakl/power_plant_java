import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { PrintableFormDto } from "../../models/forms/printable-form.model";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { FormContainerDto } from "../../models/forms/form-container.model";

export type PrintableFormType =
    'SafeWork' | 'HotWork' | 'ConfinedSpace' | 'ConfinedSpaceReclassified' | 'ConfinedSpaceEntryRecord' | 'Loto' | 'Jha' | 'EnergizedWorkPermit' | 'ExcavationPermit' | 'VentingPermit';

@Injectable({
  providedIn: 'root'
})
export class PrintableFormService {
  private apiUrl = `${environment.apiUrl}/forms`;

  constructor(private http: HttpClient) {}
  
    getAll(): Observable<SpringApiResponse<PrintableFormDto[]>> {
      return this.http.get<SpringApiResponse<PrintableFormDto[]>>(`${this.apiUrl}/get-all`);
    }
  
    getById(id: number): Observable<SpringApiResponse<PrintableFormDto>> {
      return this.http.get<SpringApiResponse<PrintableFormDto>>(`${this.apiUrl}/get-by-id/${id}`);
    }
    save(form: PrintableFormDto): Observable<SpringApiResponse<PrintableFormDto>> {
      return this.http.post<SpringApiResponse<PrintableFormDto>>(this.apiUrl+"/save", form);
    }
    addContainerToForm(formId: number, containerId: number): Observable<SpringApiResponse<PrintableFormDto>> {
        return this.http.post<SpringApiResponse<PrintableFormDto>>(`${this.apiUrl}/add/${containerId}/to/${formId}`,{});
    }
    addAllContainers(id: number, containers: FormContainerDto[]): Observable<SpringApiResponse<PrintableFormDto>> {
        return this.http.post<SpringApiResponse<PrintableFormDto>>(`${this.apiUrl}/add-all/${id}`, containers);
    }
    copyForm(formId: number): Observable<SpringApiResponse<PrintableFormDto>> {
        return this.http.post<SpringApiResponse<PrintableFormDto>>(`${this.apiUrl}/copy/${formId}`, {});
    }
    getPrimaryFormByType(permitType: PrintableFormType): Observable<SpringApiResponse<PrintableFormDto>> {
        return this.http.get<SpringApiResponse<PrintableFormDto>>(`${this.apiUrl}/get-primary-form-by-type/${permitType}`);
    }
    getSeedTypes(): Observable<SpringApiResponse<Record<string, string>>> {
        return this.http.get<SpringApiResponse<Record<string, string>>>(`${this.apiUrl}/seed-types`);
    }
    seedForm(formType: string, formName: string): Observable<SpringApiResponse<PrintableFormDto>> {
        return this.http.post<SpringApiResponse<PrintableFormDto>>(`${this.apiUrl}/seed`, { formType, formName });
    }

    // --- Maintenance (Admin -> Forms) ---

    /** Read-only health snapshot of THIS node's form tables. */
    diagnose(): Observable<SpringApiResponse<FormDiagnostics>> {
        return this.http.get<SpringApiResponse<FormDiagnostics>>(`${this.apiUrl}/maintenance/diagnose`);
    }

    /**
     * Soft-delete containers with no parent form. LOCAL ONLY — must be run on each machine,
     * because a row orphaned here may be correctly linked elsewhere.
     */
    repairOrphans(dryRun: boolean): Observable<SpringApiResponse<OrphanRepairResult>> {
        return this.http.post<SpringApiResponse<OrphanRepairResult>>(
            `${this.apiUrl}/maintenance/repair-orphans?dryRun=${dryRun}`, {});
    }

    /** Collapse each formType to one primary. DOES broadcast — run once, on the hub. */
    fixDuplicatePrimaries(dryRun: boolean): Observable<SpringApiResponse<DuplicatePrimaryResult>> {
        return this.http.post<SpringApiResponse<DuplicatePrimaryResult>>(
            `${this.apiUrl}/maintenance/fix-duplicate-primaries?dryRun=${dryRun}`, {});
    }
}

export interface DuplicatePrimaryPlan {
    formType: string;
    keepId: number;
    keepName: string;
    demoteIds: number[];
    demoteNames: string[];
}

export interface FormDiagnostics {
    totalForms: number;
    totalContainers: number;
    orphanedContainers: number;
    orphansByDevice: Record<string, number>;
    duplicatePrimaryTypes: number;
    duplicatePrimaries: DuplicatePrimaryPlan[];
}

export interface OrphanRepairResult {
    dryRun: boolean;
    orphanCount: number;
    orphansByDevice: Record<string, number>;
    sampleIds: number[];
    softDeleted: number;
}

export interface DuplicatePrimaryResult {
    dryRun: boolean;
    affectedTypes: number;
    plan: DuplicatePrimaryPlan[];
    demoted: number;
}