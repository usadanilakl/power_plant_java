
import { Component, input } from '@angular/core';
import { RouterMenuItems } from '../../../models/ui/router-menu.model';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-router-menu',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './router-menu.component.html',
  styleUrl: './router-menu.component.css'
})
export class RouterMenuComponent {
  menuItems = input<RouterMenuItems>();
  layout = input<'column' | 'row'>('column'); // Default to column layout
}