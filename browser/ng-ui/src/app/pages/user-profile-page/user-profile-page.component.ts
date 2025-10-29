import { Component } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { UserStateService } from '../../auth/user/user-state.service';
import { UserFormComponent } from "../../auth/user/user-form/user-form.component";
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menus/router-menu/router-menu.component";

@Component({
  selector: 'app-user-profile-page',
  imports: [UserFormComponent, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './user-profile-page.component.html',
  styleUrl: './user-profile-page.component.css'
})
export class UserProfilePageComponent {

  constructor(
    private authService: AuthService,
    private userStateService: UserStateService,
  ) { 
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userStateService.selectUser(user);
      }
    });
  }

}
