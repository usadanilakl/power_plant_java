import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { InstrumentLogEntry } from "../../../../models/equipment/instrument-log.model";
import { SubmissionOrchestratorService, SubmissionResult } from "../../../../services/submission-orchestrator.service";

@Injectable({
  providedIn: 'root'
})
export class InstrumentLogEntryApiService {

  private orchestrator = inject(SubmissionOrchestratorService);

  /**
   * Submit instrument log entry via the orchestrator (Server → PA V1 → Email fallback).
   */
  createLog(entry: InstrumentLogEntry): Observable<SubmissionResult> {
    return this.orchestrator.submitInstrumentLog(entry);
  }
}
