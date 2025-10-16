import { inject, Injectable } from "@angular/core";
import { WorkRequest } from "../../models/permits/work-request.model";
import { PowerAutomateService } from "../../services/power-automate.service";
import { PowerAutomateRequest } from "../../models/api/power-automate-request.model";
import { WorkRequestPa } from "../../models/permits/work-request-pa.model";

@Injectable({
  providedIn: 'root'
})
export class WorkRequestApiService {

  powerAutomateService = inject(PowerAutomateService);

  constructor() { }

  submitFormToSharepoint(workRequest: WorkRequest) {
    const request: PowerAutomateRequest<WorkRequestPa> = {
      url: '', // Use default URL from PowerAutomateService
      data: new WorkRequest(workRequest).convertToPaModel(),
      entityKey: 'workForm',
      actionType: 'save'
    };

    return this.powerAutomateService.submitForm(request);
  }

}