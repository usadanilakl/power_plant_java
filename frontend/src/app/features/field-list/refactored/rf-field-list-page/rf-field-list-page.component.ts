import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { RfFieldListStateService } from '../services/rf-field-list-state.service';
import { RfFieldListTableComponent } from '../rf-field-list-table/rf-field-list-table.component';
import { RfFieldListFormComponent } from '../rf-field-list-form/rf-field-list-form.component';
import { RfPopupProjectionComponent } from '../../../../shared/popup-projection/rf-popup-projection.component';
import { SpSyncToolbarComponent } from '../../../../shared/sp-sync-toolbar/sp-sync-toolbar.component';
import { MainLayoutComponent } from '../../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../../shared/menu/router-menu/router-menu.component';
import { FieldListItemDto } from '../../../../models/field-list/field-list-item.model';

@Component({
  selector: 'app-rf-field-list-page',
  standalone: true,
  imports: [
    MainLayoutComponent,
    RouterMenuComponent,
    RfFieldListTableComponent,
    RfFieldListFormComponent,
    RfPopupProjectionComponent,
    SpSyncToolbarComponent,
  ],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu></app-router-menu>
      </ng-container>
      <ng-container main-content>
    <div class="field-list-page">
      <div class="toolbar">
        <div class="list-type-tabs">
          <button [class.active]="!stateService.selectedListType()"
                  (click)="onListTypeChange(null)">All</button>
          <button [class.active]="stateService.selectedListType() === 'Insulation Removal'"
                  (click)="onListTypeChange('Insulation Removal')">Insulation Removal</button>
          <button [class.active]="stateService.selectedListType() === 'Leaks'"
                  (click)="onListTypeChange('Leaks')">Leaks</button>
          <button [class.active]="stateService.selectedListType() === 'Winterization'"
                  (click)="onListTypeChange('Winterization')">Winterization</button>
        </div>
        <div class="actions">
          <button class="btn-new" (click)="onNew()">+ New Item</button>
        </div>
      </div>

      <app-sp-sync-toolbar
        [entityType]="'FieldListItem'"
        [entityIds]="displayedIds()"
        (syncComplete)="onSyncComplete()">
      </app-sp-sync-toolbar>

      <app-rf-field-list-table
        (selectedItemsEvent)="onSelectedItems($event)"
        (rowDoubleClickedEvent)="onRowDoubleClicked($event)">
      </app-rf-field-list-table>

      @if (stateService.isFormOpen()) {
        <app-rf-popup-projection (close)="stateService.isFormOpen.set(false)">
          <app-rf-field-list-form></app-rf-field-list-form>
        </app-rf-popup-projection>
      }
    </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .field-list-page { display: flex; flex-direction: column; flex: 1; min-height: 0; gap: 8px; padding: 8px; overflow: hidden; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .list-type-tabs { display: flex; gap: 4px; }
    .list-type-tabs button { padding: 6px 12px; border: 1px solid var(--border-color, #ccc); border-radius: 4px;
      background: var(--surface, #fff); cursor: pointer; font-size: 13px; }
    .list-type-tabs button.active { background: var(--primary, #1976d2); color: white; border-color: var(--primary, #1976d2); }
    .btn-new { padding: 6px 16px; background: var(--primary, #1976d2); color: white; border: none;
      border-radius: 4px; cursor: pointer; font-size: 13px; }
  `]
})
export class RfFieldListPageComponent implements OnInit {
  stateService = inject(RfFieldListStateService);
  private route = inject(ActivatedRoute);

  displayedIds = toSignal(
    this.stateService.allItems$.pipe(
      map(items => items.map(i => i.id).filter((id): id is number => id != null))
    ),
    { initialValue: [] as number[] }
  );

  ngOnInit(): void {
    const listType = this.route.snapshot.paramMap.get('listType');
    if (listType) {
      this.stateService.loadByListType(decodeURIComponent(listType));
    } else {
      this.stateService.loadAll();
    }
  }

  onListTypeChange(listType: string | null): void {
    this.stateService.loadByListType(listType);
  }

  onRowDoubleClicked(item: FieldListItemDto): void {
    this.stateService.loadItemById(item.id);
    this.stateService.isFormOpen.set(true);
  }

  onSelectedItems(items: FieldListItemDto[]): void {
    this.stateService.selectedItems.set(items);
    if (items.length === 1) {
      this.stateService.selectedItem.set(items[0]);
    }
  }

  onNew(): void {
    this.stateService.openNewForm();
  }

  onSyncComplete(): void {
    this.stateService.loadAll();
  }
}
