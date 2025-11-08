import { Component } from '@angular/core';
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menus/router-menu/router-menu.component";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-loto-page',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, RouterOutlet],
  templateUrl: './loto-page.component.html',
  styleUrl: './loto-page.component.css'
})
export class LotoPageComponent {

}
