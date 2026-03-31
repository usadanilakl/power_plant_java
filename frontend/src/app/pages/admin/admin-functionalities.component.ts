import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';

@Component({
  selector: 'app-admin-functionalities',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, MatTabsModule, MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="admin-header">
          <h2>Admin Functionalities</h2>
          <div class="quick-links">
            <a routerLink="category-values" class="nav-btn">Category & Value Manager</a>
            <a routerLink="work-category-profiles" class="nav-btn">Work Category Profiles</a>
          </div>
        </div>
        <nav mat-tab-nav-bar [tabPanel]="tabPanel">
          <a mat-tab-link
             routerLink="files"
             routerLinkActive
             #rla0="routerLinkActive"
             [active]="rla0.isActive">
            Files
          </a>
          <a mat-tab-link
             routerLink="loto"
             routerLinkActive
             #rla1="routerLinkActive"
             [active]="rla1.isActive">
            LOTO
          </a>
          <a mat-tab-link
             routerLink="sync"
             routerLinkActive
             #rla2="routerLinkActive"
             [active]="rla2.isActive">
            Sync
          </a>
          <a mat-tab-link
             routerLink="sharepoint"
             routerLinkActive
             #rla3="routerLinkActive"
             [active]="rla3.isActive">
            SharePoint
          </a>
          <a mat-tab-link
             routerLink="forms"
             routerLinkActive
             #rla4="routerLinkActive"
             [active]="rla4.isActive">
            Forms
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
    .admin-header {
      padding: 20px 20px 0;
      max-width: 1200px;
      margin: 0 auto;
    }
    .admin-header h2 {
      color: #333;
      margin-bottom: 15px;
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
    }
    .quick-links {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }
    .nav-btn {
      display: inline-block;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      text-decoration: none;
      background-color: #28a745;
      color: white;
      transition: background-color 0.2s;
    }
    .nav-btn:hover {
      background-color: #218838;
    }
  `]
})
export class AdminFunctionalitiesComponent {}
