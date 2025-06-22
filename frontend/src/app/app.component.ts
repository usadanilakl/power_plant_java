import { Component } from '@angular/core';
import { MainLayoutComponent } from './layout/main-layout.component';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainLayoutComponent],
  templateUrl: './app.component.html',
  // template: '<app-main-layout></app-main-layout>',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(public route: ActivatedRoute) {}
  title = 'frontend';
}
