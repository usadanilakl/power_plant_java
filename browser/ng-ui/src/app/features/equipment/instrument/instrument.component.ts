import { Component } from '@angular/core';
import { InstrumentLogFormComponent } from "./instrument-log/instrument-log-form/instrument-log-form.component";

@Component({
  selector: 'app-instrument',
  imports: [InstrumentLogFormComponent],
  templateUrl: './instrument.component.html',
  styleUrl: './instrument.component.css'
})
export class InstrumentComponent {

}
