import { Component } from '@angular/core';
import { TagNumberTableComponent } from "../../features/tag-number/tag-number-table/tag-number-table.component";

@Component({
  selector: 'app-tag-number',
  standalone: true,
  imports: [TagNumberTableComponent],
  templateUrl: './tag-number.component.html',
  styleUrl: './tag-number.component.css'
})
export class TagNumberComponent {

}
