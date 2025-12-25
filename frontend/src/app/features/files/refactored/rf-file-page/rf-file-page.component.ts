
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MainLayoutComponent } from '../../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../../shared/menu/router-menu/router-menu.component';
import { RfPopupProjectionComponent } from '../../../../shared/popup-projection/rf-popup-projection.component';
import { RfFileStateService } from '../services/rf-file-state.service';
import { RfFileFormComponent } from '../rf-file-form/rf-file-form.component';
import { RfFileLeftMenuComponent } from '../rf-file-left-menu/rf-file-left-menu.component';

@Component({
  selector: 'app-rf-file-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MainLayoutComponent,
    RouterMenuComponent,
    RfFileLeftMenuComponent,
    RfPopupProjectionComponent,
    RfFileFormComponent,
  ],
  templateUrl: './rf-file-page.component.html',
  styleUrl: './rf-file-page.component.css',
})
export class RfFilePageComponent {
  stateService = inject(RfFileStateService);
}
