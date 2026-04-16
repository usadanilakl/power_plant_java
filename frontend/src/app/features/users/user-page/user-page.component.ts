import { Component, OnInit, inject } from '@angular/core';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { RfPopupProjectionComponent } from '../../../shared/popup-projection/rf-popup-projection.component';
import { UserTableComponent } from '../user-table/user-table.component';
import { UserDetailFormComponent } from '../user-detail-form/user-detail-form.component';
import { RfUserStateService } from '../services/rf-user-state.service';
import { UserDto } from '../../../models/user.model';

@Component({
  selector: 'app-user-page',
  standalone: true,
  imports: [
    MainLayoutComponent,
    RouterMenuComponent,
    UserTableComponent,
    UserDetailFormComponent,
    RfPopupProjectionComponent,
  ],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="content-area">
          <div class="toolbar">
            <div class="actions">
              <button class="btn-action btn-new" (click)="onNew()">+ New User</button>
              <button class="btn-action btn-seed" (click)="onSeed()">Seed Plant Users</button>
            </div>
          </div>

          <app-user-table
            (selectedItemsEvent)="onSelectedItems($event)">
          </app-user-table>

          @if (stateService.isFormOpen()) {
            <app-rf-popup-projection [isOpen]="true" (close)="stateService.closeForm()">
              <app-user-detail-form></app-user-detail-form>
            </app-rf-popup-projection>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .content-area {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }
    .toolbar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      margin-bottom: 0.5rem;
    }
    .actions { display: flex; gap: 4px; }
    .btn-action {
      padding: 6px 16px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--card-background);
      color: var(--primary-text);
      cursor: pointer;
      font-size: 13px;
    }
    .btn-action:hover { background: var(--hover-background); }
    .btn-new {
      background: var(--accent-color);
      color: var(--header-text);
      border-color: var(--accent-color);
    }
    .btn-new:hover { opacity: 0.9; }
    .btn-seed {
      background: #e67e22;
      color: white;
      border-color: #e67e22;
    }
    .btn-seed:hover { opacity: 0.9; }
    app-user-table {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
  `]
})
export class UserPageComponent implements OnInit {
  stateService = inject(RfUserStateService);

  ngOnInit(): void {
    this.stateService.loadAll();
  }

  onNew(): void {
    this.stateService.openNewForm();
  }

  onSeed(): void {
    this.stateService.seedPlantUsers();
  }

  onSelectedItems(items: UserDto[]): void {
    if (items.length === 1) {
      // Single click selection - no form open, just track
    }
  }
}
