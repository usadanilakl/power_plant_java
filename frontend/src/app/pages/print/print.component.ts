import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-print',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: `./print.component.html`,
  styles: [`
    .print-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 20px;
    }
  `]
})
export class PrintComponent{

}