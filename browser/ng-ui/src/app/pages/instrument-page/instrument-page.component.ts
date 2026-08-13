import { Component } from '@angular/core';
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menus/router-menu/router-menu.component";
import { RouterOutlet } from "@angular/router";

/**
 * Shell for the Instrumentation section. The side menu is gone: it held a second copy of the whole
 * instrument table (rendered even while collapsed on a phone), duplicating the list that is now the
 * main screen.
 */
@Component({
  selector: 'app-instrument-page',
  imports: [MainLayoutComponent, RouterMenuComponent, RouterOutlet],
  templateUrl: './instrument-page.component.html',
  styleUrl: './instrument-page.component.css'
})
export class InstrumentPageComponent {

}
