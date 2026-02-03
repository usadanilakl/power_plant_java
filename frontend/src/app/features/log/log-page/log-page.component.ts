import { Component } from '@angular/core';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-log-page',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, RouterOutlet],
  templateUrl: './log-page.component.html',
  styleUrl: './log-page.component.css',
})
export class LogPageComponent {}
