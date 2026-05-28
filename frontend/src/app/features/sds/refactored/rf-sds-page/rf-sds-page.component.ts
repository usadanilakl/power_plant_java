import { Component, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { RfSdsStateService } from '../services/rf-sds-state.service';
import { RfSdsTableComponent } from '../rf-sds-table/rf-sds-table.component';
import { RfSdsFormComponent } from '../rf-sds-form/rf-sds-form.component';
import { RfSdsDetailDialogComponent } from '../rf-sds-detail-dialog/rf-sds-detail-dialog.component';
import { RfPopupProjectionComponent } from '../../../../shared/popup-projection/rf-popup-projection.component';
import { SpSyncToolbarComponent } from '../../../../shared/sp-sync-toolbar/sp-sync-toolbar.component';
import { MainLayoutComponent } from '../../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../../shared/menu/router-menu/router-menu.component';
import { SdsChemicalDto } from '../../../../models/sds/sds-chemical.model';

@Component({
  selector: 'app-rf-sds-page',
  standalone: true,
  imports: [
    MainLayoutComponent,
    RouterMenuComponent,
    RfSdsTableComponent,
    RfSdsFormComponent,
    RfSdsDetailDialogComponent,
    RfPopupProjectionComponent,
    SpSyncToolbarComponent,
  ],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="content-area">
          <div class="toolbar">
            <div class="list-type-tabs">
              <button [class.active]="!stateService.selectedStatus()"
                      (click)="onStatusChange(null)">All</button>
              <button [class.active]="stateService.selectedStatus() === 'Incoming'"
                      (click)="onStatusChange('Incoming')">Incoming</button>
              <button [class.active]="stateService.selectedStatus() === 'Pending'"
                      (click)="onStatusChange('Pending')">Pending</button>
              <button [class.active]="stateService.selectedStatus() === 'Filed'"
                      (click)="onStatusChange('Filed')">Filed</button>
              <button [class.active]="stateService.selectedStatus() === 'Removed'"
                      (click)="onStatusChange('Removed')">Removed</button>
            </div>
            <div class="actions">
              <label class="btn-action btn-dump">
                @if (dumping()) { Uploading... } @else { Dump PDFs }
                <input type="file" hidden multiple accept="application/pdf,.pdf" (change)="onDumpPdfs($event)">
              </label>
              <button class="btn-action btn-new" (click)="onNew()">+ New Chemical</button>
            </div>
          </div>

          <app-sp-sync-toolbar
            [entityType]="'SdsChemical'"
            [entityIds]="displayedIds()"
            (syncComplete)="onSyncComplete()">
          </app-sp-sync-toolbar>

          <app-rf-sds-table
            (selectedItemsEvent)="onSelectedItems($event)">
          </app-rf-sds-table>

          @if (stateService.isFormOpen()) {
            <app-rf-popup-projection [isOpen]="true" (close)="stateService.isFormOpen.set(false)">
              <app-rf-sds-form></app-rf-sds-form>
            </app-rf-popup-projection>
          }

          @if (stateService.isDetailOpen()) {
            <app-rf-sds-detail-dialog
              [item]="stateService.detailItem()!"
              (close)="stateService.closeDetail()"
              (edit)="onEditFromDetail($event)"
              (deleted)="stateService.closeDetail()">
            </app-rf-sds-detail-dialog>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .content-area { display: flex; flex-direction: column; flex: 1; min-height: 0; height: 100%; overflow: hidden; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 8px;
      flex-shrink: 0; margin-bottom: 0.5rem; }
    .list-type-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
    .list-type-tabs button { padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 13px; }
    .list-type-tabs button.active { background: var(--accent-color); color: var(--header-text); border-color: var(--accent-color); }
    .list-type-tabs button:hover:not(.active) { background: var(--hover-background); }
    .actions { display: flex; gap: 4px; }
    .btn-action { padding: 6px 16px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 13px; }
    .btn-action:hover:not(:disabled) { background: var(--hover-background); }
    .btn-new { background: var(--accent-color); color: var(--header-text); border-color: var(--accent-color); }
    .btn-new:hover { opacity: 0.9; }
    .btn-dump { display: inline-flex; align-items: center; }
    app-rf-sds-table { flex: 1 1 auto; display: flex; flex-direction: column;
      min-height: 0; overflow: hidden; }
  `]
})
export class RfSdsPageComponent implements OnInit {
  stateService = inject(RfSdsStateService);
  private route = inject(ActivatedRoute);

  private selectedItems: SdsChemicalDto[] = [];
  dumping = signal(false);

  displayedIds = toSignal(
    this.stateService.allItems$.pipe(
      map(items => items.map(i => i.id).filter((id): id is number => id != null))
    ),
    { initialValue: [] as number[] }
  );

  ngOnInit(): void {
    const status = this.route.snapshot.paramMap.get('status');
    if (status) {
      this.stateService.loadByStatus(decodeURIComponent(status));
    } else {
      this.stateService.loadAll();
    }
  }

  onStatusChange(status: string | null): void { this.stateService.loadByStatus(status); }

  onSelectedItems(items: SdsChemicalDto[]): void {
    this.selectedItems = items;
    this.stateService.selectedItems.set(items);
  }

  /** Admin bulk dump: read selected PDFs to base64 and create one Incoming chemical each. */
  onDumpPdfs(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.dumping.set(true);
    const files = Array.from(input.files);
    const payloads: { fileName: string; contentType: string; base64Content: string }[] = [];
    let remaining = files.length;
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        payloads.push({ fileName: file.name, contentType: file.type || 'application/pdf', base64Content: base64 });
        if (--remaining === 0) {
          this.stateService.dumpPdfs(payloads);
          this.dumping.set(false);
        }
      };
      reader.onerror = () => { if (--remaining === 0) this.dumping.set(false); };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  onNew(): void { this.stateService.openNewForm(); }

  onEditFromDetail(item: SdsChemicalDto): void {
    this.stateService.closeDetail();
    this.stateService.openProcessForm(item);
  }

  onSyncComplete(): void { this.stateService.loadAll(); }
}
