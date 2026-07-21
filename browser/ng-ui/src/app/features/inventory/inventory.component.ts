import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ServerApiService } from '../../services/server-api.service';
import { ServerStatusService } from '../../services/server-status.service';
import { SubmissionOrchestratorService } from '../../services/submission-orchestrator.service';
import { UserSetupService } from '../../services/user-setup.service';
import { AuthService } from '../../auth/auth.service';
import { QrScannerService } from '../../shared/qr-scanner/qr-scanner.service';
import { QrScannerComponent } from '../../shared/qr-scanner/qr-scanner.component';
import { ReactiveFormComponent } from '../../shared/forms/reactive-form/reactive-form.component';
import { FormField } from '../../models/inputs/form-field.model';
import { inventoryFormFields, inventoryUsageFormFields } from '../../models/inventory/inventory-item.model';
import { Option } from '../../models/inputs/option.model';
import { BradyPrinterModalService } from '../../shared/brady-printer-manager/brady-printer-modal.service';
import { NativePrintService } from '../../shared/native-print/native-print.service';

type ViewMode = 'select' | 'new' | 'edit' | 'scan-result' | 'list';
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormComponent, QrScannerComponent],
  template: `
    @if (qrScannerService.isScannerVisible()) {
      <app-qr-scanner></app-qr-scanner>
    }

    @if (submitState() === 'submitting') {
      <div class="overlay">
        <div class="overlay-card">
          <div class="spinner"></div>
          <p class="overlay-text">Working...</p>
        </div>
      </div>
    }
    @if (submitState() === 'success') {
      <div class="overlay">
        <div class="overlay-card success">
          <span class="overlay-icon">&#10003;</span>
          <p class="overlay-text">{{ submitMessage() }}</p>
          <button class="overlay-btn" (click)="dismissResult()">OK</button>
        </div>
      </div>
    }
    @if (submitState() === 'error') {
      <div class="overlay">
        <div class="overlay-card error">
          <span class="overlay-icon">&#10007;</span>
          <p class="overlay-text">{{ submitMessage() }}</p>
          <button class="overlay-btn" (click)="dismissResult()">OK</button>
        </div>
      </div>
    }

    @if (mode() === 'select') {
      <div class="action-selector">
        <h2 class="action-title">Inventory</h2>
        <p class="action-subtitle">Track tools and equipment with QR codes</p>
        <div class="action-cards">
          <button class="action-card card-scan" (click)="openScanner()">
            <svg class="card-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="6" height="6" fill="none" stroke="#1976d2" stroke-width="2"/><rect x="15" y="3" width="6" height="6" fill="none" stroke="#1976d2" stroke-width="2"/><rect x="3" y="15" width="6" height="6" fill="none" stroke="#1976d2" stroke-width="2"/><rect x="11" y="11" width="2" height="10" fill="#1976d2"/><rect x="11" y="3" width="2" height="6" fill="#1976d2"/></svg>
            <span class="action-card-label">Scan Item</span>
            <span class="action-card-desc">Check out / check in by QR</span>
          </button>
          <button class="action-card card-new" (click)="selectNew()">
            <svg class="card-icon" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="#fb8c00" stroke-width="3" fill="none"/></svg>
            <span class="action-card-label">Add New Item</span>
            <span class="action-card-desc">Register a tool or part</span>
          </button>
          <button class="action-card card-list" (click)="openList()">
            <svg class="card-icon" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="#26a69a" stroke-width="2"/><path d="M9 8h6M9 12h6M9 16h4" stroke="#26a69a" stroke-width="2"/></svg>
            <span class="action-card-label">View Inventory</span>
            <span class="action-card-desc">{{ serverStatus.isOnline() ? 'Browse all items' : 'View saved items' }}</span>
          </button>
        </div>
      </div>
    }

    @if (mode() === 'new') {
      <div class="form-wrapper">
        <div class="sticky-header">
          <button class="back-button" (click)="backToSelect()">&#x2190; Back</button>
          <span class="header-title">Add New Item</span>
        </div>
        @if (fields().length > 0) {
          <app-reactive-form
            [fields]="fields()"
            [entity]="draftEntity()"
            [layout]="'column'"
            [submitButtonText]="'Save Item'"
            [showAddEditOption]="false"
            (formValueChange)="onDraftChange($event)"
            (formSubmit)="onSubmit($event)">
          </app-reactive-form>
        }
      </div>
    }

    @if (mode() === 'edit') {
      <div class="form-wrapper">
        <div class="sticky-header">
          <button class="back-button" (click)="cancelEdit()">&#x2190; Cancel</button>
          <span class="header-title">Edit {{ scannedItem()?.title || 'Item' }}</span>
        </div>
        @if (fields().length > 0) {
          <app-reactive-form
            [fields]="fields()"
            [entity]="draftEntity()"
            [layout]="'column'"
            [submitButtonText]="'Save Changes'"
            [showAddEditOption]="false"
            (formSubmit)="onSubmit($event)">
          </app-reactive-form>
        }
      </div>
    }

    @if (mode() === 'scan-result') {
      <div class="form-wrapper">
        <div class="sticky-header">
          <button class="back-button" (click)="backToSelect()">&#x2190; Back</button>
          <span class="header-title">{{ scannedItem()?.title || 'Item' }}</span>
        </div>
        @if (scannedItem()) {
          <div class="item-summary">
            <div class="summary-header-row">
              <div class="item-status-badge" [attr.data-status]="scannedItem()!.statusName">
                {{ scannedItem()!.statusName }}
              </div>
              <button class="edit-btn" (click)="editScannedItem()" title="Edit item">
                <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle; margin-right: 4px;">
                  <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                Edit
              </button>
            </div>
            <h3>{{ scannedItem()!.title }}</h3>
            @if (scannedItem()!.serialNumber) { <p class="muted">Serial: {{ scannedItem()!.serialNumber }}</p> }
            @if (scannedItem()!.manufacturer || scannedItem()!.model) {
              <p class="muted">{{ scannedItem()!.manufacturer }} {{ scannedItem()!.model }}</p>
            }

            <div class="detail-grid">
              @if (scannedItem()!.itemTypeName) {
                <div class="detail-row"><span class="detail-label">Type</span><span>{{ scannedItem()!.itemTypeName }}</span></div>
              }
              @if (scannedItem()!.locationName) {
                <div class="detail-row"><span class="detail-label">Home location</span><span>{{ scannedItem()!.locationName }}</span></div>
              }
              <div class="detail-row"><span class="detail-label">Current location</span><span>{{ scannedItem()!.currentLocation || scannedItem()!.locationName || '—' }}</span></div>
              @if (scannedItem()!.currentHolderName) {
                <div class="detail-row"><span class="detail-label">Currently with</span><span><strong>{{ scannedItem()!.currentHolderName }}</strong></span></div>
              }
              @if (scannedItem()!.lastCheckedOutAt) {
                <div class="detail-row"><span class="detail-label">Last checkout</span><span>{{ formatDate(scannedItem()!.lastCheckedOutAt) }}</span></div>
              }
            </div>
          </div>

          <div class="print-row">
            @if (bluetoothAvailable) {
              <button class="btn-print" (click)="printLabel(scannedItem())">
                <svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align: middle; margin-right: 6px;">
                  <path fill="currentColor" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                </svg>
                Print (Brady)
              </button>
            }
            @if (nativePrintAvailable) {
              <button class="btn-print btn-print-system" (click)="printLabelNative(scannedItem())">
                <svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align: middle; margin-right: 6px;">
                  <path fill="currentColor" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                </svg>
                Print (System)
              </button>
            }
            @if (!bluetoothAvailable && !nativePrintAvailable) {
              <span class="print-unavailable">Printing not supported on this device</span>
            }
          </div>

          <h4 class="usage-form-title">Record Usage</h4>
          <app-reactive-form
            [fields]="usageFields()"
            [entity]="usageDraft()"
            [layout]="'column'"
            [submitButtonText]="'Submit'"
            [showAddEditOption]="false"
            (formSubmit)="onUsageSubmit($event)">
          </app-reactive-form>

          <h4 class="usage-form-title">Usage History</h4>
          @switch (usageHistoryState()) {
            @case ('loading') {
              <div class="history-loading"><div class="spinner-small"></div> Loading history…</div>
            }
            @case ('error') {
              <p class="muted history-error" style="text-align:center; padding: 12px;">Could not load history. Try again later.</p>
            }
            @case ('offline') {
              <p class="muted history-error" style="text-align:center; padding: 12px;">History unavailable offline.</p>
            }
            @case ('auth-required') {
              <p class="muted" style="text-align:center; padding: 12px;">Sign in to see usage history.</p>
            }
            @default {
              @if (usageHistory().length === 0) {
                <p class="muted" style="text-align:center; padding: 12px;">No usage recorded yet.</p>
              } @else {
                <ul class="history-list">
                  @for (entry of usageHistory(); track entry.id || $index) {
                    <li class="history-entry" [attr.data-event]="entry.eventType">
                      <div class="history-header">
                        <span class="history-event">{{ entry.eventType === 'checkout' ? 'Checked out' : (entry.eventType === 'checkin' ? 'Returned' : entry.eventType) }}</span>
                        <span class="history-time">{{ formatDate(entry.scannedAt || entry.timestamp) }}</span>
                      </div>
                      <div class="history-meta">
                        @if (entry.userName) { <span>By {{ entry.userName }}</span> }
                        @if (entry.location) { <span>&middot; {{ entry.location }}</span> }
                        @if (entry.purpose) { <span>&middot; {{ entry.purpose }}</span> }
                      </div>
                      @if (entry.comments) { <div class="history-comment">{{ entry.comments }}</div> }
                    </li>
                  }
                </ul>
              }
            }
          }
        }
      </div>
    }

    @if (mode() === 'list') {
      <div class="form-wrapper" style="max-width: 900px;">
        <div class="sticky-header">
          <button class="back-button" (click)="backToSelect()">&#x2190; Back</button>
          <span class="header-title">Inventory</span>
        </div>
        @if (loadingList()) {
          <div class="loading-row"><div class="spinner"></div> Loading...</div>
        } @else if (items().length === 0) {
          <div class="empty">No items found.</div>
        } @else {
          <div class="items-list">
            @for (item of items(); track item.id || $index) {
              <div class="list-item-row" [class.selected]="isSelected(item)">
                @if (nativePrintAvailable && item.qrToken) {
                  <label class="list-item-check" (click)="$event.stopPropagation()">
                    <input type="checkbox"
                           [checked]="isSelected(item)"
                           (change)="toggleSelection(item, $event)">
                  </label>
                }
                <button class="list-item" (click)="onItemClick(item)">
                  <div class="list-item-main">
                    <div class="list-item-title">{{ item.title }}</div>
                    <div class="list-item-meta">
                      @if (item.serialNumber) { <span>{{ item.serialNumber }}</span> }
                      @if (item.manufacturer || item.model) { <span>{{ item.manufacturer }} {{ item.model }}</span> }
                    </div>
                    <div class="list-item-location">
                      <svg viewBox="0 0 24 24" width="12" height="12" style="vertical-align: middle; margin-right: 3px; flex-shrink: 0;">
                        <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span>{{ item.currentLocation || item.locationName || 'Location unknown' }}</span>
                      @if (item.currentHolderName) {
                        <span class="list-item-holder">&middot; {{ item.currentHolderName }}</span>
                      }
                    </div>
                  </div>
                  <div class="status-badge" [attr.data-status]="item.statusName">{{ item.statusName }}</div>
                </button>
                @if (bluetoothAvailable && item.qrToken) {
                  <button class="list-item-print" (click)="printLabel(item); $event.stopPropagation()" title="Print via Brady">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                    </svg>
                  </button>
                }
                @if (nativePrintAvailable && item.qrToken) {
                  <button class="list-item-print list-item-print-system" (click)="printLabelNative(item); $event.stopPropagation()" title="Print via system printer">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                    </svg>
                  </button>
                }
              </div>
            }
          </div>
          @if (selectionCount() > 0 && nativePrintAvailable) {
            <div class="selection-bar">
              <span class="selection-count">{{ selectionCount() }} selected</span>
              <div class="selection-actions">
                <button class="btn-clear-sel" (click)="clearSelection()">Clear</button>
                <button class="btn-print-selected" (click)="printSelectedNative()">
                  <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle; margin-right: 6px;">
                    <path fill="currentColor" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                  </svg>
                  Print {{ selectionCount() }} label{{ selectionCount() === 1 ? '' : 's' }}
                </button>
              </div>
            </div>
          }
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; overflow-x: hidden; }
    .action-selector { display: flex; flex-direction: column; align-items: center; padding: 2rem 1rem; }
    .action-title { font-size: 1.6rem; font-weight: 700; margin: 0 0 0.25rem; }
    .action-subtitle { font-size: 1rem; color: var(--secondary-text, #888); margin: 0 0 2rem; }
    .action-cards { display: grid; grid-template-columns: 1fr; gap: 1rem; width: 100%; max-width: 400px; }
    .action-card { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; padding: 1.4rem 0.75rem;
      background: var(--card-background); border: 2px solid var(--border-color);
      border-radius: 12px; cursor: pointer; min-height: 120px; font-family: inherit; color: var(--primary-text); }
    .action-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .card-scan { border-color: #1976d2; }
    .card-new { border-color: #fb8c00; }
    .card-list { border-color: #26a69a; }
    .card-icon { width: 40px; height: 40px; }
    .action-card-label { font-size: 1.1rem; font-weight: 600; text-align: center; }
    .action-card-desc { font-size: 0.85rem; color: var(--secondary-text, #888); text-align: center; }
    .form-wrapper { max-width: 600px; margin: 0 auto; padding: 0 16px 16px; box-sizing: border-box; width: 100%; }
    .sticky-header { display: flex; align-items: center; gap: 12px; padding: 12px 0; position: sticky; top: 0;
      background: var(--primary-background); z-index: 10; }
    .back-button { background: none; border: none; color: var(--accent-color); cursor: pointer; font-size: 14px; font-family: inherit; }
    .header-title { font-size: 16px; font-weight: 600; }
    .item-summary { background: var(--card-background); border: 1px solid var(--border-color);
      border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .item-summary h3 { margin: 8px 0 4px; }
    .muted { color: var(--secondary-text); font-size: 13px; margin: 4px 0; }
    .item-status-badge { display: inline-block; font-size: 11px; padding: 4px 10px; border-radius: 10px; font-weight: 600; }
    .usage-form-title { margin-top: 16px; font-size: 14px; }
    .loading-row { display: flex; align-items: center; gap: 12px; padding: 24px; justify-content: center; color: var(--secondary-text); }
    .empty { padding: 32px; text-align: center; color: var(--secondary-text); }
    .items-list { display: flex; flex-direction: column; gap: 8px; }
    .list-item-row { display: flex; align-items: stretch; gap: 8px; }
    .list-item { flex: 1; display: flex; align-items: center; gap: 12px; padding: 12px 16px;
      border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-background);
      cursor: pointer; text-align: left; font-family: inherit; color: var(--primary-text); }
    .list-item:hover { border-color: var(--accent-color); }
    .list-item-print {
      display: flex; align-items: center; justify-content: center;
      width: 48px; min-height: 44px;
      border: 1px solid var(--border-color); border-radius: 8px;
      background: var(--card-background); color: var(--accent-color);
      cursor: pointer; padding: 0;
    }
    .list-item-print:hover { border-color: var(--accent-color); background: var(--hover-background); }
    .print-row { margin: 12px 0; }
    .btn-print {
      display: inline-flex; align-items: center;
      padding: 10px 16px;
      background: var(--accent-color); color: #ffffff;
      border: none; border-radius: 8px;
      font-size: 14px; font-weight: 500;
      cursor: pointer; min-height: 44px;
    }
    .btn-print:hover { background: var(--accent-color-hover); }
    .btn-print-system {
      background: var(--secondary-background);
      color: var(--primary-text);
      border: 1px solid var(--border-color);
      margin-left: 8px;
    }
    .btn-print-system:hover { background: var(--hover-background); border-color: var(--accent-color); }
    .list-item-print-system {
      color: var(--secondary-text);
    }
    .list-item-print-system:hover { border-color: var(--accent-color); color: var(--accent-color); }

    /* Multi-select checkbox column */
    .list-item-check {
      display: flex; align-items: center; justify-content: center;
      width: 32px; flex-shrink: 0;
      cursor: pointer;
    }
    .list-item-check input[type="checkbox"] {
      width: 18px; height: 18px;
      accent-color: var(--accent-color);
      cursor: pointer;
    }
    .list-item-row.selected {
      background: var(--selected-background);
      border-radius: 8px;
    }
    /* Inner .list-item button has its own opaque card background that would
       otherwise hide the parent's selected color across the main row area.
       Make the button transparent when the row is selected so the highlight
       spans the whole row (not just the 32px checkbox column). */
    .list-item-row.selected .list-item {
      background: transparent;
      border-color: var(--accent-color);
    }
    .list-item-row.selected .list-item-print,
    .list-item-row.selected .list-item-print-system {
      background: transparent;
      border-color: var(--accent-color);
    }

    /* Floating selection action bar at bottom of the list */
    .selection-bar {
      position: sticky; bottom: 0;
      display: flex; justify-content: space-between; align-items: center;
      gap: 12px; padding: 12px 16px; margin-top: 12px;
      background: var(--card-background);
      border: 1px solid var(--accent-color);
      border-radius: 10px;
      box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.12);
    }
    .selection-count {
      font-weight: 600; color: var(--primary-text);
    }
    .selection-actions { display: flex; gap: 8px; }
    .btn-clear-sel {
      padding: 8px 14px;
      background: transparent; color: var(--secondary-text);
      border: 1px solid var(--border-color); border-radius: 6px;
      cursor: pointer; font-family: inherit; font-size: 14px;
      min-height: 40px;
    }
    .btn-clear-sel:hover { color: var(--primary-text); border-color: var(--accent-color); }
    .btn-print-selected {
      display: inline-flex; align-items: center;
      padding: 8px 16px;
      background: var(--accent-color); color: #fff;
      border: 0; border-radius: 6px;
      font-family: inherit; font-size: 14px; font-weight: 600;
      cursor: pointer; min-height: 40px;
    }
    .btn-print-selected:hover { background: var(--accent-color-hover); }
    .print-unavailable {
      display: inline-block;
      padding: 8px 12px;
      font-size: 12px; color: var(--secondary-text);
      background: var(--secondary-background);
      border-radius: 6px;
    }
    .list-item-main { flex: 1; min-width: 0; }
    .list-item-title { font-size: 15px; font-weight: 500; }
    .list-item-meta { font-size: 12px; color: var(--secondary-text); display: flex; gap: 10px; flex-wrap: wrap; }
    .status-badge, .item-status-badge { font-size: 11px; padding: 3px 10px; border-radius: 10px; white-space: nowrap; }
    .status-badge[data-status="Available"], .item-status-badge[data-status="Available"] { background: #e8f5e9; color: #2e7d32; }
    .status-badge[data-status="Checked Out"], .item-status-badge[data-status="Checked Out"] { background: #e3f2fd; color: #1565c0; }
    .status-badge[data-status="Missing"], .item-status-badge[data-status="Missing"] { background: #ffebee; color: #c62828; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex;
      align-items: center; justify-content: center; z-index: 9999; }
    .overlay-card { background: var(--primary-background, #fff); border-radius: 16px; padding: 32px;
      text-align: center; min-width: 280px; max-width: 90vw; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
    .overlay-card.success .overlay-icon { color: #4caf50; }
    .overlay-card.error .overlay-icon { color: #f44336; }
    .overlay-icon { font-size: 48px; display: block; margin-bottom: 12px; }
    .overlay-text { font-size: 16px; margin: 0 0 16px; }
    .overlay-btn { padding: 10px 32px; background: var(--accent-color); color: white; border: none;
      border-radius: 8px; font-size: 15px; cursor: pointer; font-family: inherit; }
    .spinner { width: 40px; height: 40px; border: 4px solid var(--border-color, #ccc);
      border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Enhanced detail view */
    .summary-header-row {
      display: flex; justify-content: space-between; align-items: center;
      gap: 8px; margin-bottom: 8px;
    }
    .edit-btn {
      display: inline-flex; align-items: center;
      padding: 6px 12px;
      background: var(--card-background);
      color: var(--accent-color);
      border: 1px solid var(--border-color);
      border-radius: 6px; cursor: pointer;
      font-family: inherit; font-size: 13px; font-weight: 500;
      min-height: 32px;
    }
    .edit-btn:hover { background: var(--hover-background); border-color: var(--accent-color); }
    .detail-grid { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
    .detail-row {
      display: flex; justify-content: space-between; gap: 12px;
      font-size: 13px; padding: 4px 0;
      border-bottom: 1px solid var(--border-color);
    }
    .detail-row:last-child { border-bottom: 0; }
    .detail-label { color: var(--secondary-text); flex-shrink: 0; }

    /* Location row in list */
    .list-item-location {
      display: flex; align-items: center; gap: 3px;
      font-size: 12px; color: var(--secondary-text);
      margin-top: 4px;
    }
    .list-item-holder { color: var(--accent-color); font-weight: 500; }

    /* Usage history */
    .history-list {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column; gap: 8px;
    }
    .history-entry {
      background: var(--card-background);
      border: 1px solid var(--border-color);
      border-left: 3px solid var(--secondary-text);
      border-radius: 8px;
      padding: 10px 12px;
    }
    .history-entry[data-event="checkout"] { border-left-color: #1976d2; }
    .history-entry[data-event="checkin"] { border-left-color: #2e7d32; }
    .history-header {
      display: flex; justify-content: space-between; align-items: center;
      gap: 8px; margin-bottom: 4px;
    }
    .history-event { font-weight: 600; font-size: 13px; color: var(--primary-text); }
    .history-time { font-size: 11px; color: var(--secondary-text); font-family: 'Consolas', 'Monaco', monospace; }
    .history-meta {
      font-size: 12px; color: var(--secondary-text);
      display: flex; flex-wrap: wrap; gap: 4px;
    }
    .history-comment {
      margin-top: 6px; font-size: 12px; color: var(--primary-text);
      background: var(--secondary-background); padding: 6px 8px; border-radius: 4px;
    }
    .history-loading {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; padding: 16px; color: var(--secondary-text); font-size: 13px;
    }
    .spinner-small {
      width: 16px; height: 16px;
      border: 2px solid var(--border-color); border-top-color: var(--accent-color);
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
  `]
})
export class InventoryComponent implements OnInit {
  private serverApi = inject(ServerApiService);
  serverStatus = inject(ServerStatusService);
  private authService = inject(AuthService);
  private orchestrator = inject(SubmissionOrchestratorService);
  private userSetup = inject(UserSetupService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  qrScannerService = inject(QrScannerService);
  private bradyModal = inject(BradyPrinterModalService);
  private nativePrint = inject(NativePrintService);

  // Web Bluetooth is unavailable on iOS Safari / any WebKit-based iOS browser.
  // Show a helpful hint instead of a dead button on those devices.
  bluetoothAvailable = typeof navigator !== 'undefined' && !!(navigator as any).bluetooth;
  // Native print via window.print() works everywhere the browser supports it —
  // routes through OS to any installed printer (label printer or sheet paper).
  nativePrintAvailable = typeof window !== 'undefined' && typeof window.print === 'function';

  mode = signal<ViewMode>('select');
  fields = signal<FormField[]>([]);
  usageFields = signal<FormField[]>(inventoryUsageFormFields());
  draftEntity = signal<any>({});
  usageDraft = signal<any>({ eventType: 'checkout' });
  scannedItem = signal<any>(null);
  items = signal<any[]>([]);
  loadingList = signal(false);
  // Multi-select for bulk print (native / system printer only — Brady doesn't
  // support batch in this feature). Stored as a Set of qrToken because id can
  // be null in PA-fallback rows, but every printable item has a qrToken.
  selectedTokens = signal<Set<string>>(new Set());
  submitState = signal<SubmitState>('idle');
  submitMessage = signal('');
  // Usage history for the current scanned item — lazily loaded on scan/click,
  // rendered in the scan-result view. Empty until fetched.
  usageHistory = signal<any[]>([]);
  // 'loading' → spinner, 'ok' → show history (empty state uses this too),
  // 'error' → transient hub failure (500/timeout), 'offline' → hub known
  // unreachable, 'auth-required' → user is not logged in. Distinct so the
  // template can show a distinct message per case instead of a misleading
  // "No usage recorded yet."
  usageHistoryState = signal<'loading' | 'ok' | 'error' | 'offline' | 'auth-required'>('ok');
  // On successful EDIT (not new-item creation) dismissResult should return
  // to the scan-result detail view so the user sees the freshly-merged
  // fields, instead of bouncing to the top-level select screen. Set true in
  // onSubmit's isEdit success branch, consumed + cleared by dismissResult.
  private editSuccessPending = false;

  private typeOptions: Option[] = [];

  ngOnInit(): void {
    this.loadTypes();
    this.fields.set(inventoryFormFields(this.typeOptions));

    // Deep link: /inventory/form?scan={qrToken} — opened by scanning the QR
    // label with a phone's native camera (hub redirects /qr/inv/{token} here).
    const scanToken = this.route.snapshot.queryParamMap.get('scan');
    if (scanToken) {
      this.handleScan(scanToken);
    }
  }

  private loadTypes(): void {
    const cached = localStorage.getItem('pwa_inventory_types');
    if (cached) {
      try { this.setTypeOptions(JSON.parse(cached)); } catch {}
    }
    if (this.typeOptions.length === 0) {
      this.setTypeOptions([
        { id: 0, name: 'Tools' },
        { id: 0, name: 'Safety Equipment' },
        { id: 0, name: 'Spare Parts' },
        { id: 0, name: 'Test Equipment' }
      ]);
    }
    this.serverApi.getInventoryTypes().subscribe({
      next: types => {
        if (types && types.length > 0) {
          this.setTypeOptions(types);
          localStorage.setItem('pwa_inventory_types', JSON.stringify(types));
        }
      },
      error: () => {
        // Server offline — fall back to static JSON published to GitHub Pages
        this.http.get<{ id: number; name: string }[]>('data/inventory-types.json').subscribe({
          next: types => {
            if (types && types.length > 0) {
              this.setTypeOptions(types);
              localStorage.setItem('pwa_inventory_types', JSON.stringify(types));
            }
          },
          error: () => { /* already showing cached/default values */ }
        });
      }
    });
  }

  private setTypeOptions(types: { id: number; name: string }[]): void {
    this.typeOptions = types.map(t => ({ value: t.name, label: t.name }));
    this.fields.set(inventoryFormFields(this.typeOptions));
  }

  selectNew(): void {
    this.fields.set(inventoryFormFields(this.typeOptions));
    this.draftEntity.set({});
    this.mode.set('new');
  }

  openScanner(): void {
    this.qrScannerService.openScanner().subscribe(result => this.handleScan(result));
  }

  private extractQrToken(scanned: string): string {
    const s = (scanned || '').trim();
    // Format A: current PWA labels — https://<pwa>/inventory/form?scan=<token>
    try {
      const url = new URL(s);
      const scan = url.searchParams.get('scan');
      if (scan) return decodeURIComponent(scan);
    } catch { /* not a URL — fall through */ }
    // Format B: legacy/desktop hub URL — https://<hub>/qr/inv/<token>
    const legacyMatch = s.match(/qr\/inv\/([^/?#]+)/i);
    if (legacyMatch) return decodeURIComponent(legacyMatch[1]);
    // Format C: bare token
    return s;
  }

  private handleScan(result: string): void {
    // Extract token from the scanned payload. Labels printed by this app encode
    //   https://<pwa>/inventory/form?scan=<token>
    // Older/desktop labels encode
    //   https://<hub>/qr/inv/<token>
    // The in-app ZXing scanner passes the raw string here (no router involved),
    // so both must be parsed. Fall back to trimmed raw for a bare token.
    const token = this.extractQrToken(result);

    this.serverApi.getInventoryItemByQr(token).subscribe({
      next: item => {
        if (item) {
          this.setScannedItem(item);
        } else {
          alert('Item not found for QR token: ' + token);
        }
      },
      error: () => alert('Could not look up item. Server may be offline.')
    });
  }

  /** Central handler for landing on the scan-result view — sets the item,
   *  primes the usage draft based on current status, and kicks off the
   *  usage-history fetch (best-effort; empty on failure). */
  private setScannedItem(item: any): void {
    this.scannedItem.set(item);
    this.usageDraft.set({
      eventType: item.statusName === 'Checked Out' ? 'checkin' : 'checkout',
      location: item.currentLocation || ''
    });
    this.mode.set('scan-result');
    this.loadUsageHistory(item);
  }

  // Monotonic counter for in-flight history fetches. A slower older request
  // resolving after a newer one would otherwise overwrite the current item's
  // history with a different tool's — user sees wrong data. Bump on each call.
  private historyFetchSeq = 0;

  private loadUsageHistory(item: any): void {
    this.usageHistory.set([]);
    // Distinguish "server error" / "offline" / "signed out" from a real empty
    // history so the UI can render an accurate message. Empty is only shown
    // when the fetch actually succeeded with zero entries.
    if (!this.authService.isLoggedIn()) {
      this.usageHistoryState.set('auth-required');
      return;
    }
    if (!item?.id) {
      // No local id — item came from PA fallback, hub doesn't know about it.
      this.usageHistoryState.set('ok');
      return;
    }
    if (!this.serverStatus.isOnline()) {
      this.usageHistoryState.set('offline');
      return;
    }
    const attemptId = ++this.historyFetchSeq;
    this.usageHistoryState.set('loading');
    this.serverApi.getInventoryUsageHistory(item.id).subscribe({
      next: entries => {
        if (attemptId !== this.historyFetchSeq) return; // superseded by a newer scan
        this.usageHistory.set(entries || []);
        this.usageHistoryState.set('ok');
      },
      error: () => {
        if (attemptId !== this.historyFetchSeq) return;
        this.usageHistoryState.set('error');
      },
    });
  }

  /** Enter edit mode for the currently-scanned item. Pre-populates the
   *  standard "new item" form with existing values so the user can tweak
   *  and save. On submit, updateInventoryItem is called instead of create. */
  editScannedItem(): void {
    const item = this.scannedItem();
    if (!item) return;
    this.fields.set(inventoryFormFields(this.typeOptions));
    this.draftEntity.set({
      id: item.id,
      sharepointId: item.sharepointId,
      qrToken: item.qrToken,
      localUuid: item.localUuid,
      itemTypeName: item.itemTypeName,
      statusName: item.statusName,
      title: item.title,
      description: item.description,
      serialNumber: item.serialNumber,
      manufacturer: item.manufacturer,
      model: item.model,
      locationName: item.locationName,
    });
    this.mode.set('edit');
  }

  cancelEdit(): void {
    // Go back to scan-result if we came from there, else back to list/select.
    this.mode.set(this.scannedItem() ? 'scan-result' : 'select');
  }

  /** Format an ISO-ish datetime string for display. Falls back to the raw
   *  value if parsing fails (belt-and-suspenders — server should always send
   *  ISO but a stray ms-precision variant shouldn't break the whole panel). */
  formatDate(raw: string | null | undefined): string {
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  openList(): void {
    this.mode.set('list');
    // Anonymous users still can't see the list (no auth).
    if (!this.authService.isLoggedIn()) {
      this.items.set([]);
      return;
    }
    // NOTE: intentionally does NOT gate on serverStatus.isOnline(). The
    // orchestrator has a PA fallback that reads directly from SharePoint
    // when the hub is unreachable, so gating here on the hub's status
    // would prevent the fallback from ever running. Let the orchestrator
    // decide: it tries hub first, falls through to PA, returns empty as
    // a last resort.
    this.loadingList.set(true);
    this.orchestrator.getInventoryItems().subscribe({
      next: items => {
        const fresh = items || [];
        this.items.set(fresh);
        this.loadingList.set(false);
        // Prune any selection tokens that no longer exist in the fresh list.
        // Without this the sticky selection bar can show "N selected" for
        // items that were deleted server-side (or dropped by a PA-fallback
        // partial refresh), then print fewer labels than the count claimed.
        this.pruneSelection(fresh);
      },
      error: () => {
        this.items.set([]);
        this.loadingList.set(false);
        this.pruneSelection([]);
      }
    });
  }

  private pruneSelection(currentItems: any[]): void {
    const current = this.selectedTokens();
    if (current.size === 0) return;
    const alive = new Set<string>(currentItems.map(it => it?.qrToken).filter((t: any) => !!t));
    const next = new Set<string>();
    let dropped = false;
    current.forEach(t => { if (alive.has(t)) next.add(t); else dropped = true; });
    if (dropped) this.selectedTokens.set(next);
  }

  onItemClick(item: any): void {
    // Open scan-result view as if scanned — also pulls usage history.
    this.setScannedItem(item);
  }

  backToSelect(): void {
    this.mode.set('select');
    this.scannedItem.set(null);
  }

  onDraftChange(formData: any): void {
    try {
      const { attachments, ...storable } = formData;
      localStorage.setItem('pwa_inventory_draft', JSON.stringify(storable));
    } catch {}
  }

  onSubmit(formData: any): void {
    this.submitState.set('submitting');
    const userData = this.userSetup.getUserData();
    const existing = this.draftEntity();
    const isEdit = !!(existing?.id || existing?.sharepointId);

    // When editing an existing item, preserve id/sharepointId/qrToken/localUuid
    // so the server routes to update() not create(). When creating, generate
    // a fresh localUuid for idempotent submit tracking.
    const payload = {
      ...(isEdit ? {
        id: existing.id,
        sharepointId: existing.sharepointId,
        qrToken: existing.qrToken,
        localUuid: existing.localUuid || crypto.randomUUID(),
      } : {
        localUuid: crypto.randomUUID(),
      }),
      itemTypeName: formData.itemTypeName || '',
      statusName: isEdit ? (existing.statusName || 'Available') : 'Available',
      title: formData.title || '',
      description: formData.description || '',
      serialNumber: formData.serialNumber || '',
      manufacturer: formData.manufacturer || '',
      model: formData.model || '',
      locationName: formData.locationName || '',
      submitterName: userData?.name || '',
      submitterEmail: userData?.email || '',
      submitterPhone: userData?.phone || '',
      attachments: formData.attachments || []
    };

    const call$ = isEdit
      ? this.orchestrator.updateInventoryItem(payload)
      : this.orchestrator.submitInventoryItem(payload);

    call$.subscribe({
      next: result => {
        if (result.success) {
          if (!isEdit) localStorage.removeItem('pwa_inventory_draft');
          this.submitState.set('success');
          this.submitMessage.set(result.message || (isEdit ? 'Item updated' : 'Item created successfully'));
          // On successful edit, refresh the scanned item with the new fields so
          // the detail view reflects the change when the user dismisses success.
          if (isEdit && this.scannedItem()) {
            this.scannedItem.set({ ...this.scannedItem(), ...payload });
            this.editSuccessPending = true;
          }
        } else {
          this.submitState.set('error');
          this.submitMessage.set(result.message || 'Submission failed');
        }
      },
      error: () => {
        this.submitState.set('error');
        this.submitMessage.set(isEdit ? 'Update failed.' : 'Submission failed. Item saved locally.');
      }
    });
  }

  onUsageSubmit(formData: any): void {
    if (!this.scannedItem()) return;
    this.submitState.set('submitting');
    const userData = this.userSetup.getUserData();

    const payload = {
      localUuid: crypto.randomUUID(),
      qrToken: this.scannedItem().qrToken,
      inventoryItemId: this.scannedItem().id,
      userName: userData?.name || '',
      userEmail: userData?.email || '',
      location: formData.location || '',
      purpose: formData.purpose || '',
      comments: formData.comments || '',
      eventType: formData.eventType || 'checkout',
      scannedAt: new Date().toISOString()
    };

    this.orchestrator.recordInventoryUsage(payload).subscribe({
      next: result => {
        if (result.success) {
          this.submitState.set('success');
          this.submitMessage.set('Usage recorded.');
        } else {
          this.submitState.set('error');
          this.submitMessage.set(result.message || 'Failed to record usage.');
        }
      },
      error: () => {
        this.submitState.set('error');
        this.submitMessage.set('Failed to record usage.');
      }
    });
  }

  dismissResult(): void {
    const wasSuccess = this.submitState() === 'success';
    const wasEdit = this.editSuccessPending;
    this.editSuccessPending = false;
    this.submitState.set('idle');
    this.submitMessage.set('');
    if (!wasSuccess) return;
    if (wasEdit) {
      // After a successful edit the merged scannedItem holds the fresh
      // values; return to the detail view so the user sees them, instead of
      // bouncing to the top-level select screen and forcing a re-scan.
      this.mode.set('scan-result');
    } else {
      this.backToSelect();
    }
  }

  /**
   * Open the Brady printer modal pre-loaded with this item's label data.
   * Line 1 = serial/title, line 2 = manufacturer + model. QR encodes the
   * PWA deep-link so a phone camera scan reopens this same item.
   */
  printLabel(item: any): void {
    if (!item) return;
    const { line1, line2, qrData } = this.labelDataFor(item);
    this.bradyModal.openWithData({ line1, line2, withQr: !!qrData, qrData });
  }

  /**
   * Print via OS/system printer (window.print()). Uses whichever printer
   * Windows has installed; user picks the target in the browser print dialog.
   * Works on iOS/AirPrint where Web Bluetooth (Brady) is unavailable.
   */
  printLabelNative(item: any): void {
    if (!item) return;
    const { line1, line2, qrData } = this.labelDataFor(item);
    this.nativePrint.openWithData({ line1, line2, qrData });
  }

  // === Multi-select for bulk system print ==================================

  isSelected(item: any): boolean {
    return !!item?.qrToken && this.selectedTokens().has(item.qrToken);
  }

  toggleSelection(item: any, event?: Event): void {
    if (event) event.stopPropagation();
    if (!item?.qrToken) return; // only items with a qrToken can be printed
    const next = new Set(this.selectedTokens());
    if (next.has(item.qrToken)) next.delete(item.qrToken);
    else next.add(item.qrToken);
    this.selectedTokens.set(next);
  }

  clearSelection(): void {
    this.selectedTokens.set(new Set());
  }

  selectionCount(): number {
    return this.selectedTokens().size;
  }

  /** Open the native-print modal in bulk mode with every currently-selected
   *  item's label payload. Items without a qrToken are impossible (button is
   *  gated) so we don't need to filter here beyond mapping.
   *  Selection is cleared right after the modal opens so the sticky bar
   *  disappears (no accidental double-print by clicking again). */
  printSelectedNative(): void {
    const selected = this.selectedTokens();
    if (selected.size === 0) return;
    const payloads = this.items()
      .filter(it => it?.qrToken && selected.has(it.qrToken))
      .map(it => this.labelDataFor(it));
    if (payloads.length === 0) return;
    this.nativePrint.openWithList(payloads);
    this.clearSelection();
  }

  private labelDataFor(item: any): { line1: string; line2: string; qrData: string | undefined } {
    // Label layout is QR + serial + name.
    // line1 = serial (falls back to title if the item has no serial number
    //   — better than leaving a blank line above the name).
    // line2 = name (item.title). Suppressed when it would duplicate line1.
    const serial = item.serialNumber || '';
    const name = item.title || '';
    const line1 = serial || name;
    const line2 = name && name !== line1 ? name : '';
    const qrData = item.qrToken
      ? `https://jacksongeneration.github.io/permits/inventory/form?scan=${encodeURIComponent(item.qrToken)}`
      : undefined;
    return { line1, line2, qrData };
  }
}
