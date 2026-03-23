import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';

@Component({
  selector: 'app-diagram-builder-page',
  standalone: true,
  imports: [RouterMenuComponent, MainLayoutComponent, RouterModule],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <router-outlet></router-outlet>
      </ng-container>
    </app-main-layout>
  `,
})
export class DiagramBuilderPageComponent {}
