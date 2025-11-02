import { Component } from '@angular/core';
import { InstrumentTableComponent } from "../instrument-table/instrument-table.component";

@Component({
  selector: 'app-instrument-side-menu',
  imports: [InstrumentTableComponent],
  templateUrl: './instrument-side-menu.component.html',
  styleUrl: './instrument-side-menu.component.css'
})
export class InstrumentSideMenuComponent {

}
