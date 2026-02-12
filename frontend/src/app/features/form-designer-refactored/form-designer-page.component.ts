import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';
import { LeftMenuOutletComponent } from '../../shared/left-menu-outlet/left-menu-outlet.component';

@Component({
  selector: 'app-form-designer-page',
  standalone: true,
  imports: [RouterMenuComponent, MainLayoutComponent, LeftMenuOutletComponent, RouterModule],
  template: `
    <app-main-layout [isSideMenuEnabled]="true">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container left-menu>
        <app-left-menu-outlet></app-left-menu-outlet>
      </ng-container>
      <ng-container main-content>
        <router-outlet></router-outlet>
      </ng-container>
    </app-main-layout>
  `,
})
export class FormDesignerPageComponent {}
