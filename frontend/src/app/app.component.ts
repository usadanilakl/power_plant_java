import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainLayoutComponent],
  // templateUrl: './app.component.html',
  template: '<app-main-layout></app-main-layout>',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
}
