import { Component, OnInit, inject } from '@angular/core';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';
import { WorkAreaMapComponent } from '../../features/permit-builder/work-area/work-area-map/work-area-map.component';
import { WorkAreaMapLeftMenuComponent } from '../../features/permit-builder/work-area/work-area-map/work-area-map-left-menu.component';
import { WorkAreaMapStateService } from '../../features/permit-builder/work-area/work-area-map/work-area-map-state.service';

@Component({
  selector: 'app-work-area-map-page',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, WorkAreaMapComponent, WorkAreaMapLeftMenuComponent],
  providers: [WorkAreaMapStateService],
  template: `
    <app-main-layout [isSideMenuEnabled]="true" [isBottomMenuEnabled]="false">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container left-menu>
        <app-work-area-map-left-menu></app-work-area-map-left-menu>
      </ng-container>
      <ng-container main-content>
        <app-work-area-map></app-work-area-map>
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
export class WorkAreaMapPageComponent implements OnInit {
  private state = inject(WorkAreaMapStateService);

  ngOnInit(): void {
    this.state.loadAll();
  }
}
