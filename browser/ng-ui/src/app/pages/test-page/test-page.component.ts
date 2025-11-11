import { Component } from '@angular/core';
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menus/router-menu/router-menu.component";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-test-page',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, RouterOutlet],
  templateUrl: './test-page.component.html',
  styleUrl: './test-page.component.css'
})
export class TestPageComponent {

}
