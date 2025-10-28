import { Component } from '@angular/core';
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menus/router-menu/router-menu.component";
import { AuthComponent } from "../../auth/auth.component";

@Component({
  selector: 'app-login-page',
  imports: [MainLayoutComponent, RouterMenuComponent, AuthComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css'
})
export class LoginPageComponent {

}
