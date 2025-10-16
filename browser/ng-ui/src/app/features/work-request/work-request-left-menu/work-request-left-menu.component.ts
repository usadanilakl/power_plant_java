import { Component } from '@angular/core';
import { WorkRequestTableComponent } from "../work-request-table/work-request-table.component";

@Component({
  selector: 'app-work-request-left-menu',
  imports: [WorkRequestTableComponent],
  templateUrl: './work-request-left-menu.component.html',
  styleUrl: './work-request-left-menu.component.css'
})
export class WorkRequestLeftMenuComponent {

}
