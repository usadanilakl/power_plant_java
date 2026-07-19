import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';

@Component({
  selector: 'app-sync-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, MatTabsModule, MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <nav mat-tab-nav-bar [tabPanel]="tabPanel">
          <a mat-tab-link
             routerLink="drift"
             routerLinkActive
             #rlaD="routerLinkActive"
             [active]="rlaD.isActive">
            Drift Center
          </a>
          <a mat-tab-link
             routerLink="activity"
             routerLinkActive
             #rla1="routerLinkActive"
             [active]="rla1.isActive">
            Activity
          </a>
          <a mat-tab-link
             routerLink="recovery"
             routerLinkActive
             #rla3="routerLinkActive"
             [active]="rla3.isActive">
            Recovery
          </a>
          <a mat-tab-link
             routerLink="sharepoint"
             routerLinkActive
             #rla4="routerLinkActive"
             [active]="rla4.isActive">
            SharePoint
          </a>
        </nav>
        <mat-tab-nav-panel #tabPanel>
          <router-outlet></router-outlet>
        </mat-tab-nav-panel>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class SyncDashboardComponent {}
