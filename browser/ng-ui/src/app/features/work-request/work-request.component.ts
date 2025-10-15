import { Component } from '@angular/core';
import { WorkRequestFormComponent } from "./work-request-form/work-request-form.component";

@Component({
  selector: 'app-work-request',
  imports: [WorkRequestFormComponent],
  templateUrl: './work-request.component.html',
  styleUrl: './work-request.component.css'
})
export class WorkRequestComponent {

}
