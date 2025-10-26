import { inject, Injectable } from "@angular/core";
import { PowerAutomateService } from "../../services/power-automate.service";
import { PowerAutomateRequest } from "../../models/api/power-automate-request.model";
import { User } from "../../models/auth/user.model";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UserApiService {

  powerAutomateService = inject(PowerAutomateService);

  constructor() { }

  createUser(user: User): Observable<any> {
    console.log('Creating user via Power Automate:', user);
    const request: PowerAutomateRequest<User> = {
      url: '', // Use default URL from PowerAutomateService for users
      workForm: new User(user),
      actionType: 'save'
    };
    console.log('Request:', request);
    return this.powerAutomateService.submitForm(request);
  }

  updateUser(user: User): Observable<any> {
    console.log('Updating user via Power Automate:', user);
    const request: PowerAutomateRequest<User> = {
      url: '', // Use default URL from PowerAutomateService for users
      workForm: new User(user),
      actionType: 'save'
    };
    console.log('Request:', request);
    return this.powerAutomateService.submitForm(request);
  }

  deleteUser(user: User): Observable<any> {
    const request: PowerAutomateRequest<User> = {
      id: user.id.toString(),
      actionType: 'delete' // Assuming 'delete' is the action for deletion
    };
    return this.powerAutomateService.submitForm(request);
  }
}