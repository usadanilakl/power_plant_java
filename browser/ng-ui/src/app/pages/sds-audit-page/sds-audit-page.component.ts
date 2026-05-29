import { Component } from '@angular/core';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-sds-audit-page',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, RouterOutlet],
  template: `
    <app-main-layout [isBottomMenuEnabled]="false" [isSideMenuEnabled]="false">
      <ng-container header>
        <div class="header-menus">
          <div class="menu-container">
            <app-router-menu [layout]="'row'"></app-router-menu>
          </div>
        </div>
      </ng-container>
      <ng-container main-content>
        <router-outlet></router-outlet>
      </ng-container>
    </app-main-layout>
  `
})
export class SdsAuditPageComponent {}
