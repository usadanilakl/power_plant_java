import { Component } from '@angular/core';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import { RouterOutlet } from '@angular/router';
import { SpaceLeftMenuComponent } from '../../features/space/space-left-menu/space-left-menu.component';

@Component({
  selector: 'app-space-page',
  standalone: true,
  imports: [
    MainLayoutComponent,
    RouterMenuComponent,
    RouterOutlet,
    SpaceLeftMenuComponent
  ],
  templateUrl: './space-page.component.html',
  styleUrl: './space-page.component.css'
})
export class SpacePageComponent {

}