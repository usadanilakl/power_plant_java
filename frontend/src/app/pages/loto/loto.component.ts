import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-loto',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './loto.component.html',
  styleUrl: './loto.component.css'
})
export class LotoComponent {
  categories = [
    { name: 'LOTO', route: './loto' },
    { name: 'LOTO Points', route: './loto-points' },
    { name: 'LOTO Boxes', route: './loto-boxes' },
    { name: 'Locks', route: './locks' }
  ];
}
