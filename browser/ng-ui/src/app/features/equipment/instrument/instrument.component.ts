import { Component } from '@angular/core';
import { InstrumentFormComponent } from "./instrument-form/instrument-form.component";

@Component({
  selector: 'app-instrument',
  imports: [InstrumentFormComponent],
  templateUrl: './instrument.component.html',
  styleUrl: './instrument.component.css'
})
export class InstrumentComponent {

}
