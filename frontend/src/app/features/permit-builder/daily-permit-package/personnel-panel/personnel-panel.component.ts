import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonnelSignEntry } from '../../../../models/permits/dailt-permit-package.model';

@Component({
  selector: 'app-personnel-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="personnel-container">

      <!-- FOREMAN SIGN-ON (localhost only, must be first) -->
      <div *ngIf="isActive() && !hasForemanSignedOn() && isLocalhost" class="foreman-section">
        <div class="section-label foreman-label">Foreman Sign-On (Required First)</div>
        <div class="form-row">
          <input type="text" [(ngModel)]="foremanName" placeholder="Foreman name" class="form-input" />
          <input type="text" [(ngModel)]="foremanCompany" placeholder="Company" class="form-input company" />
          <button class="btn foreman-sign-on" [disabled]="!foremanName.trim()" (click)="doForemanSignOn()">Foreman Sign On</button>
        </div>
      </div>

      <div *ngIf="isActive() && !hasForemanSignedOn() && !isLocalhost" class="notice">
        Foreman must sign on from the control room before workers can sign on.
      </div>

      <!-- WORKER SIGN-ON (only after foreman) -->
      <div class="sign-on-form" *ngIf="isActive() && hasForemanSignedOn()">
        <div class="form-row">
          <input type="text" [(ngModel)]="newName" placeholder="Person name" class="form-input" />
          <select [(ngModel)]="newRole" class="form-select">
            <option value="">Role...</option>
            <option value="Worker">Worker</option>
            <option value="Safety Officer">Safety Officer</option>
            <option value="Fire Watch">Fire Watch</option>
            <option value="Control Authority">Control Authority</option>
          </select>
          <input type="text" [(ngModel)]="newCompany" placeholder="Company" class="form-input company" />
          <button class="btn sign-on" [disabled]="!newName.trim()" (click)="doSignOn()">Sign On</button>
        </div>
      </div>

      <!-- Signed-on list -->
      <div class="section-label" *ngIf="signedOn().length > 0">Signed On ({{ signedOn().length }})</div>
      <div class="personnel-list">
        <!-- Foreman card -->
        <div *ngIf="foremanEntry()" class="person-card foreman-card">
          <div class="person-info">
            <span class="person-name">{{ foremanEntry()!.personName }}</span>
            <span class="person-role foreman-badge">Foreman</span>
            <span class="person-company" *ngIf="foremanEntry()!.company">{{ foremanEntry()!.company }}</span>
            <span class="person-time">Since {{ formatTime(foremanEntry()!.signOnTime) }}</span>
          </div>
          <button class="btn close-out-btn" *ngIf="isActive() && isLocalhost" (click)="showCloseOut = true">Close Out</button>
        </div>
        <!-- Worker cards -->
        <div *ngFor="let entry of workerSignedOn()" class="person-card signed-on">
          <div class="person-info">
            <span class="person-name">{{ entry.personName }}</span>
            <span class="person-role" *ngIf="entry.personRole">{{ entry.personRole }}</span>
            <span class="person-company" *ngIf="entry.company">{{ entry.company }}</span>
            <span class="person-time">Since {{ formatTime(entry.signOnTime) }}</span>
          </div>
          <div class="sign-off-area" *ngIf="isActive()">
            <div *ngIf="signingOffPerson() === entry.personName" class="sign-off-inline">
              <input type="text" [(ngModel)]="signOffComment" placeholder="Comments (optional)" class="form-input" (keydown.enter)="confirmSignOff(entry.personName)" />
              <button class="btn sign-off" (click)="confirmSignOff(entry.personName)">Confirm</button>
              <button class="btn cancel" (click)="cancelSignOff()">X</button>
            </div>
            <button *ngIf="signingOffPerson() !== entry.personName" class="btn sign-off" (click)="startSignOff(entry.personName)">Sign Off</button>
          </div>
        </div>
      </div>

      <div class="empty-message" *ngIf="signedOn().length === 0 && signedOff().length === 0">
        No personnel records yet.
      </div>

      <!-- CLOSE-OUT QUESTIONNAIRE (inline, for foreman) -->
      <div *ngIf="showCloseOut" class="close-out-form">
        <div class="section-label">Foreman Close-Out</div>

        <div class="form-group">
          <label>Is work completed?</label>
          <div class="radio-row">
            <label><input type="radio" name="workCompleted" [value]="true" [(ngModel)]="closeOutWorkCompleted"> Yes</label>
            <label><input type="radio" name="workCompleted" [value]="false" [(ngModel)]="closeOutWorkCompleted"> No</label>
          </div>
        </div>

        <div *ngIf="closeOutWorkCompleted === false" class="form-group">
          <label>When will work continue?</label>
          <div class="form-row">
            <input type="date" [(ngModel)]="closeOutContinueDate" class="form-input" />
            <input type="time" [(ngModel)]="closeOutContinueTime" class="form-input" style="max-width:140px" />
          </div>
        </div>

        <div *ngIf="closeOutWorkCompleted === false" class="form-group">
          <label>Has scope changed?</label>
          <div class="radio-row">
            <label><input type="radio" name="scopeChanged" [value]="true" [(ngModel)]="closeOutScopeChanged"> Yes</label>
            <label><input type="radio" name="scopeChanged" [value]="false" [(ngModel)]="closeOutScopeChanged"> No</label>
          </div>
        </div>

        <div *ngIf="closeOutScopeChanged === true" class="form-group">
          <label>Describe new scope</label>
          <textarea [(ngModel)]="closeOutScopeDetails" class="form-input" rows="3" placeholder="Updated work scope..."></textarea>
        </div>

        <div class="form-group">
          <label>Comments</label>
          <textarea [(ngModel)]="closeOutComments" class="form-input" rows="2" placeholder="Any comments..."></textarea>
        </div>

        <div class="form-actions">
          <button class="btn foreman-sign-on" (click)="submitCloseOut()">Submit Close-Out</button>
          <button class="btn cancel" (click)="showCloseOut = false">Cancel</button>
        </div>
      </div>

      <!-- History -->
      <div *ngIf="signedOff().length > 0">
        <div class="section-label history-label" (click)="showHistory = !showHistory">
          History ({{ signedOff().length }}) {{ showHistory ? '&#9662;' : '&#9656;' }}
        </div>
        <div class="personnel-list" *ngIf="showHistory">
          <div *ngFor="let entry of signedOff()" class="person-card signed-off">
            <div class="person-info">
              <span class="person-name">{{ entry.personName }}</span>
              <span class="person-role" *ngIf="entry.personRole" [class.foreman-badge]="entry.foreman">{{ entry.personRole }}</span>
              <span class="person-time">{{ formatTime(entry.signOnTime) }} - {{ formatTime(entry.signOffTime!) }}</span>
              <span class="person-comments" *ngIf="entry.signOffComments">{{ entry.signOffComments }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; }
    .personnel-container { padding: 12px; }

    .foreman-section { margin-bottom: 16px; padding: 12px; background: rgba(255, 152, 0, 0.08); border: 1px solid #ff9800; border-radius: 8px; }
    .foreman-label { color: #ffb74d !important; }
    .notice { color: #aaa; font-style: italic; padding: 16px; text-align: center; background: #16213e; border-radius: 6px; margin-bottom: 12px; }

    .sign-on-form { margin-bottom: 16px; }
    .form-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .form-input {
      padding: 8px 10px; border: 1px solid #333; border-radius: 4px;
      background: #0f3460; color: #e0e0e0; font-size: 13px; flex: 1; min-width: 120px;
    }
    .form-input.company { flex: 0.7; }
    .form-select {
      padding: 8px 10px; border: 1px solid #333; border-radius: 4px;
      background: #0f3460; color: #e0e0e0; font-size: 13px; min-width: 130px;
    }
    .form-input:focus, .form-select:focus { outline: none; border-color: #533483; }

    .section-label { color: #aaa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-weight: 600; }
    .history-label { cursor: pointer; margin-top: 16px; }
    .history-label:hover { color: #ddd; }

    .personnel-list { display: flex; flex-direction: column; gap: 6px; }
    .person-card { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 6px; border: 1px solid #1a1a3e; }
    .person-card.signed-on { background: rgba(45, 138, 78, 0.1); border-color: #2d8a4e; }
    .person-card.foreman-card { background: rgba(255, 152, 0, 0.1); border-color: #ff9800; }
    .person-card.signed-off { background: #16213e; opacity: 0.7; }

    .person-info { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .person-name { color: #e0e0e0; font-weight: 600; font-size: 13px; }
    .person-role { padding: 1px 8px; border-radius: 10px; font-size: 11px; background: rgba(83, 52, 131, 0.3); color: #b388ff; }
    .foreman-badge { background: rgba(255, 152, 0, 0.3) !important; color: #ffb74d !important; }
    .person-company { color: #888; font-size: 12px; }
    .person-time { color: #666; font-size: 11px; }
    .person-comments { color: #aaa; font-size: 11px; font-style: italic; }

    .btn { padding: 6px 14px; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 12px; white-space: nowrap; }
    .btn.sign-on { background: #2d8a4e; }
    .btn.foreman-sign-on { background: #e67e22; }
    .btn.sign-off { background: #c0392b; }
    .btn.close-out-btn { background: #e67e22; }
    .btn.cancel { background: #555; }
    .btn:hover { opacity: 0.85; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .close-out-form { margin-top: 16px; padding: 16px; background: #16213e; border: 1px solid #e67e22; border-radius: 8px; }
    .form-group { margin-bottom: 12px; }
    .form-group label { color: #ccc; font-size: 13px; display: block; margin-bottom: 4px; }
    .radio-row { display: flex; gap: 16px; }
    .radio-row label { color: #ddd; font-size: 13px; display: flex; align-items: center; gap: 4px; }
    .form-actions { display: flex; gap: 10px; margin-top: 16px; }

    .sign-off-area { display: flex; align-items: center; }
    .sign-off-inline { display: flex; gap: 4px; align-items: center; }
    .sign-off-inline .form-input { min-width: 140px; flex: 1; padding: 5px 8px; font-size: 12px; }

    .empty-message { color: #666; font-style: italic; padding: 20px 0; text-align: center; }
  `]
})
export class PersonnelPanelComponent {
  personnel = input<PersonnelSignEntry[]>([]);
  packageStatus = input<string>('Building');

  foremanSignOnEvent = output<{ personName: string; company: string }>();
  foremanCloseOutEvent = output<{ workCompleted: boolean; comments: string; scopeChanged: boolean; scopeDetails: string; continueDate: string; continueTime: string }>();
  signOnEvent = output<{ personName: string; personRole: string; company: string }>();
  signOffEvent = output<{ personName: string; comments: string }>();

  // Foreman sign-on fields
  foremanName = '';
  foremanCompany = '';

  // Worker sign-on fields
  newName = '';
  newRole = '';
  newCompany = '';

  // Close-out fields
  showCloseOut = false;
  closeOutWorkCompleted: boolean | null = null;
  closeOutComments = '';
  closeOutScopeChanged: boolean | null = null;
  closeOutScopeDetails = '';
  closeOutContinueDate = '';
  closeOutContinueTime = '';

  showHistory = false;

  isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  isActive = computed(() => {
    const status = this.packageStatus();
    return status === 'Active' || status === 'Test';
  });

  foremanEntry = computed(() =>
    (this.personnel() || []).find(e => e.foreman && !e.signOffTime) ?? null
  );

  hasForemanSignedOn = computed(() => !!this.foremanEntry());

  signedOn = computed(() =>
    (this.personnel() || []).filter(e => !e.signOffTime)
  );

  workerSignedOn = computed(() =>
    (this.personnel() || []).filter(e => !e.foreman && !e.signOffTime)
  );

  signedOff = computed(() =>
    (this.personnel() || []).filter(e => !!e.signOffTime).reverse()
  );

  doForemanSignOn() {
    if (!this.foremanName.trim()) return;
    this.foremanSignOnEvent.emit({
      personName: this.foremanName.trim(),
      company: this.foremanCompany.trim()
    });
    this.foremanName = '';
    this.foremanCompany = '';
  }

  doSignOn() {
    if (!this.newName.trim()) return;
    this.signOnEvent.emit({
      personName: this.newName.trim(),
      personRole: this.newRole,
      company: this.newCompany.trim()
    });
    this.newName = '';
    this.newRole = '';
    this.newCompany = '';
  }

  signingOffPerson = signal<string | null>(null);
  signOffComment = '';

  startSignOff(personName: string) {
    this.signingOffPerson.set(personName);
    this.signOffComment = '';
  }

  confirmSignOff(personName: string) {
    this.signOffEvent.emit({ personName, comments: this.signOffComment });
    this.signingOffPerson.set(null);
    this.signOffComment = '';
  }

  cancelSignOff() {
    this.signingOffPerson.set(null);
    this.signOffComment = '';
  }

  submitCloseOut() {
    this.foremanCloseOutEvent.emit({
      workCompleted: this.closeOutWorkCompleted === true,
      comments: this.closeOutComments,
      scopeChanged: this.closeOutScopeChanged === true,
      scopeDetails: this.closeOutScopeDetails,
      continueDate: this.closeOutContinueDate,
      continueTime: this.closeOutContinueTime
    });
    this.showCloseOut = false;
    this.closeOutWorkCompleted = null;
    this.closeOutComments = '';
    this.closeOutScopeChanged = null;
    this.closeOutScopeDetails = '';
    this.closeOutContinueDate = '';
    this.closeOutContinueTime = '';
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  }
}
