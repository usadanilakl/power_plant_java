import { Component, input } from '@angular/core';
import { LotoPointAction } from '../../../../models/permits/loto/loto-point-action.model';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-loto-point-action',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './loto-point-action.component.html',
  styleUrl: './loto-point-action.component.css'
})
export class LotoPointActionComponent {
  action = input<LotoPointAction>(new LotoPointAction()  );


}
