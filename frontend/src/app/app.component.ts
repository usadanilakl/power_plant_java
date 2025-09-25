import { Component } from '@angular/core';
import { MainLayoutComponent } from './layout/main-layout.component';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { PrintLayoutComponent } from "./features/form-designer/printable-form/print-layout/print-layout.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainLayoutComponent, PrintLayoutComponent],
  templateUrl: './app.component.html',
  // template: '<app-main-layout></app-main-layout>',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(public route: ActivatedRoute) {}
  title = 'Jackson';
}
