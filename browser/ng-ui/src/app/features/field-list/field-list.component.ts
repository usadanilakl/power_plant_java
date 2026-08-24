import { ActivatedRoute } from '@angular/router';
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ServerApiService } from '../../services/server-api.service';
import { ServerStatusService } from '../../services/server-status.service';
import { SubmissionOrchestratorService } from '../../services/submission-orchestrator.service';
import { UserSetupService } from '../../services/user-setup.service';
import { GlobalMessageService } from '../../services/global-message.service';
import { AuthService } from '../../auth/auth.service';
import { ReactiveFormComponent } from '../../shared/forms/reactive-form/reactive-form.component';
import { FormField } from '../../models/inputs/form-field.model';
import { fieldListFormFields } from '../../models/field-list/field-list-item.model';
import { Option } from '../../models/inputs/option.model';
import { SupabaseDataService } from '../../services/supabase-data.service';

type ViewMode = 'select' | 'new' | 'edit' | 'open-items';

interface OpenItem {
  id: number;
  title: string;
  listTypeName: string;
  statusName: string;
  dateObserved: string;
  timeObserved: string;
  locationName: string;
  specificLocation: string;
  equipmentTag: string;
  notes: string;
  submitterName: string;
  createdBy: string;
  attachmentCount: number;
  // Additional fields returned by the hub (previously typed too tight to reach maximoLocation/
  // maximoAssetnum, so the edit-form's Maximo picker opened empty even when the row had them).
  sharepointId?: string;
  localUuid?: string;
  maximoLocation?: string;
  maximoAssetnum?: string;
  maximoRecordType?: string;
  maximoRecordId?: string;
  maximoStatus?: string;
  // Work area id — needed by the equipment-picker to pre-filter its list to the area's
  // equipment. Without it the picker opens with an empty results panel and the user has
  // to re-pick the area to trigger the workAreaId binding on the form.
  workAreaId?: number;
}

@Component({
  selector: 'app-field-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormComponent],
  template: `
    <!-- Mode selector -->
    @if (mode() === 'select') {
      <div class="action-selector">
        <h2 class="action-title">Field Lists</h2>
        <p class="action-subtitle">Track insulation, leaks, winterization, and more</p>
        <div class="action-cards">
          <button class="action-card card-insulation" (click)="selectNewWithType('Insulation Removal')">
            <svg class="card-icon" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="#e65100" stroke-width="2"/><path d="M3 10h18M7 6v12M12 6v12M17 6v12" stroke="#e65100" stroke-width="1.5" fill="none"/></svg>
            <span class="action-card-label">Insulation Removal</span>
            <span class="action-card-desc">Report insulation removal</span>
          </button>
          <button class="action-card card-leaks" (click)="selectNewWithType('Leaks')">
            <svg class="card-icon" viewBox="0 0 24 24"><path d="M12 2C12 2 5 11 5 15a7 7 0 0014 0c0-4-7-13-7-13z" fill="#ffcdd2" stroke="#c62828" stroke-width="2"/></svg>
            <span class="action-card-label">Leaks</span>
            <span class="action-card-desc">Report a leak</span>
          </button>
          <button class="action-card card-winterization" (click)="selectNewWithType('Winterization')">
            <svg class="card-icon" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="22" stroke="#1565c0" stroke-width="2"/><line x1="2" y1="12" x2="22" y2="12" stroke="#1565c0" stroke-width="2"/><line x1="5" y1="5" x2="19" y2="19" stroke="#1565c0" stroke-width="1.5"/><line x1="19" y1="5" x2="5" y2="19" stroke="#1565c0" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="#bbdefb" stroke="#1565c0" stroke-width="1"/></svg>
            <span class="action-card-label">Winterization</span>
            <span class="action-card-desc">Report winterization item</span>
          </button>
          <button class="action-card card-open" (click)="openItemsList()">
            <svg class="card-icon" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 3v3h6V3M9 11h6M9 15h4" stroke="currentColor" stroke-width="2" fill="none"/></svg>
            <span class="action-card-label">View Open Items</span>
            <span class="action-card-desc">
              {{ serverStatus.isOnline() ? 'View all open items from server' : 'View locally saved items' }}
            </span>
          </button>
        </div>
      </div>
    }

    <!-- New submission form -->
    @if (mode() === 'new') {
      <div class="form-wrapper">
        <div class="sticky-header">
          <button class="back-button" (click)="backToSelect()">&#x2190; Back</button>
          <span class="header-title">New {{ presetListType() }} Item</span>
        </div>

        <!-- Active items in this area — INLINE sticky bar, sits under the header and
             scrolls with the form. Collapsed by default (compact one-line chip);
             tap to expand a scrollable list. Was a position:fixed popup before which
             (a) covered form fields and (b) drifted off-screen when the iOS keyboard
             opened and shifted the visual viewport. -->
        @if (areaName()) {
          <div class="area-strip" [class.expanded]="areaPopupExpanded()">
            <button class="area-strip-toggle"
                    (click)="areaPopupExpanded.set(!areaPopupExpanded())"
                    [attr.aria-expanded]="areaPopupExpanded()">
              @if (loadingAreaItems()) {
                <span class="area-strip-count">&#x231B; Loading...</span>
              } @else {
                <span class="area-strip-count"
                      [class.zero]="areaItems().length === 0">
                  {{ areaItems().length }}
                </span>
                <span class="area-strip-label">
                  active in <strong>{{ areaName() }}</strong>
                </span>
              }
              <span class="area-strip-chevron">
                {{ areaPopupExpanded() ? '&#9652;' : '&#9662;' }}
              </span>
            </button>
            @if (areaPopupExpanded() && !loadingAreaItems()) {
              @if (areaItems().length === 0) {
                <div class="area-strip-empty">No active items in this area.</div>
              } @else {
                <div class="area-strip-list">
                  @for (item of areaItems(); track item.id) {
                    <button class="area-strip-item"
                            type="button"
                            (click)="detailItem.set(item)">
                      <div class="area-strip-item-line1">
                        <span class="status-badge"
                              [attr.data-status]="item.statusName">{{ item.statusName }}</span>
                        <span class="area-strip-item-title">{{ item.title }}</span>
                      </div>
                      <div class="area-strip-item-line2">
                        <span>{{ item.dateObserved }}</span>
                        @if (item.equipmentTag) { <span>&middot; {{ item.equipmentTag }}</span> }
                        @if (item.specificLocation) { <span>&middot; {{ item.specificLocation }}</span> }
                      </div>
                    </button>
                  }
                </div>
              }
            }
          </div>
        }

        @if (fields().length > 0) {
          <app-reactive-form
            [fields]="fields()"
            [entity]="draftEntity()"
            [layout]="'column'"
            [submitButtonText]="'Submit'"
            (formValueChange)="onDraftChange($event)"
            (formSubmit)="onSubmit($event)">
          </app-reactive-form>
        }
      </div>
    }

    <!-- Edit form -->
    @if (mode() === 'edit') {
      <div class="form-wrapper">
        <div class="sticky-header">
          <button class="back-button" (click)="openItemsList()">&#x2190; Back to List</button>
          <span class="header-title">Edit: {{ editingItem()?.title }}</span>
        </div>

        <!-- Existing attachments (hub-item edit only). Each × removes it from the "keep"
             set; on submit, everything NOT in the set is deleted server-side. New photos
             go through the form's file input as normal. -->
        @if (editExistingAtts().length > 0) {
          <div class="edit-existing-atts">
            <div class="edit-existing-label">Existing photos ({{ editExistingAtts().length }}) — tap × to remove:</div>
            <div class="edit-existing-grid">
              @for (img of editExistingAtts(); track img.id) {
                <div class="edit-existing-cell">
                  <img [src]="img.dataUrl" [alt]="img.fileName" class="edit-existing-thumb" />
                  <button type="button" class="edit-existing-remove"
                          (click)="removeExistingAtt(img.id)"
                          [attr.aria-label]="'Remove ' + img.fileName">&times;</button>
                </div>
              }
            </div>
          </div>
        }

        @if (editFields().length > 0) {
          <app-reactive-form
            [fields]="editFields()"
            [entity]="editEntity()"
            [layout]="'column'"
            [submitButtonText]="editingSubmitted() ? 'Update' : 'Submit'"
            (formSubmit)="onUpdate($event)">
          </app-reactive-form>
        }
      </div>
    }

    <!-- Open items list -->
    @if (mode() === 'open-items') {
      <div class="form-wrapper" style="max-width: 900px;">
        <div class="sticky-header">
          <button class="back-button" (click)="backToSelect()">&#x2190; Back</button>
          <span class="header-title">Open Items</span>
          <div class="filter-tabs">
            <button [class.active]="openItemsFilter() === null" (click)="filterOpenItems(null)">All</button>
            <button [class.active]="openItemsFilter() === 'Insulation Removal'" (click)="filterOpenItems('Insulation Removal')">Insulation</button>
            <button [class.active]="openItemsFilter() === 'Leaks'" (click)="filterOpenItems('Leaks')">Leaks</button>
            <button [class.active]="openItemsFilter() === 'Winterization'" (click)="filterOpenItems('Winterization')">Winter.</button>
          </div>
        </div>

        @if (loadingOpenItems()) {
          <div class="loading-row"><div class="spinner"></div> Loading items...</div>
        } @else if (filteredOpenItems().length === 0) {
          <div class="empty-history">No open items found.</div>
        } @else {
          <div class="items-table">
            <div class="table-header">
              <span class="col-type">Type</span>
              <span class="col-status">Status</span>
              <span class="col-title">Title</span>
              <span class="col-date">Date</span>
              <span class="col-location">Location</span>
              <span class="col-equip">Equipment</span>
            </div>
            @for (item of filteredOpenItems(); track item.id || $index) {
              <button class="table-row" (click)="viewOpenItem(item)">
                <span class="col-type">
                  <span class="type-badge" [attr.data-type]="item.listTypeName">{{ item.listTypeName }}</span>
                </span>
                <span class="col-status">
                  <span class="status-badge" [attr.data-status]="item.statusName">{{ item.statusName }}</span>
                </span>
                <span class="col-title">{{ item.title }}</span>
                <span class="col-date">{{ item.dateObserved }}</span>
                <span class="col-location">{{ item.locationName }}{{ item.specificLocation ? ' — ' + item.specificLocation : '' }}</span>
                <span class="col-equip">{{ item.equipmentTag || '—' }}</span>
              </button>
            }
          </div>
          <div class="items-count">{{ filteredOpenItems().length }} item(s)</div>
        }

        <!-- Local-only items section: items where the last submit attempt didn't confirm
             (network out, both hub + PA down, etc.). Tap to open + retry. Delete removes
             the local copy without submitting — for stale drafts the user gave up on. -->
        @if (localOnlyItems().length > 0) {
          <div class="local-section">
            <div class="local-header-row">
              <h3 class="local-header">Local (not yet submitted) — {{ localOnlyItems().length }}</h3>
              <button type="button" class="local-clear-all" (click)="clearAllLocal()"
                      title="Delete every local-only item (does not submit)">
                Clear all
              </button>
            </div>
            @for (item of localOnlyItems(); track item.localUuid) {
              <div class="history-row">
                <button class="history-item" (click)="editLocalItem(item)">
                  <div class="history-item-header">
                    <span class="history-item-type">{{ item.listTypeName }}</span>
                    <span class="history-item-status not-submitted">Local only</span>
                  </div>
                  <div class="history-item-title">{{ item.title }}</div>
                </button>
                <button type="button" class="history-item-delete"
                        (click)="deleteLocal(item)"
                        title="Delete this local item (does not submit)"
                        aria-label="Delete local item">
                  &times;
                </button>
              </div>
            }
          </div>
        }
      </div>
    }

    <!-- Item detail popup -->
    @if (detailItem()) {
      <div class="overlay" (click)="detailItem.set(null)">
        <div class="detail-card" (click)="$event.stopPropagation()">
          <div class="detail-header">
            <span class="type-badge" [attr.data-type]="detailItem()!.listTypeName">{{ detailItem()!.listTypeName }}</span>
            <span class="status-badge" [attr.data-status]="detailItem()!.statusName">{{ detailItem()!.statusName }}</span>
            <button class="detail-close" (click)="detailItem.set(null)">&times;</button>
          </div>
          <h3 class="detail-title">{{ detailItem()!.title }}</h3>
          <div class="detail-fields">
            <div class="detail-field"><strong>Date:</strong> {{ detailItem()!.dateObserved }} {{ detailItem()!.timeObserved }}</div>
            <div class="detail-field"><strong>Location:</strong> {{ detailItem()!.locationName }} {{ detailItem()!.specificLocation ? '— ' + detailItem()!.specificLocation : '' }}</div>
            <div class="detail-field"><strong>Equipment:</strong> {{ detailItem()!.equipmentTag || '—' }}</div>
            <div class="detail-field"><strong>Submitter:</strong> {{ detailItem()!.submitterName || detailItem()!.createdBy || '—' }}</div>
            @if (detailItem()!.notes) {
              <div class="detail-notes">{{ detailItem()!.notes }}</div>
            }
          </div>

          <!-- Image gallery. Non-image attachments (PDFs etc.) skipped in the grid but still
               reported in the count so users know there's more than just what they see. -->
          @if (detailImages().length > 0) {
            <div class="detail-images">
              @for (img of detailImages(); track img.id) {
                <img [src]="img.dataUrl" [alt]="img.fileName"
                     class="detail-thumb" (click)="openLightbox(img.dataUrl, $event)" />
              }
            </div>
          } @else if (loadingAttachments()) {
            <div class="detail-att-loading">Loading attachments…</div>
          }

          <div class="detail-actions">
            <button type="button" class="detail-btn detail-btn-edit"
                    (click)="editHubItem(detailItem()!)">
              Edit
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Simple lightbox overlay for tapping a thumbnail. -->
    @if (lightboxSrc()) {
      <div class="lightbox" (click)="lightboxSrc.set(null)">
        <img [src]="lightboxSrc()!" alt="Full size" class="lightbox-img" (click)="$event.stopPropagation()" />
        <button class="lightbox-close" (click)="lightboxSrc.set(null)">&times;</button>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .action-selector { display: flex; flex-direction: column; align-items: center; padding: 2rem 1rem; }
    .action-title { font-size: 1.6rem; font-weight: 700; margin: 0 0 0.25rem; }
    .action-subtitle { font-size: 1rem; color: var(--secondary-text); margin: 0 0 2rem; }
    .action-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; width: 100%; max-width: 600px; }
    .action-card { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; padding: 1.2rem 0.75rem;
      background: var(--card-background); border: 2px solid var(--border-color);
      border-radius: 12px; cursor: pointer; min-height: 100px; font-family: inherit; color: var(--primary-text); }
    .action-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .card-insulation { border-color: #ff9800; } .card-leaks { border-color: #f44336; }
    .card-winterization { border-color: #2196f3; } .card-open { border-color: var(--accent-color); }
    .card-icon { width: 36px; height: 36px; }
    .action-card-label { font-size: 1rem; font-weight: 600; text-align: center; }
    .action-card-desc { font-size: 0.8rem; color: var(--secondary-text); text-align: center; }
    .form-wrapper { max-width: 600px; margin: 0 auto; padding: 0 16px 16px; box-sizing: border-box; width: 100%; }
    .form-wrapper ::ng-deep form { box-sizing: border-box; max-width: 100%; }
    .form-wrapper ::ng-deep input, .form-wrapper ::ng-deep select,
    .form-wrapper ::ng-deep textarea { box-sizing: border-box; max-width: 100%; width: 100%; }
    .form-wrapper ::ng-deep fieldset { border: none; margin: 0; padding: 0; min-width: 0; }
    .sticky-header { display: flex; align-items: center; gap: 12px; padding: 12px 0; position: sticky; top: 0;
      background: var(--primary-background); z-index: 10; flex-wrap: wrap; }
    .back-button { background: none; border: none; color: var(--accent-color); cursor: pointer; font-size: 14px; font-family: inherit; }
    .header-title { font-size: 16px; font-weight: 600; }
    .filter-tabs { display: flex; gap: 4px; margin-left: auto; }
    .filter-tabs button { padding: 4px 10px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); cursor: pointer; font-size: 12px; font-family: inherit; color: var(--primary-text); }
    .filter-tabs button.active { background: var(--accent-color); color: white; border-color: var(--accent-color); }
    .loading-row { display: flex; align-items: center; gap: 12px; padding: 24px; justify-content: center; color: var(--secondary-text); }
    .items-table { display: flex; flex-direction: column; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
    .table-header, .table-row { display: grid; grid-template-columns: 110px 80px 1fr 90px 1fr 90px; gap: 8px; padding: 8px 12px; }
    .table-header { background: var(--secondary-background); font-size: 11px; font-weight: 600; text-transform: uppercase;
      color: var(--secondary-text); border-bottom: 1px solid var(--border-color); }
    .table-row { border: none; border-bottom: 1px solid var(--border-color); background: var(--card-background);
      cursor: pointer; font-family: inherit; font-size: 13px; text-align: left; padding: 10px 12px;
      color: var(--primary-text); }
    .table-row:hover { background: var(--secondary-background); }
    .table-row:last-child { border-bottom: none; }
    .col-title, .col-location { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .type-badge { font-size: 10px; font-weight: 600; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; white-space: nowrap; }
    .type-badge[data-type="Insulation Removal"] { background: rgba(255, 152, 0, 0.15); color: #ff9800; }
    .type-badge[data-type="Leaks"] { background: rgba(244, 67, 54, 0.15); color: #f44336; }
    .type-badge[data-type="Winterization"] { background: rgba(33, 150, 243, 0.15); color: #42a5f5; }
    .status-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
    .status-badge[data-status="Open"] { background: rgba(255, 152, 0, 0.15); color: #ff9800; }
    .status-badge[data-status="In Progress"] { background: rgba(33, 150, 243, 0.15); color: #42a5f5; }
    .items-count { text-align: right; font-size: 12px; color: var(--secondary-text); padding: 8px 0; }
    .local-section { margin-top: 16px; }
    .local-header { font-size: 13px; font-weight: 600; color: var(--secondary-text); margin: 0 0 8px; }
    .local-section, .empty-history { display: flex; flex-direction: column; gap: 8px; }
    .local-header-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .local-clear-all { background: none; border: 1px solid var(--border-color); border-radius: 6px;
      padding: 4px 10px; font-size: 12px; color: var(--secondary-text); cursor: pointer; font-family: inherit; }
    .local-clear-all:hover { border-color: var(--error-text, #b91c1c); color: var(--error-text, #b91c1c); }
    .empty-history { padding: 32px; text-align: center; color: var(--secondary-text); }
    .history-row { display: flex; align-items: stretch; gap: 6px; }
    .history-row .history-item { flex: 1; }
    .history-item { display: flex; flex-direction: column; gap: 4px; padding: 12px 16px;
      border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-background);
      cursor: pointer; text-align: left; font-family: inherit; color: var(--primary-text); }
    .history-item:hover { border-color: var(--accent-color); }
    .history-item-delete { flex: 0 0 auto; width: 40px; background: var(--card-background);
      border: 1px solid var(--border-color); border-radius: 8px; color: var(--secondary-text);
      font-size: 20px; line-height: 1; cursor: pointer; font-family: inherit; }
    .history-item-delete:hover { border-color: var(--error-text, #b91c1c); color: var(--error-text, #b91c1c); }
    .history-item-header { display: flex; justify-content: space-between; align-items: center; }
    .history-item-type { font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--accent-color); }
    .history-item-status { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: var(--secondary-background); }
    .not-submitted { background: var(--error-bg); color: var(--error-text); }
    .history-item-title { font-size: 15px; font-weight: 500; }
    .detail-card { background: var(--primary-background); border-radius: 16px; padding: 24px;
      max-width: 500px; width: 90vw; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,.3); }
    .detail-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .detail-close { margin-left: auto; background: none; border: none; font-size: 24px; cursor: pointer; color: var(--primary-text); }
    .detail-title { font-size: 18px; font-weight: 600; margin: 0 0 16px; }
    .detail-fields { display: flex; flex-direction: column; gap: 8px; }
    .detail-field { font-size: 14px; color: var(--primary-text); }
    .detail-field strong { color: var(--secondary-text); display: inline-block; min-width: 80px; }
    .detail-notes { background: var(--secondary-background); padding: 10px 12px; border-radius: 6px;
      white-space: pre-wrap; font-size: 13px; margin-top: 4px; }
    .edit-existing-atts { margin: 0 0 16px; padding: 12px; border: 1px solid var(--border-color);
      border-radius: 8px; background: var(--card-background); }
    .edit-existing-label { font-size: 13px; color: var(--secondary-text); margin-bottom: 8px; }
    .edit-existing-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; }
    .edit-existing-cell { position: relative; }
    .edit-existing-thumb { width: 100%; aspect-ratio: 1; object-fit: cover;
      border-radius: 6px; border: 1px solid var(--border-color); }
    .edit-existing-remove { position: absolute; top: -6px; right: -6px; width: 24px; height: 24px;
      background: var(--error-text, #b91c1c); color: white; border: 2px solid var(--primary-background);
      border-radius: 50%; font-size: 14px; line-height: 1; cursor: pointer; font-family: inherit;
      display: flex; align-items: center; justify-content: center; padding: 0; }
    .edit-existing-remove:active { transform: scale(0.9); }
    .detail-images { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 8px; margin-top: 12px; }
    .detail-thumb { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px;
      border: 1px solid var(--border-color); cursor: pointer; }
    .detail-att-loading { margin-top: 12px; font-size: 12px; color: var(--secondary-text); }
    .detail-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    .detail-btn { padding: 8px 16px; border-radius: 6px; border: none; font-family: inherit;
      font-size: 14px; font-weight: 600; cursor: pointer; }
    .detail-btn-edit { background: var(--accent-color); color: white; }
    .detail-btn-edit:hover { opacity: 0.9; }
    .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex;
      align-items: center; justify-content: center; z-index: 10000; cursor: pointer; }
    .lightbox-img { max-width: 92vw; max-height: 92vh; object-fit: contain; border-radius: 4px; cursor: default; }
    .lightbox-close { position: fixed; top: 12px; right: 12px; background: none; border: none;
      color: white; font-size: 36px; cursor: pointer; z-index: 10001; padding: 8px 12px; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex;
      align-items: center; justify-content: center; z-index: 9999; }
    .spinner { width: 40px; height: 40px; border: 4px solid var(--border-color);
      border-top-color: var(--accent-color); border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    /* Area strip: in-flow sticky bar under the header showing "N active in <area>".
       Not fixed-positioned — sticks with position: sticky under the sticky-header so it
       never overlays form fields and never drifts when the mobile keyboard opens.
       Collapsed = one line; expanded = list scrolls inside a max-height container. */
    .area-strip { position: sticky; top: 48px; z-index: 9;
      background: var(--card-background); border: 1px solid var(--border-color);
      border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
    .area-strip.expanded { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .area-strip-toggle { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px;
      background: none; border: none; text-align: left; cursor: pointer; font-family: inherit;
      color: var(--primary-text); font-size: 14px; }
    .area-strip-toggle:hover { background: var(--secondary-background); }
    .area-strip-count { display: inline-flex; align-items: center; justify-content: center;
      min-width: 28px; height: 24px; padding: 0 8px; border-radius: 12px;
      background: var(--accent-color); color: white; font-weight: 600; font-size: 13px; }
    .area-strip-count.zero { background: var(--secondary-background); color: var(--secondary-text); }
    .area-strip-label { flex: 1; font-size: 13px; color: var(--secondary-text); }
    .area-strip-label strong { color: var(--primary-text); }
    .area-strip-chevron { font-size: 10px; color: var(--secondary-text); }
    .area-strip-empty { padding: 8px 12px 12px; font-size: 13px; color: var(--secondary-text);
      border-top: 1px solid var(--border-color); }
    .area-strip-list { display: flex; flex-direction: column; gap: 6px; padding: 8px 12px 12px;
      max-height: 240px; overflow-y: auto; border-top: 1px solid var(--border-color);
      -webkit-overflow-scrolling: touch; }
    .area-strip-item { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px;
      border: 1px solid var(--border-color); border-radius: 6px; background: var(--primary-background);
      cursor: pointer; text-align: left; font-family: inherit; color: var(--primary-text); }
    .area-strip-item:hover { border-color: var(--accent-color); }
    .area-strip-item-line1 { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; }
    .area-strip-item-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .area-strip-item-line2 { display: flex; gap: 6px; font-size: 12px; color: var(--secondary-text); flex-wrap: wrap; }
    @media (max-width: 768px) {
      .action-cards { grid-template-columns: 1fr 1fr; max-width: 400px; }
      .table-header { display: none; }
      .table-row { grid-template-columns: 1fr 1fr; padding: 12px; }
      .filter-tabs { margin-left: 0; width: 100%; }
    }
    @media (max-width: 400px) { .action-cards { grid-template-columns: 1fr; } }
  `]
})
export class FieldListComponent implements OnInit {
  private serverApi = inject(ServerApiService);
  serverStatus = inject(ServerStatusService);
  private authService = inject(AuthService);
  private orchestrator = inject(SubmissionOrchestratorService);
  private userSetup = inject(UserSetupService);
  private globalMessage = inject(GlobalMessageService);
  private supabaseData = inject(SupabaseDataService);
  private http = inject(HttpClient);
  private navRoute = inject(ActivatedRoute);

  mode = signal<ViewMode>('select');
  fields = signal<FormField[]>([]);
  editFields = signal<FormField[]>([]);
  editingItem = signal<any>(null);
  editEntity = signal<any>({});
  editingSubmitted = signal(false);
  draftEntity = signal<any>({});
  presetListType = signal('');

  // Open items
  openItems = signal<OpenItem[]>([]);
  loadingOpenItems = signal(false);
  openItemsFilter = signal<string | null>(null);
  detailItem = signal<OpenItem | null>(null);

  // Detail-dialog attachments (fetched lazily when detailItem is set).
  detailImages = signal<Array<{ id: number; fileName: string; dataUrl: string }>>([]);
  loadingAttachments = signal(false);
  lightboxSrc = signal<string | null>(null);

  // Edit-mode attachments (existing images on the hub-side item, plus the "keep" set that
  // shrinks as the user removes thumbnails; only the remaining ids get sent as
  // keepAttachmentIds on Update so the server can delete the removed ones).
  editExistingAtts = signal<Array<{ id: number; fileName: string; dataUrl: string }>>([]);

  // Area items popup
  areaItems = signal<OpenItem[]>([]);
  areaName = signal('');
  areaPopupExpanded = signal(false);
  loadingAreaItems = signal(false);
  private lastAreaId: number | null = null;

  filteredOpenItems = computed(() => {
    const filter = this.openItemsFilter();
    const items = this.openItems();
    return filter ? items.filter(i => i.listTypeName === filter) : items;
  });

  // Local-only items (not submitted to server)
  localOnlyItems = signal<any[]>([]);

  private listTypeOptions: Option[] = [];
  private editingLocalUuid = '';

  private static readonly DRAFT_KEY = 'pwa_field_list_draft';

  ngOnInit(): void {
    this.loadListTypes();
    // Deep link: ?type= creates a new item of that type; ?view=open jumps straight to the
    // Open Items list. Both come from Field List sub-section nav shortcuts. Applied after
    // loadListTypes so the form / list is built with the option list already populated.
    const params = this.navRoute.snapshot.queryParamMap;
    const requestedView = params.get('view');
    if (requestedView === 'open') {
      this.openItemsList();
      return;
    }
    const requestedType = params.get('type');
    if (requestedType && this.listTypeOptions.some(o => o.value === requestedType)) {
      this.selectNewWithType(requestedType);
    }
  }

  private loadListTypes(): void {
    const cached = localStorage.getItem('pwa_field_list_types');
    if (cached) {
      try { this.setListTypeOptions(JSON.parse(cached)); } catch { /* ignore */ }
    }
    if (this.listTypeOptions.length === 0) {
      this.setListTypeOptions([
        { id: 0, name: 'Insulation Removal' },
        { id: 0, name: 'Leaks' },
        { id: 0, name: 'Winterization' }
      ]);
    }

    const apply = (types: { id: number; name: string }[]) => {
      this.setListTypeOptions(types);
      localStorage.setItem('pwa_field_list_types', JSON.stringify(types));
    };

    this.serverApi.getFieldListTypes().subscribe({
      next: apply,
      error: () => {
        const fromStatic = () => this.http.get<{ id: number; name: string }[]>('data/field-list-types.json').subscribe({
          next: apply,
          error: () => {}
        });
        this.supabaseData.snapshotOrElse('field_list_types', apply, fromStatic);
      }
    });
  }

  private setListTypeOptions(types: { id: number; name: string }[]): void {
    this.listTypeOptions = types.map(t => ({ value: t.name, label: t.name }));
  }

  // ====================== Navigation ======================

  selectNewWithType(listType: string): void {
    this.presetListType.set(listType);
    this.fields.set(fieldListFormFields(this.listTypeOptions, listType, true));
    this.loadDraft(listType);
    this.mode.set('new');
  }

  openItemsList(): void {
    this.mode.set('open-items');
    this.loadOpenItems();
    this.loadLocalOnlyItems();
  }

  backToSelect(): void {
    this.mode.set('select');
    this.detailItem.set(null);
  }

  // ====================== Open items ======================

  private loadOpenItems(): void {
    if (!this.authService.isLoggedIn()) {
      this.openItems.set([]);
      return;
    }
    this.loadingOpenItems.set(true);
    this.serverApi.getOpenFieldListItems().subscribe({
      next: items => {
        this.openItems.set(items);
        this.loadingOpenItems.set(false);
      },
      error: () => {
        this.openItems.set([]);
        this.loadingOpenItems.set(false);
      }
    });
  }

  filterOpenItems(listType: string | null): void {
    this.openItemsFilter.set(listType);
  }

  viewOpenItem(item: OpenItem): void {
    this.detailItem.set(item);
    this.detailImages.set([]);
    if (item?.id && item.id > 0) this.loadDetailAttachments(item.id);
  }

  /** Fetch attachments for the item currently in the details dialog. Never blocks; fail-quiet. */
  private loadDetailAttachments(id: number): void {
    this.loadingAttachments.set(true);
    this.serverApi.getFieldListAttachments(id).subscribe({
      next: atts => {
        const images = (atts || [])
          .filter(a => (a.contentType || '').startsWith('image/') && a.base64Content)
          .map(a => ({
            id: a.id,
            fileName: a.fileName,
            dataUrl: a.base64Content.startsWith('data:')
              ? a.base64Content
              : `data:${a.contentType};base64,${a.base64Content}`,
          }));
        this.detailImages.set(images);
        this.loadingAttachments.set(false);
      },
      error: () => { this.detailImages.set([]); this.loadingAttachments.set(false); },
    });
  }

  openLightbox(src: string, ev: MouseEvent): void {
    ev.stopPropagation();
    this.lightboxSrc.set(src);
  }

  /**
   * Open an existing hub-side item in the same form used for creation, pre-filled. On submit,
   * onUpdate calls updateFieldListItem which pushes to hub H2, SP, and (via the Updated event
   * → bridge.updateFields) Maximo. So a PWA edit propagates all the way — matches the flow
   * for local-only items (editLocalItem) but sets editingSubmitted=true to route through the
   * update endpoint instead of a fresh submit.
   */
  editHubItem(item: OpenItem): void {
    this.detailItem.set(null);
    this.editingItem.set(item);
    this.editingLocalUuid = (item as any).localUuid || '';
    this.editingSubmitted.set(true); // hub-side row → PUT /update instead of POST /submit
    // Map the OpenItem projection into the FORM's field-name shape (NOT the DTO's) — the
    // form uses `locationDetail` (not `specificLocation`) and `maximoPicker` (not the flat
    // maximoLocation/maximoAssetnum). Previously we passed the wrong keys, so the edit
    // opened with those fields empty; if the user submitted without noticing, backend
    // received empty strings and silently wiped the data.
    // workAreaMap object is the shape the work-area-map field expects; we don't have
    // coordinates for a hub-loaded row, so pass just the name (form's writeValue accepts
    // string or {name}).
    const maximoLoc = (item as any).maximoLocation || '';
    const maximoAsset = (item as any).maximoAssetnum || '';
    this.editEntity.set({
      title: item.title,
      notes: item.notes,
      dateObserved: item.dateObserved,
      timeObserved: item.timeObserved,
      locationDetail: item.specificLocation,
      equipmentTag: item.equipmentTag,
      // Include the workAreaId (not just the name) so the equipment-picker's
      // `[workAreaId]="form.get('workAreaMap')?.value?.id ?? null"` binding can pre-filter
      // its list on dialog open. Without the id, the picker opens empty and the user has
      // to change the area then change it back to trigger the filter.
      workAreaMap: (item.workAreaId || item.locationName)
        ? { id: item.workAreaId ?? null, name: item.locationName ?? '' }
        : null,
      maximoPicker: (maximoLoc || maximoAsset)
        ? { location: maximoLoc, assetnum: maximoAsset }
        : null,
      listTypeName: item.listTypeName,
      statusName: item.statusName,
    });
    this.editFields.set(fieldListFormFields(this.listTypeOptions, item.listTypeName));
    // Prime the existing-attachments panel — user can remove any before submit; whatever
    // remains gets sent as keepAttachmentIds so the server deletes the rest.
    this.editExistingAtts.set([]);
    if (item?.id && item.id > 0) {
      this.serverApi.getFieldListAttachments(item.id).subscribe(atts => {
        const imgs = (atts || [])
          .filter(a => (a.contentType || '').startsWith('image/') && a.base64Content)
          .map(a => ({
            id: a.id,
            fileName: a.fileName,
            dataUrl: a.base64Content.startsWith('data:')
              ? a.base64Content
              : `data:${a.contentType};base64,${a.base64Content}`,
          }));
        this.editExistingAtts.set(imgs);
      });
    }
    this.mode.set('edit');
  }

  /** Remove one existing attachment from the "keep" set — the deletion happens server-side
   *  on submit (keepAttachmentIds excludes this id). Local mutation only; no network call. */
  removeExistingAtt(id: number): void {
    this.editExistingAtts.update(list => list.filter(a => a.id !== id));
  }

  private loadLocalOnlyItems(): void {
    const stored = this.getStoredItems();
    this.localOnlyItems.set(stored.filter((i: any) => !i.submitted));
  }

  /**
   * Delete ALL locally-stored not-yet-submitted items. Keeps submitted history rows so a
   * successful submit's audit trail isn't wiped — only unsubmitted (localOnly) items go.
   * User might want this if a stale batch of stuck local drafts is cluttering the view.
   */
  clearAllLocal(): void {
    if (this.localOnlyItems().length === 0) return;
    if (!confirm(`Delete all ${this.localOnlyItems().length} local-only item(s)? This cannot be undone.`)) return;
    const stored = this.getStoredItems();
    const kept = stored.filter((i: any) => i.submitted);
    try {
      localStorage.setItem('pwa_field_list_history', JSON.stringify(kept));
    } catch { /* quota / disabled — nothing we can do */ }
    this.loadLocalOnlyItems();
    this.globalMessage.showSuccess('Local-only items cleared.');
  }

  /** Delete one local-only item without submitting. Uses localUuid as identity. */
  deleteLocal(item: any): void {
    if (!item?.localUuid) return;
    if (!confirm(`Delete "${item.title || 'this item'}" from local queue? This cannot be undone.`)) return;
    const stored = this.getStoredItems();
    const kept = stored.filter((i: any) => i.localUuid !== item.localUuid);
    try {
      localStorage.setItem('pwa_field_list_history', JSON.stringify(kept));
    } catch { /* quota / disabled */ }
    this.loadLocalOnlyItems();
  }

  private loadAreaItems(areaName: string): void {
    if (!this.authService.isLoggedIn() || !this.serverStatus.isOnline()) return;

    this.areaName.set(areaName);
    this.loadingAreaItems.set(true);
    // Auto-expand only when items land, not preemptively — the strip is inline now, so
    // it's fine to show collapsed when empty and users don't need it. The old fixed
    // popup pre-expanded because it would otherwise be missable off-screen.
    this.serverApi.getOpenFieldListItems(this.presetListType()).subscribe({
      next: items => {
        const filtered = items.filter((i: any) => i.locationName === areaName);
        this.areaItems.set(filtered);
        this.loadingAreaItems.set(false);
        this.areaPopupExpanded.set(filtered.length > 0);
      },
      error: () => {
        this.areaItems.set([]);
        this.loadingAreaItems.set(false);
        this.areaPopupExpanded.set(false);
      }
    });
  }

  editLocalItem(item: any): void {
    this.editingItem.set(item);
    this.editingLocalUuid = item.localUuid;
    this.editingSubmitted.set(false);
    this.editEntity.set(item);
    this.editFields.set(fieldListFormFields(this.listTypeOptions, item.listTypeName));
    this.mode.set('edit');
  }

  // ====================== Draft ======================

  onDraftChange(formData: any): void {
    try {
      const { attachments, ...draftData } = formData;
      const key = FieldListComponent.DRAFT_KEY + '_' + this.presetListType();
      localStorage.setItem(key, JSON.stringify(draftData));
    } catch { /* ignore */ }

    // Detect area selection change → show active items for that area
    const area = formData.workAreaMap;
    const areaId = area?.id ?? null;
    if (areaId && areaId !== this.lastAreaId) {
      this.lastAreaId = areaId;
      this.loadAreaItems(area.name);
    } else if (!areaId && this.lastAreaId) {
      this.lastAreaId = null;
      this.areaPopupExpanded.set(false);
    }
  }

  private loadDraft(listType: string): void {
    try {
      const raw = localStorage.getItem(FieldListComponent.DRAFT_KEY + '_' + listType);
      if (raw) {
        const draft = JSON.parse(raw);
        draft.listTypeName = listType; // always keep preset type
        this.draftEntity.set(draft);
      } else {
        this.draftEntity.set({ listTypeName: listType });
      }
    } catch {
      this.draftEntity.set({ listTypeName: listType });
    }
  }

  private clearDraft(listType: string): void {
    localStorage.removeItem(FieldListComponent.DRAFT_KEY + '_' + listType);
    this.draftEntity.set({ listTypeName: listType });
  }

  // ====================== Submit new ======================

  onSubmit(formData: any): void {
    this.globalMessage.showLoading('Submitting field list item...');

    const payload = this.buildPayload(formData);
    payload.localUuid = crypto.randomUUID();

    // Clear the draft and navigate away REGARDLESS of result. The localUuid guarantees
    // idempotency on any retry (backend dedupes on it), and a submitted-but-flagged-as-
    // failure case (e.g. server returned success but response body was malformed) still
    // preserves the user's data via saveToLocalHistory below. Keeping the form open on
    // "failure" was a source of confusion — user reported "submitted successfully but
    // form didn't clear" for exactly this partial-success case.
    const done = (result: { success: boolean; method?: string; message?: string } | null) => {
      payload.submitted = !!result?.success;
      this.saveToLocalHistory(payload);
      this.clearDraft(this.presetListType());
      if (result?.success) {
        this.globalMessage.showSuccess(result.message || `Submitted via ${result.method}`);
      } else {
        // "Not confirmed" wording so the user knows their data is safe locally without
        // implying it definitely didn't reach the server (which it often did — see the
        // form-didn't-clear bug report). They can retry from the Local list if needed.
        this.globalMessage.showError(result?.message ?? 'Submit not confirmed — saved locally for retry.');
      }
      this.backToSelect();
    };

    this.orchestrator.submitFieldListItem(payload).subscribe({
      next: (result) => done(result),
      error: () => done(null),
    });
  }

  // ====================== Edit existing ======================

  onUpdate(formData: any): void {
    this.globalMessage.showLoading('Submitting field list item...');

    const payload = this.buildPayload(formData);
    payload.localUuid = this.editingLocalUuid;
    // Hub-side item (opened via editHubItem) may not have a localUuid — send sharepointId
    // so PwaFieldListItemService.updateFieldListItem can look it up via the SP-id branch.
    const spId = (this.editingItem() as any)?.sharepointId;
    if (spId) (payload as any).sharepointId = spId;
    // Attachment sync — only sent for hub-item edits (editingSubmitted=true) so the local-
    // item path doesn't accidentally delete anything (local items don't have server-side
    // attachments). Sending an empty array WOULD delete everything, so null-check the
    // signal instead of using .length as the guard.
    if (this.editingSubmitted() && this.editingItem()) {
      (payload as any).keepAttachmentIds = this.editExistingAtts().map(a => a.id);
    }
    // Preserve current status on hub-item edits — the form doesn't have a status field, but
    // buildPayload hardcodes `statusName: 'Open'` for the submit path. Sending that on an
    // update would silently reset an In-Progress item back to Open. The insulation-close
    // flow is the only path that intentionally changes status; keep it out of edits.
    if (this.editingSubmitted() && this.editingItem()) {
      payload.statusName = this.editingItem()!.statusName || payload.statusName;
    }

    const wasSubmitted = this.editingSubmitted();
    const action$ = wasSubmitted
      ? this.orchestrator.updateFieldListItem(payload)
      : this.orchestrator.submitFieldListItem(payload);

    // Mirror onSubmit's always-clear behaviour so a partial-success / ambiguous result still
    // exits the form. Local history bookkeeping only applies to items that started local (had
    // a localUuid we know about); hub-item edits skip that.
    const done = (result: { success: boolean; method?: string; message?: string } | null) => {
      if (this.editingLocalUuid) {
        payload.submitted = !!result?.success;
        this.updateLocalHistory(payload);
      }
      if (result?.success) {
        this.globalMessage.showSuccess(wasSubmitted
          ? (result.message || 'Updated successfully')
          : (result.message || 'Submitted successfully'));
      } else {
        this.globalMessage.showError(result?.message ?? 'Save not confirmed — try again from the Open Items list.');
      }
      this.backToSelect();
    };

    action$.subscribe({
      next: (result) => done(result),
      error: () => done(null),
    });
  }

  // ====================== Shared ======================

  private buildPayload(formData: any): any {
    let equipmentTag = '';
    if (formData.equipmentTag && typeof formData.equipmentTag === 'object') {
      equipmentTag = formData.equipmentTag.tagNumber || '';
    } else if (typeof formData.equipmentTag === 'string') {
      equipmentTag = formData.equipmentTag;
    }

    // The map picker hands back {id, name}. Send BOTH: the hub binds the work area by id and only
    // falls back to the name when the id is stale or missing (older offline drafts carry no id).
    // locationName stays on the payload because it is what the SharePoint "Location" column reads.
    let workAreaId: number | null = null;
    let workAreaName = '';
    if (formData.workAreaMap && typeof formData.workAreaMap === 'object') {
      workAreaName = formData.workAreaMap.name || '';
      workAreaId = typeof formData.workAreaMap.id === 'number' && formData.workAreaMap.id > 0
        ? formData.workAreaMap.id
        : null;
    }
    const locationName = workAreaName;

    // Unpack the Maximo tree picker's {assetnum, location} value into the two flat DTO
    // fields the backend expects. Picker is optional — if not used, both stay empty and
    // the bridge sees "not provided" (ops assigns on Maximo triage). See
    // project/features/maximo/field-list-sr.md.
    let maximoLocation = '';
    let maximoAssetnum = '';
    if (formData.maximoPicker && typeof formData.maximoPicker === 'object') {
      maximoLocation = formData.maximoPicker.location || '';
      maximoAssetnum = formData.maximoPicker.assetnum || '';
    }

    // Auto-populate submitter details from user profile
    const userData = this.userSetup.getUserData();

    return {
      localUuid: '',
      listTypeName: formData.listTypeName || '',
      statusName: 'Open',
      title: formData.title || '',
      notes: formData.notes || '',
      dateObserved: formData.dateObserved || '',
      timeObserved: formData.timeObserved || '',
      locationName,
      workAreaId,
      workAreaName,
      specificLocation: formData.locationDetail || '',
      equipmentTag,
      maximoLocation,
      maximoAssetnum,
      submitterName: userData?.name || '',
      submitterEmail: userData?.email || '',
      submitterPhone: userData?.phone || '',
      attachments: formData.attachments || []
    };
  }

  // ====================== Local history (localStorage) ======================

  private saveToLocalHistory(payload: any): void {
    try {
      const { attachments, ...storable } = payload;
      const items = this.getStoredItems();
      items.unshift(storable);
      localStorage.setItem('pwa_field_list_history', JSON.stringify(items.slice(0, 50)));
    } catch (e) {
      console.warn('[FieldList] Failed to save to local history:', e);
    }
  }

  private updateLocalHistory(payload: any): void {
    try {
      const { attachments, ...storable } = payload;
      const items = this.getStoredItems();
      const idx = items.findIndex((i: any) => i.localUuid === storable.localUuid);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...storable };
      }
      localStorage.setItem('pwa_field_list_history', JSON.stringify(items));
    } catch (e) {
      console.warn('[FieldList] Failed to update local history:', e);
    }
  }

  private getStoredItems(): any[] {
    try {
      return JSON.parse(localStorage.getItem('pwa_field_list_history') || '[]');
    } catch {
      return [];
    }
  }
}
