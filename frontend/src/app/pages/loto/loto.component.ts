import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LotoPointTableComponent } from "../../features/loto-points/loto-point-table/loto-point-table.component";

@Component({
  selector: 'app-loto',
  standalone: true,
  imports: [CommonModule, RouterModule, LotoPointTableComponent],
  templateUrl: './loto.component.html',
  styleUrl: './loto.component.css'
})
export class LotoComponent {
  categories = [
    { name: 'LOTO', route: './loto' },
    { name: 'Active LOTO Points', route: './loto-points-active' },
    { name: 'All LOTO Points', route: './loto-points' },
    { name: 'LOTO Boxes', route: './loto-boxes' },
    { name: 'Locks', route: './locks' }
  ];
}
