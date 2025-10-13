import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menus/router-menu/router-menu.component";
import { JhaLeftMenuComponent } from "../../features/jha/jha-left-menu/jha-left-menu.component";

@Component({
  selector: 'app-jha-page',
  standalone: true,
  imports: [RouterModule, MainLayoutComponent, RouterMenuComponent, JhaLeftMenuComponent],
  templateUrl: './jha-page.component.html',
  styleUrl: './jha-page.component.css'
})
export class JhaPageComponent {

}
