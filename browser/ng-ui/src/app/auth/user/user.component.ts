import { Component } from '@angular/core';
import { UserFormComponent } from "./user-form/user-form.component";

@Component({
  selector: 'app-user',
  imports: [UserFormComponent],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent {

}
