import { Component } from '@angular/core';
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menus/router-menu/router-menu.component";
import { UserLeftMenuComponent } from "../../auth/user/user-left-menu/user-left-menu.component";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-user-page',
  imports: [MainLayoutComponent, RouterMenuComponent, UserLeftMenuComponent, RouterOutlet],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.css'
})
export class UserPageComponent {

}
