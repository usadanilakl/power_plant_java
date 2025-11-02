import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { PowerAutomateService } from "../../../../services/power-automate.service";
import { InstrumentLogEntry } from "../../../../models/equipment/instrument-log.model";
import { PowerAutomateRequest } from "../../../../models/api/power-automate-request.model";

@Injectable({
  providedIn: 'root'
})
export class InstrumentLogEntryApiService {

  powerAutomateService = inject(PowerAutomateService);

  private usersUrl = 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/832a87fa6bd042459fbb042c2163f25a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=CskQMxLQfynMFCI7AxUQtQWVIzVmkTydg9dxDN1-1M4';
  
  constructor() { }

  createLog(entry: InstrumentLogEntry): Observable<any> {
    console.log('Creating user via Power Automate:', entry);
    const request: PowerAutomateRequest<InstrumentLogEntry> = {
      url: this.usersUrl,
      instrumentationLog: entry,
      actionType: 'addInstrumentationLog'
    };
    console.log('Request:', request);
    return this.powerAutomateService.submitForm(request);
  }

  
}