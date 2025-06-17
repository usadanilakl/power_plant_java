import { Component } from '@angular/core';
import { NewFileTableComponent } from "./new-file-table/new-file-table.component";

@Component({
  selector: 'app-new-file',
  imports: [NewFileTableComponent],
  templateUrl: './new-file.component.html',
  styleUrl: './new-file.component.css'
})
export class NewFileComponent {

}
