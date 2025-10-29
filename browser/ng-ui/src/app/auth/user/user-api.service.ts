import { inject, Injectable } from "@angular/core";
import { PowerAutomateService } from "../../services/power-automate.service";
import { PowerAutomateRequest } from "../../models/api/power-automate-request.model";
import { User } from "../../models/auth/user.model";
import { Observable } from "rxjs";
import { UserPa } from "../../models/auth/user-pa.model";

@Injectable({
  providedIn: 'root'
})
export class UserApiService {

  powerAutomateService = inject(PowerAutomateService);

  private usersUrl = 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/832a87fa6bd042459fbb042c2163f25a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=CskQMxLQfynMFCI7AxUQtQWVIzVmkTydg9dxDN1-1M4';
  
  constructor() { }

  createUser(user: User): Observable<any> {
    console.log('Creating user via Power Automate:', user);
    const request: PowerAutomateRequest<User> = {
      url: this.usersUrl,
      workForm: new User(user),
      actionType: 'save'
    };
    console.log('Request:', request);
    return this.powerAutomateService.submitForm(request);
  }

  updateUser(user: User): Observable<any> {
    console.log('Updating user via Power Automate:', user);
    const request: PowerAutomateRequest<UserPa> = {
      url: this.usersUrl,
      user: new User(user).convertToPaModel(),
      actionType: 'save'
    };
    console.log('Request:', request);
    return this.powerAutomateService.submitForm(request);
  }

  deleteUser(user: User): Observable<any> {
    const request: PowerAutomateRequest<User> = {
      url: this.usersUrl,
      id: user.id.toString(),
      actionType: 'delete'
    };
    return this.powerAutomateService.submitForm(request);
  }

  authenticateUser(username: string, password: string): Observable<any> {
    const request: PowerAutomateRequest<any> = {
      url: this.usersUrl,
      actionType: 'authenticate',
      email: username,
      password: password
    };
    return this.powerAutomateService.submitForm(request);
  }
  getUsers(): Observable<any> {
    const request: PowerAutomateRequest<any> = {
      url: this.usersUrl,
      actionType: 'getAll'
    };
    return this.powerAutomateService.submitForm(request);
  }

  
}