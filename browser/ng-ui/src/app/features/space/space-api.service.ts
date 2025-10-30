import { inject, Injectable } from "@angular/core";
import { Space } from "../../models/permits/space.model";
import { PowerAutomateService } from "../../services/power-automate.service";
import { PowerAutomateRequest } from "../../models/api/power-automate-request.model";
import { SpacePa, SpacePaOutgoing } from "../../models/permits/space-pa.model";
import { SpaceTestResult } from "../../models/permits/space-test-result.model";

@Injectable({
  providedIn: 'root'
})
export class SpaceApiService {

  powerAutomateService = inject(PowerAutomateService);

  private spacesUrl = 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3c104b79651e4282b15e8e525c09b8d8/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XwnggyNeW4DxeNek7SdGIJEJpsxP9aocJKbgs51APC4';

  constructor() { }

  submitFormToSharepoint(space: Space) {

    console.log('Submitting space to Sharepoint:', space);
    console.log('Space to submit:', space);
    const spacePaOutgoing = new Space(space).convertToPaOutgoingModel();
    console.log('space to submit: ', spacePaOutgoing)
    spacePaOutgoing.Status = 'Inactive'
    const request: PowerAutomateRequest<SpacePaOutgoing> = {
      url: this.spacesUrl,
      space: spacePaOutgoing,
      actionType: 'create'
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
  getSpaces() {
    const request: PowerAutomateRequest<any> = {
      actionType: 'getAll',
      url: this.spacesUrl
    }
    return this.powerAutomateService.submitForm(request);
  }
  submitTestResultsToSharepoint(spaceTestResult: SpaceTestResult) {
    const request: PowerAutomateRequest<any> = {
      actionType: 'newTest',
      url: this.spacesUrl,
      spaceTestResult: spaceTestResult
    }
    return this.powerAutomateService.submitForm(request);
  }

}