import { Component } from '@angular/core';
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menus/router-menu/router-menu.component";
import { InstrumentSideMenuComponent } from "../../features/equipment/instrument/instrument-side-menu/instrument-side-menu.component";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-instrument-page',
  imports: [MainLayoutComponent, RouterMenuComponent, InstrumentSideMenuComponent, RouterOutlet],
  templateUrl: './instrument-page.component.html',
  styleUrl: './instrument-page.component.css'
})
export class InstrumentPageComponent {

}
