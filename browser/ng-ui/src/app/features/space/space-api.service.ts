import { inject, Injectable } from "@angular/core";
import { Space } from "../../models/permits/space.model";
import { PowerAutomateService } from "../../services/power-automate.service";
import { PowerAutomateRequest } from "../../models/api/power-automate-request.model";
import { SpacePa } from "../../models/permits/space-pa.model";

@Injectable({
  providedIn: 'root'
})
export class SpaceApiService {

  powerAutomateService = inject(PowerAutomateService);

  constructor() { }

  submitFormToSharepoint(space: Space) {

    console.log('Submitting space to Sharepoint:', space);
    const request: PowerAutomateRequest<SpacePa> = {
      url: '', // Use default URL from PowerAutomateService
      workForm: new Space(space).convertToPaModel(),
      actionType: 'save'
    };
    console.log('Request:', request);

    return this.powerAutomateService.submitForm(request);
  }

  revokeRequestOnSharepoint(space: Space) {
    const request: PowerAutomateRequest<SpacePa> = {
      id: space.sharepointId,
      actionType: 'revoke'
    };

    return this.powerAutomateService.submitForm(request);
  }

}