import { Component } from '@angular/core';
import { MainLayoutComponent } from "../../../../layout/refactored/main-layout.component";
import { RouterMenuComponent } from "../../../../shared/menu/router-menu/router-menu.component";
import { RfLotoPointLeftMenuComponent } from "../rf-loto-point-left-menu/rf-loto-point-left-menu.component";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-rf-loto-point-page',
  imports: [MainLayoutComponent, RouterMenuComponent, RfLotoPointLeftMenuComponent, RouterOutlet],
  templateUrl: './rf-loto-point-page.component.html',
  styleUrl: './rf-loto-point-page.component.css'
})
export class RfLotoPointPageComponent {

}
