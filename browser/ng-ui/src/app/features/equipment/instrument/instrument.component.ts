import { Component } from '@angular/core';
import { InstrumentLogFormComponent } from "./instrument-log/instrument-log-form/instrument-log-form.component";
import { InstrumentLogTableComponent } from "./instrument-log/instrument-log-table/instrument-log-table.component";

@Component({
  selector: 'app-instrument',
  imports: [InstrumentLogFormComponent, InstrumentLogTableComponent],
  templateUrl: './instrument.component.html',
  styleUrl: './instrument.component.css'
})
export class InstrumentComponent {

}
