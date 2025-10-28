import { Component } from '@angular/core';
import { UserTableComponent } from "../user-table/user-table.component";

@Component({
  selector: 'app-user-left-menu',
  imports: [UserTableComponent],
  templateUrl: './user-left-menu.component.html',
  styleUrl: './user-left-menu.component.css'
})
export class UserLeftMenuComponent {

}
