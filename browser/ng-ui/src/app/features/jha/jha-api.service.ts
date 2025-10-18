import { inject, Injectable } from "@angular/core";
import { PowerAutomateService } from "../../services/power-automate.service";
import { Jha } from "../../models/permits/jha.model";
import { PowerAutomateRequest } from "../../models/api/power-automate-request.model";
import { JhaPa } from "../../models/permits/jha-pa.model";


@Injectable({
  providedIn: 'root'
})
export class JhaApiService {

  powerAutomateService = inject(PowerAutomateService);

  constructor() { }

  submitFormToSharepoint(jha: Jha) {
    console.log('Submitting JHA to Sharepoint:', jha);
    const request: PowerAutomateRequest<JhaPa> = {
      url: '', // Use default URL from PowerAutomateService
      workForm: new Jha(jha).convertToPaModel(),
      actionType: 'save'
    };
    console.log('Request:', request);

    return this.powerAutomateService.submitForm(request);
  }

  revokeRequestOnSharepoint(jha: Jha) {
    const request: PowerAutomateRequest<JhaPa> = {
      id: jha.sharepointId,
      actionType: 'revoke'
    };

    return this.powerAutomateService.submitForm(request);
  }
}