import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import { QrGeneratorComponent } from '../../shared/qr-generator/qr-generator.component';
import {
  PwaQualificationDefinitionDto,
  PwaQualificationDto,
  PwaQualificationPersonDto,
  PwaQualificationSeedUserDto,
  ServerApiService
} from '../../services/server-api.service';
import { PowerAutomateService } from '../../services/power-automate.service';
import { GlobalMessageService } from '../../services/global-message.service';

interface QualificationReportRow {
  trackKey: string;
  personName: string;
  personEmail?: string;
  windowsUsername?: string;
  role?: string;
  qualificationName: string;
  qualificationCode?: string;
  qualificationType?: string;
  issuedDate?: string;
  expirationDate?: string;
  credentialNumber?: string;
  issuer?: string;
  notes?: string;
  daysRemaining: number | null;
  statusKey: 'overdue' | 'due-soon' | 'valid' | 'no-expiration';
  statusLabel: string;
}

interface QualificationReportSummary {
  total: number;
  overdue: number;
  dueSoon: number;
  valid: number;
  noExpiration: number;
}

@Component({
  selector: 'app-qualification-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, QrGeneratorComponent],
  template: `
    <app-main-layout [header]="'Qualification Management'">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>

      <ng-container main-content>
        <main class="manager-shell">
          <section class="toolbar">
            <div>
              <h1>Qualification Management</h1>
              @if (statusMessage()) { <p>{{ statusMessage() }}</p> }
            </div>
            <div class="toolbar-actions">
              <button type="button" (click)="provision()" [disabled]="busy()">Provision Lists</button>
              <button type="button" (click)="seedPlantUsers()" [disabled]="busy()">Seed Plant Users</button>
              <button type="button" (click)="load()" [disabled]="busy()">Refresh</button>
            </div>
          </section>

          <p class="page-note">
            Provision Lists creates or refreshes the SharePoint lists, Seed Plant Users copies active Plant employees into the employee list, and Refresh reloads the current server or Power Automate data.
          </p>

          <div class="tabs" role="tablist" aria-label="Qualification management sections">
            <button
              type="button"
              class="tab"
              role="tab"
              [class.active]="activeTab() === 'people'"
              (click)="setTab('people')">
              <span class="tab-glyph" aria-hidden="true">👥</span>
              <span class="tab-label">People</span>
            </button>
            <button
              type="button"
              class="tab"
              role="tab"
              [class.active]="activeTab() === 'catalog'"
              (click)="setTab('catalog')">
              <span class="tab-glyph" aria-hidden="true">🏷️</span>
              <span class="tab-label">Quals</span>
            </button>
            <button
              type="button"
              class="tab"
              role="tab"
              [class.active]="activeTab() === 'report'"
              (click)="setTab('report')">
              <span class="tab-label">Reports</span>
            </button>
          </div>

          @if (busy()) {
            <div class="busy-row">Working...</div>
          }

          @if (activeTab() === 'people') {
            <section class="tab-panel">
              <p class="tab-note">
                Use People to review active Plant employees. Click a row to open a dialog with the person's QR and qualifications. New opens a blank seeding form that adds an existing Plant user to SharePoint.
              </p>

              <div class="master-detail">
                <aside class="list-panel">
                  <div class="list-header">
                    <div>
                      <div class="panel-title">People</div>
                      <p class="panel-note">This SharePoint-backed list is the employee menu. Pick one person to open the details dialog and manage their qualifications there.</p>
                    </div>
                    <button type="button" (click)="openPersonSeedDialog()" [disabled]="busy()">New</button>
                  </div>

                  @if (seedUsers().length > 0) {
                    <section class="seed-strip">
                      <label class="seed-select">
                        <span>Add Employee</span>
                        <span class="field-help">Pick an active Plant user from the directory. This creates the employee row in SharePoint and makes them show up in this manager.</span>
                        <select name="seedUserId" [ngModel]="seedUserId()" (ngModelChange)="seedUserId.set($event)">
                          <option value="">Select user</option>
                          @for (user of seedUsers(); track user.id) {
                            <option [value]="user.id.toString()">{{ seedUserLabel(user) }}</option>
                          }
                        </select>
                      </label>
                      <button type="button" (click)="seedSelectedUser()" [disabled]="busy() || !seedUserId()">Add Employee</button>
                    </section>
                  }

                  @if (people().length === 0 && !busy()) {
                    <div class="empty">No plant users found.</div>
                  }
                  @for (person of people(); track person.userId) {
                    <button
                      type="button"
                      class="person-row"
                      [class.selected]="selectedUserId() === person.userId"
                      (click)="selectPerson(person)">
                      <span class="person-name">{{ person.userName || ('User ' + person.userId) }}</span>
                      <span class="person-meta">{{ person.qualificationCount }} assigned</span>
                    </button>
                  }
                </aside>

                <section class="detail-panel">
                  @if (selectedPerson()) {
                    <header class="detail-header">
                      <div>
                        <span class="eyebrow">Selected person</span>
                        <h2>{{ selectedPerson()!.userName }}</h2>
                        @if (selectedPerson()!.userEmail) { <p>{{ selectedPerson()!.userEmail }}</p> }
                        @if (selectedPerson()!.windowsUsername) { <p>{{ selectedPerson()!.windowsUsername }}</p> }
                      </div>
                      <div class="detail-actions">
                        <button type="button" (click)="openAssignmentsDialog()" [disabled]="!selectedPerson()">View Qualifications</button>
                        <button type="button" (click)="startAssign()" [disabled]="!selectedPerson()">New Assignment</button>
                      </div>
                    </header>

                    <div class="detail-top">
                      <section class="detail-card summary-card">
                        <div class="panel-title">Summary</div>
                        <p class="panel-note">Visible here: the employee row, login name, role, and how many qualifications are assigned. The QR below points to the public read-only lookup page.</p>
                        <div class="summary-stats">
                          <div class="summary-stat">
                            <span>Assigned</span>
                            <strong>{{ selectedQualifications().length }}</strong>
                          </div>
                          <div class="summary-stat">
                            <span>Role</span>
                            <strong>{{ selectedPerson()!.role || '-' }}</strong>
                          </div>
                          <div class="summary-stat">
                            <span>User ID</span>
                            <strong>{{ selectedPerson()!.userId }}</strong>
                          </div>
                        </div>
                      </section>

                      <section class="detail-card qr-card" #qrPanel>
                        <div class="panel-title">QR Code</div>
                        <p class="panel-note">This QR opens the public lookup page for the selected person. Anyone can scan it, but only authorized admins can change the data behind it. Print it for a badge, card, or label.</p>
                        <app-qr-generator [data]="qualificationLink(selectedPerson()!)" [size]="220" [label]="selectedPerson()!.userName"></app-qr-generator>
                        <input class="link-output" readonly [value]="qualificationLink(selectedPerson()!)">
                        <div class="qr-actions">
                          <button type="button" (click)="copyLink(selectedPerson()!)">Copy Link</button>
                          <button type="button" (click)="printQr(selectedPerson()!)">Print QR</button>
                          <a [href]="qualificationLink(selectedPerson()!)" target="_blank" rel="noopener">Open</a>
                        </div>
                      </section>
                    </div>

                    <section class="detail-card assignments-card">
                      <div class="panel-title">Assigned Qualifications</div>
                      <p class="panel-note">These rows are the person’s current qualifications. Edit opens a dialog so you do not have to scroll. Delete removes it from the SharePoint list or fallback flow.</p>
                      <div class="assignment-rows">
                        @if (selectedQualifications().length === 0) {
                          <div class="empty">No qualifications assigned.</div>
                        }
                        @for (qualification of selectedQualifications(); track qualification.sharepointId || qualification.localUuid || $index) {
                          <article class="assignment-row" [class.expired]="isExpired(qualification)">
                            <div>
                              <h3>{{ qualification.qualificationName || 'Qualification' }}</h3>
                              <p>
                                @if (qualification.qualificationCode) { <span>{{ qualification.qualificationCode }}</span> }
                                @if (qualification.qualificationType) { <span>{{ qualification.qualificationType }}</span> }
                                @if (qualification.expirationDate) { <span>Expires {{ qualification.expirationDate }}</span> }
                                @else { <span>No expiration</span> }
                              </p>
                            </div>
                            <div class="row-actions">
                              <span class="status" [attr.data-status]="normalizedStatus(qualification)">
                                {{ isExpired(qualification) ? 'Expired' : (qualification.status || 'Active') }}
                              </span>
                              <button type="button" (click)="editQualification(qualification)">Edit</button>
                              <button type="button" class="danger" (click)="deleteQualification(qualification)">Delete</button>
                            </div>
                          </article>
                        }
                      </div>
                    </section>
                  } @else {
                    <div class="empty large detail-empty">Select a person from the list to see their QR, qualifications, and edit form.</div>
                  }
                </section>
              </div>
            </section>
          }

          @if (activeTab() === 'catalog') {
            <section class="tab-panel">
              <p class="tab-note">
                Use Quals to define reusable qualification templates. Editing a catalog item updates the assignment dropdown and every person already using that qualification.
              </p>

              <div class="master-detail">
                <aside class="list-panel">
                  <div class="list-header">
                    <div>
                      <div class="panel-title">Catalog</div>
                      <p class="panel-note">This list is the source of truth for the qualification name, code, expiration rules, and sort order used everywhere else.</p>
                    </div>
                    <button type="button" (click)="startDefinitionCreate()">New</button>
                  </div>

                  <div class="catalog-list">
                    @if (definitions().length === 0) {
                      <div class="empty">No catalog items.</div>
                    }
                    @for (definition of definitions(); track definition.sharepointId || definition.localUuid || $index) {
                      <article
                        class="catalog-row"
                        [class.inactive]="definition.active === false"
                        [class.selected]="editingDefinitionSharepointId() === (definition.sharepointId || null)"
                        (click)="editDefinition(definition)">
                        <div>
                          <h3>{{ definition.qualificationName || 'Qualification' }}</h3>
                          <p>
                            @if (definition.qualificationCode) { <span>{{ definition.qualificationCode }}</span> }
                            @if (definition.qualificationType) { <span>{{ definition.qualificationType }}</span> }
                            @if (definition.requiresExpiration) { <span>Expires</span> }
                          </p>
                        </div>
                        <div class="catalog-actions">
                          <button type="button" (click)="$event.stopPropagation(); editDefinition(definition)">Edit</button>
                          <button type="button" class="danger" (click)="$event.stopPropagation(); deleteDefinition(definition)">Delete</button>
                        </div>
                      </article>
                    }
                  </div>
                </aside>

                <section class="detail-panel">
                  <header class="detail-header">
                    <div>
                      <span class="eyebrow">{{ editingDefinitionSharepointId() ? 'Editing catalog item' : 'New catalog item' }}</span>
                      <h2>{{ editingDefinitionSharepointId() ? (definitionDraft().qualificationName || 'Catalog item') : 'Create a qualification' }}</h2>
                      <p>
                        @if (editingDefinitionSharepointId()) {
                          Changes here update the assignment dropdown and every person already using this qualification.
                        } @else {
                          Add a reusable qualification template that admins can assign to employees later.
                        }
                      </p>
                    </div>
                    <button type="button" (click)="startDefinitionCreate()">New</button>
                  </header>

                  <section class="detail-card catalog-summary">
                    <div class="panel-title">Catalog Editor</div>
                    <p class="panel-note">Open an item from the left or click New to edit it in a dialog. That keeps the list visible and avoids the long scroll that was getting in the way.</p>
                    <div class="catalog-summary-stats">
                      <div class="summary-stat">
                        <span>Items</span>
                        <strong>{{ definitions().length }}</strong>
                      </div>
                      <div class="summary-stat">
                        <span>Active</span>
                        <strong>{{ activeDefinitions().length }}</strong>
                      </div>
                    </div>
                  </section>
                </section>
              </div>
            </section>
          }

          @if (activeTab() === 'report') {
            <section class="tab-panel report-panel">
              <p class="tab-note">
                Use Reports to choose one qualification and see who has it, when it was issued, when it expires, and whether it is overdue or due soon. Due soon means within 30 days.
              </p>

              <div class="report-layout">
                <aside class="list-panel report-list-panel">
                  <div class="list-header">
                    <div>
                      <div class="panel-title">Qualifications</div>
                      <p class="panel-note">Select a qualification on the left to build the report on the right. The list includes active and inactive catalog items.</p>
                    </div>
                  </div>

                  <div class="report-list">
                    @if (definitions().length === 0) {
                      <div class="empty">No qualifications available.</div>
                    }
                    @for (definition of definitions(); track definition.sharepointId || definition.localUuid || $index) {
                      <button
                        type="button"
                        class="catalog-row report-row"
                        [class.selected]="selectedReportKey() === reportDefinitionKey(definition)"
                        [class.inactive]="definition.active === false"
                        (click)="selectReportDefinition(definition)">
                        <div>
                          <h3>{{ definition.qualificationName || 'Qualification' }}</h3>
                          <p>
                            @if (definition.qualificationCode) { <span>{{ definition.qualificationCode }}</span> }
                            @if (definition.qualificationType) { <span>{{ definition.qualificationType }}</span> }
                          </p>
                        </div>
                        <div class="report-row-summary">
                          <span class="report-row-meta">{{ reportDefinitionSummaryText(definition) }}</span>
                          @if (definition.active === false) {
                            <span class="status" data-status="inactive">Inactive</span>
                          }
                        </div>
                      </button>
                    }
                  </div>
                </aside>

                <section class="report-detail">
                  @if (selectedReportDefinition()) {
                    <header class="report-header">
                      <div>
                        <span class="eyebrow">Selected qualification</span>
                        <h2>{{ selectedReportDefinition()!.qualificationName }}</h2>
                        <p>
                          @if (selectedReportDefinition()!.qualificationCode) { <span>{{ selectedReportDefinition()!.qualificationCode }}</span> }
                          @if (selectedReportDefinition()!.qualificationType) { <span>{{ selectedReportDefinition()!.qualificationType }}</span> }
                          @if (selectedReportDefinition()!.requiresExpiration) { <span>Expiration tracked</span> }
                          @else { <span>No expiration required</span> }
                        </p>
                        <p class="report-hint">Rows are sorted by urgency. Overdue is red, due soon is amber, valid is green, and non-expiring rows are gray.</p>
                      </div>
                      <div class="report-summary-stats">
                        <div class="summary-stat">
                          <span>Assigned</span>
                          <strong>{{ selectedReportSummary().total }}</strong>
                        </div>
                        <div class="summary-stat">
                          <span>Overdue</span>
                          <strong>{{ selectedReportSummary().overdue }}</strong>
                        </div>
                        <div class="summary-stat">
                          <span>Due soon</span>
                          <strong>{{ selectedReportSummary().dueSoon }}</strong>
                        </div>
                        <div class="summary-stat">
                          <span>No expiration</span>
                          <strong>{{ selectedReportSummary().noExpiration }}</strong>
                        </div>
                      </div>
                    </header>

                    <div class="report-table-wrap">
                      <table class="report-table">
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Issued</th>
                            <th>Expires</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          @if (selectedReportRows().length === 0) {
                            <tr>
                              <td colspan="4">
                                <div class="empty report-empty">No employees currently have this qualification.</div>
                              </td>
                            </tr>
                          }
                          @for (row of selectedReportRows(); track row.trackKey) {
                            <tr class="report-row" [class.overdue]="row.statusKey === 'overdue'" [class.due-soon]="row.statusKey === 'due-soon'" [class.valid]="row.statusKey === 'valid'" [class.no-expiration]="row.statusKey === 'no-expiration'">
                              <td>
                                <div class="report-person">{{ row.personName }}</div>
                                @if (row.personEmail) { <div class="report-person-meta">{{ row.personEmail }}</div> }
                                @if (row.windowsUsername) { <div class="report-person-meta">{{ row.windowsUsername }}</div> }
                              </td>
                              <td>{{ row.issuedDate || '-' }}</td>
                              <td>{{ row.expirationDate || 'No expiration' }}</td>
                              <td><span class="status" [attr.data-status]="row.statusKey">{{ row.statusLabel }}</span></td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  } @else {
                    <div class="empty large detail-empty">Select a qualification from the list to build the report.</div>
                  }
                </section>
              </div>
            </section>
          }

          @if (personSeedDialogOpen()) {
            <div class="modal-backdrop" (click)="closePersonSeedDialog()"></div>
            <section class="modal-shell" role="dialog" aria-modal="true" aria-label="Add employee">
              <div class="modal-card" (click)="$event.stopPropagation()">
                <header class="modal-header">
                  <div>
                    <span class="eyebrow">New employee</span>
                    <h2>Add Plant user to qualifications</h2>
                    <p>Select an active Plant user and seed them into SharePoint. This does not create the login account; it copies the existing user into the employee list and creates the baseline Plant Role row.</p>
                  </div>
                  <button type="button" (click)="closePersonSeedDialog()">Close</button>
                </header>

                <form class="editor modal-form" (ngSubmit)="seedSelectedUser()">
                  <p class="section-note">
                    Choose one of the active Plant users loaded from the directory. After save, the employee appears in the People tab and gets a QR.
                  </p>
                  <div class="form-grid single">
                    <label>
                      <span>Employee</span>
                      <span class="field-help">Pick the directory user to seed into SharePoint. This becomes the person shown in the People tab and on the public QR lookup page.</span>
                      <select name="seedUserId" [ngModel]="seedUserId()" (ngModelChange)="seedUserId.set($event)" required>
                        <option value="">Select user</option>
                        @for (user of seedUsers(); track user.id) {
                          <option [value]="user.id.toString()">{{ seedUserLabel(user) }}</option>
                        }
                      </select>
                    </label>
                    <p class="dialog-note">Only active Plant users are shown here. Use the top toolbar if you need to rebuild the SharePoint lists first.</p>
                  </div>
                  <div class="editor-actions">
                    <button type="submit" [disabled]="busy() || !seedUserId()">Save</button>
                    <button type="button" (click)="closePersonSeedDialog()" [disabled]="busy()">Cancel</button>
                  </div>
                </form>
              </div>
            </section>
          }

          @if (assignmentEditorOpen()) {
            <div class="modal-backdrop" (click)="closeAssignmentEditor()"></div>
            <section class="modal-shell" role="dialog" aria-modal="true" aria-label="Assignment editor">
              <div class="modal-card" (click)="$event.stopPropagation()">
                <header class="modal-header">
                  <div>
                    <span class="eyebrow">{{ editingSharepointId() ? 'Edit assignment' : 'New assignment' }}</span>
                    <h2>{{ selectedPerson()?.userName || 'Employee' }}</h2>
                    <p>This assignment is visible on the public QR page and in the employee record inside SharePoint.</p>
                  </div>
                  <button type="button" (click)="closeAssignmentEditor()">Close</button>
                </header>

                <form class="editor modal-form" (ngSubmit)="saveAssignment()">
                  <p class="section-note">
                    Choose a catalog item and fill out any supporting details. Save writes to SharePoint and the Power Automate fallback.
                  </p>
                  <div class="form-grid">
                    <label class="full">
                      <span>Qualification</span>
                      <span class="field-help">Choose a catalog item. Its name, code, and type are copied onto this assignment and shown on the public QR page.</span>
                      <select
                        name="qualificationId"
                        [ngModel]="assignmentDraft().qualificationId"
                        (ngModelChange)="onDefinitionSelected($event)"
                        required>
                        <option value="">Select qualification</option>
                        @for (definition of activeDefinitions(); track definition.localUuid || definition.sharepointId || $index) {
                          <option [value]="definition.localUuid">{{ catalogLabel(definition) }}</option>
                        }
                      </select>
                    </label>
                    <label>
                      <span>Status</span>
                      <span class="field-help">Shown on the public lookup page and in this manager. Use Active for a live credential.</span>
                      <select name="status" [ngModel]="assignmentDraft().status" (ngModelChange)="updateAssignmentDraft('status', $event)">
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </label>
                    <label>
                      <span>Issued</span>
                      <span class="field-help">Shown on the public QR page. If the catalog item has default months, this helps calculate the expiration date.</span>
                      <input name="issuedDate" type="date" [ngModel]="assignmentDraft().issuedDate" (ngModelChange)="updateAssignmentDraft('issuedDate', $event)">
                    </label>
                    <label>
                      <span>Expires</span>
                      <span class="field-help">Shown on the public QR page and printed QR. Leave blank if the qualification does not expire.</span>
                      <input name="expirationDate" type="date" [ngModel]="assignmentDraft().expirationDate" (ngModelChange)="updateAssignmentDraft('expirationDate', $event)">
                    </label>
                    <label>
                      <span>Credential</span>
                      <span class="field-help">Optional certificate, card, or license number. Visible on the public QR page and in this manager.</span>
                      <input name="credentialNumber" [ngModel]="assignmentDraft().credentialNumber" (ngModelChange)="updateAssignmentDraft('credentialNumber', $event)">
                    </label>
                    <label>
                      <span>Issuer</span>
                      <span class="field-help">Optional trainer, instructor, or organization name. Visible on the public QR page and in this manager.</span>
                      <input name="issuer" [ngModel]="assignmentDraft().issuer" (ngModelChange)="updateAssignmentDraft('issuer', $event)">
                    </label>
                    <label class="full">
                      <span>Notes</span>
                      <span class="field-help">Use this for admin notes or audit context. Visible on the public QR lookup page and in this manager.</span>
                      <textarea name="assignmentNotes" rows="3" [ngModel]="assignmentDraft().notes" (ngModelChange)="updateAssignmentDraft('notes', $event)"></textarea>
                    </label>
                  </div>
                  <div class="editor-actions">
                    <button type="submit" [disabled]="busy() || !assignmentDraft().qualificationId">Save</button>
                    <button type="button" (click)="closeAssignmentEditor()" [disabled]="busy()">Cancel</button>
                  </div>
                </form>
              </div>
            </section>
          }

          @if (assignmentsDialogOpen()) {
            <div class="modal-backdrop" (click)="closeAssignmentsDialog()"></div>
            <section class="modal-shell" role="dialog" aria-modal="true" aria-label="Assigned qualifications">
              <div class="modal-card" (click)="$event.stopPropagation()">
                <header class="modal-header">
                  <div>
                    <span class="eyebrow">Qualifications for {{ selectedPerson()?.userName || 'Employee' }}</span>
                    <h2>Assigned Qualifications</h2>
                    <p>These rows are the current qualifications attached to the selected employee.</p>
                  </div>
                  <button type="button" (click)="closeAssignmentsDialog()">Close</button>
                </header>

                <div class="person-dialog-grid">
                  <section class="detail-card person-dialog-summary">
                    <div class="panel-title">Employee</div>
                    <p class="panel-note">This person row, their QR, and their current qualifications are all read from SharePoint or the Power Automate fallback. The dialog stays inside the viewport and scrolls on its own.</p>
                    <div class="summary-stats">
                      <div class="summary-stat">
                        <span>Assigned</span>
                        <strong>{{ selectedQualifications().length }}</strong>
                      </div>
                      <div class="summary-stat">
                        <span>Role</span>
                        <strong>{{ selectedPerson()?.role || '-' }}</strong>
                      </div>
                      <div class="summary-stat">
                        <span>User ID</span>
                        <strong>{{ selectedPerson()?.userId || '-' }}</strong>
                      </div>
                    </div>
                  </section>

                  <section class="detail-card person-dialog-qr" #qrPanel>
                    <div class="panel-title">QR Code</div>
                    <p class="panel-note">Anyone can scan this link to open the public, read-only qualification page for the selected person. Use Print QR for a badge or label.</p>
                    <app-qr-generator [data]="qualificationLink(selectedPerson()!)" [size]="220" [label]="selectedPerson()!.userName"></app-qr-generator>
                    <input class="link-output" readonly [value]="qualificationLink(selectedPerson()!)">
                    <div class="qr-actions">
                      <button type="button" (click)="copyLink(selectedPerson()!)">Copy Link</button>
                      <button type="button" (click)="printQr(selectedPerson()!)">Print QR</button>
                      <a [href]="qualificationLink(selectedPerson()!)" target="_blank" rel="noopener">Open</a>
                    </div>
                  </section>
                </div>

                <div class="assignments-modal-toolbar">
                  <div class="assignments-modal-note">
                    Edit opens the assignment editor. Delete removes the row from SharePoint or the Power Automate fallback.
                  </div>
                  <button type="button" (click)="startAssign()">Add Qualification</button>
                </div>

                <div class="assignment-rows assignments-modal-list">
                  @if (selectedQualifications().length === 0) {
                    <div class="empty">No qualifications assigned.</div>
                  }
                  @for (qualification of selectedQualifications(); track qualification.sharepointId || qualification.localUuid || $index) {
                    <article class="assignment-row" [class.expired]="isExpired(qualification)">
                      <div>
                        <h3>{{ qualification.qualificationName || 'Qualification' }}</h3>
                        <p>
                          @if (qualification.qualificationCode) { <span>{{ qualification.qualificationCode }}</span> }
                          @if (qualification.qualificationType) { <span>{{ qualification.qualificationType }}</span> }
                          @if (qualification.expirationDate) { <span>Expires {{ qualification.expirationDate }}</span> }
                          @else { <span>No expiration</span> }
                        </p>
                      </div>
                      <div class="row-actions">
                        <span class="status" [attr.data-status]="normalizedStatus(qualification)">
                          {{ isExpired(qualification) ? 'Expired' : (qualification.status || 'Active') }}
                        </span>
                        <button type="button" (click)="editQualification(qualification)">Edit</button>
                        <button type="button" class="danger" (click)="deleteQualification(qualification)">Delete</button>
                      </div>
                    </article>
                  }
                </div>
              </div>
            </section>
          }

          @if (definitionEditorOpen()) {
            <div class="modal-backdrop" (click)="closeDefinitionEditor()"></div>
            <section class="modal-shell" role="dialog" aria-modal="true" aria-label="Catalog editor">
              <div class="modal-card" (click)="$event.stopPropagation()">
                <header class="modal-header">
                  <div>
                    <span class="eyebrow">{{ editingDefinitionSharepointId() ? 'Edit catalog item' : 'New catalog item' }}</span>
                    <h2>{{ definitionDraft().qualificationName || 'Qualification' }}</h2>
                    <p>The catalog is the source of truth for the assignment dropdown and the public QR display.</p>
                  </div>
                  <button type="button" (click)="closeDefinitionEditor()">Close</button>
                </header>

                <form class="editor modal-form" (ngSubmit)="saveDefinition()">
                  <p class="section-note">
                    This is the template behind the assignment dropdown. Fields here decide what can be assigned and what gets copied into a person's record.
                  </p>
                  <div class="form-grid single">
                    <label>
                      <span>Name</span>
                      <span class="field-help">Required. Visible on the public QR page, the qualification list, and the assignment dropdown.</span>
                      <input name="definitionName" [ngModel]="definitionDraft().qualificationName" (ngModelChange)="updateDefinitionDraft('qualificationName', $event)" required>
                    </label>
                    <label>
                      <span>Code</span>
                      <span class="field-help">Optional short code for shorthand lookup. Visible on the public QR page, the catalog list, and the assignment dropdown.</span>
                      <input name="definitionCode" [ngModel]="definitionDraft().qualificationCode" (ngModelChange)="updateDefinitionDraft('qualificationCode', $event)">
                    </label>
                    <label>
                      <span>Type</span>
                      <span class="field-help">Optional grouping or category. Visible on the public QR page and in catalog views.</span>
                      <input name="definitionType" [ngModel]="definitionDraft().qualificationType" (ngModelChange)="updateDefinitionDraft('qualificationType', $event)">
                    </label>
                    <div class="check-row">
                      <label>
                        <input type="checkbox" name="requiresExpiration" [ngModel]="definitionDraft().requiresExpiration" (ngModelChange)="updateDefinitionDraft('requiresExpiration', $event)">
                        <span>Expiration required</span>
                      </label>
                      <label>
                        <input type="checkbox" name="definitionActive" [ngModel]="definitionDraft().active" (ngModelChange)="updateDefinitionDraft('active', $event)">
                        <span>Active</span>
                      </label>
                    </div>
                    <div class="field-hint-row">
                      <span class="field-help">When enabled, the assignment form can auto-fill expiration from the issued date and default months.</span>
                      <span class="field-help">Inactive catalog items stay in SharePoint but are hidden from the assignment dropdown.</span>
                    </div>
                    <label>
                      <span>Default Months</span>
                      <span class="field-help">Used to calculate expiration from the issued date when expiration is required. Leave blank for non-expiring qualifications.</span>
                      <input name="defaultValidityMonths" type="number" inputmode="numeric" min="0" [ngModel]="definitionDraft().defaultValidityMonths" (ngModelChange)="updateDefinitionDraft('defaultValidityMonths', $event)">
                    </label>
                    <label>
                      <span>Sort</span>
                      <span class="field-help">Lower numbers appear first in the catalog list and the assignment dropdown.</span>
                      <input name="sortOrder" type="number" inputmode="numeric" [ngModel]="definitionDraft().sortOrder" (ngModelChange)="updateDefinitionDraft('sortOrder', $event)">
                    </label>
                    <label>
                      <span>Description</span>
                      <span class="field-help">Long-form admin description. Visible in SharePoint and this catalog editor, not on the public QR page.</span>
                      <textarea name="definitionDescription" rows="2" [ngModel]="definitionDraft().description" (ngModelChange)="updateDefinitionDraft('description', $event)"></textarea>
                    </label>
                    <label>
                      <span>Notes</span>
                      <span class="field-help">Private admin notes for the catalog item. Visible in SharePoint and this manager, not on the public QR page.</span>
                      <textarea name="definitionNotes" rows="2" [ngModel]="definitionDraft().notes" (ngModelChange)="updateDefinitionDraft('notes', $event)"></textarea>
                    </label>
                  </div>
                  <div class="editor-actions">
                    <button type="submit" [disabled]="busy() || !definitionDraft().qualificationName">Save</button>
                    <button type="button" (click)="closeDefinitionEditor()" [disabled]="busy()">Cancel</button>
                  </div>
                </form>
              </div>
            </section>
          }
        </main>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      --report-overdue-surface: color-mix(in srgb, #ef4444 12%, var(--secondary-background));
      --report-due-soon-surface: color-mix(in srgb, #f59e0b 12%, var(--secondary-background));
      --report-valid-surface: color-mix(in srgb, #22c55e 10%, var(--secondary-background));
      --report-neutral-surface: color-mix(in srgb, var(--secondary-text) 8%, var(--secondary-background));
      --report-overdue-text: #b42318;
      --report-due-soon-text: #9a3412;
      --report-valid-text: #166534;
      --report-neutral-text: var(--secondary-text);
      --report-table-header-bg: var(--secondary-background);
      --report-qr-surface: var(--secondary-background);
      --status-overdue-bg: color-mix(in srgb, #ef4444 15%, var(--secondary-background));
      --status-overdue-fg: #7f1d1d;
      --status-overdue-border: color-mix(in srgb, #ef4444 28%, var(--border-color));
      --status-due-soon-bg: color-mix(in srgb, #f59e0b 16%, var(--secondary-background));
      --status-due-soon-fg: #92400e;
      --status-due-soon-border: color-mix(in srgb, #f59e0b 30%, var(--border-color));
      --status-valid-bg: color-mix(in srgb, #22c55e 14%, var(--secondary-background));
      --status-valid-fg: #166534;
      --status-valid-border: color-mix(in srgb, #22c55e 28%, var(--border-color));
      --status-neutral-bg: color-mix(in srgb, var(--secondary-text) 10%, var(--secondary-background));
      --status-neutral-fg: var(--secondary-text);
      --status-neutral-border: var(--border-color);
    }
    :host-context(body.dark-theme) {
      --report-overdue-surface: color-mix(in srgb, #ef4444 18%, var(--card-background));
      --report-due-soon-surface: color-mix(in srgb, #f59e0b 18%, var(--card-background));
      --report-valid-surface: color-mix(in srgb, #22c55e 14%, var(--card-background));
      --report-neutral-surface: color-mix(in srgb, var(--secondary-text) 12%, var(--card-background));
      --report-overdue-text: #fecaca;
      --report-due-soon-text: #fde68a;
      --report-valid-text: #bbf7d0;
      --report-neutral-text: var(--secondary-text);
      --report-table-header-bg: color-mix(in srgb, var(--secondary-background) 72%, var(--card-background));
      --report-qr-surface: color-mix(in srgb, var(--secondary-background) 82%, var(--card-background));
      --status-overdue-bg: color-mix(in srgb, #ef4444 24%, var(--secondary-background));
      --status-overdue-fg: #fecaca;
      --status-overdue-border: color-mix(in srgb, #ef4444 38%, var(--border-color));
      --status-due-soon-bg: color-mix(in srgb, #f59e0b 24%, var(--secondary-background));
      --status-due-soon-fg: #fde68a;
      --status-due-soon-border: color-mix(in srgb, #f59e0b 38%, var(--border-color));
      --status-valid-bg: color-mix(in srgb, #22c55e 22%, var(--secondary-background));
      --status-valid-fg: #bbf7d0;
      --status-valid-border: color-mix(in srgb, #22c55e 38%, var(--border-color));
      --status-neutral-bg: color-mix(in srgb, var(--secondary-text) 18%, var(--card-background));
      --status-neutral-fg: var(--primary-text);
      --status-neutral-border: var(--border-color);
    }
    .manager-shell { height: 100%; padding: 16px; overflow: auto; box-sizing: border-box; }
    .toolbar, .workspace-header, .catalog-header { display: flex; justify-content: space-between; gap: 12px; }
    .toolbar { align-items: flex-end; padding-bottom: 12px; border-bottom: 1px solid var(--border-color); }
    .toolbar h1 { margin: 0; font-size: 1.45rem; }
    .toolbar p, .person-meta, .workspace-header p, .assignment-row p, .catalog-row p, .empty { color: var(--secondary-text); }
    .toolbar p, .workspace-header p, .assignment-row p, .catalog-row p { margin: 0; }
    .page-note {
      margin: 12px 0 0;
      padding: 10px 12px;
      border-left: 3px solid var(--accent-color);
      border-radius: 8px;
      background: color-mix(in srgb, var(--accent-color) 6%, var(--card-background));
      color: var(--secondary-text);
      font-size: .84rem;
      line-height: 1.45;
    }
    .tabs {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      overflow-x: auto;
      padding-top: 14px;
      border-bottom: 1px solid var(--border-color);
      scrollbar-width: none;
    }
    .tabs::-webkit-scrollbar { display: none; }
    .tab {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--secondary-text);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font: inherit;
      font-size: .93rem;
      font-weight: 600;
      padding: 10px 12px;
      white-space: nowrap;
    }
    .tab:hover:not(.active) { color: var(--primary-text); background: var(--hover-background); }
    .tab.active {
      color: var(--accent-color);
      border-bottom-color: var(--accent-color);
    }
    .tab-glyph { font-size: 1rem; line-height: 1; }
    .tab-label { font-size: .9rem; }
    .tab-panel {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-top: 14px;
    }
    .tab-note {
      margin: 0;
      padding: 10px 12px;
      border-left: 3px solid var(--accent-color);
      border-radius: 8px;
      background: color-mix(in srgb, var(--accent-color) 6%, var(--card-background));
      color: var(--primary-text);
      font-size: .88rem;
      line-height: 1.5;
    }
    .panel-note, .section-note, .field-help {
      color: var(--secondary-text);
      line-height: 1.45;
    }
    .panel-note {
      margin: 4px 0 0;
      font-size: .8rem;
    }
    .section-note {
      margin: 0 0 2px;
      font-size: .82rem;
    }
    .field-help {
      display: block;
      font-size: .75rem;
      font-weight: 500;
    }
    .field-hint-row {
      display: grid;
      gap: 6px;
    }
    .master-detail {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 18px;
      align-items: start;
      padding-top: 4px;
    }
    .list-panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .detail-panel,
    .seed-strip {
      display: none;
    }
    .list-header,
    .detail-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }
    .detail-panel {
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-width: 0;
    }
    .detail-header h2 {
      margin: 2px 0;
      font-size: 1.2rem;
    }
    .detail-header p,
    .detail-summary {
      margin: 0;
      color: var(--secondary-text);
    }
    .detail-top {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(280px, 320px);
      gap: 12px;
      align-items: stretch;
    }
    .detail-card {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 14px;
      background: var(--card-background);
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
    }
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .summary-stat {
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 8px 10px;
      background: var(--secondary-background);
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .summary-stat span {
      font-size: .72rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--secondary-text);
    }
    .summary-stat strong {
      font-size: .95rem;
      color: var(--primary-text);
      overflow-wrap: anywhere;
    }
    .catalog-summary-stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .report-layout {
      display: grid;
      grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
      gap: 18px;
      align-items: start;
      padding-top: 4px;
    }
    .report-list-panel {
      position: sticky;
      top: 0;
      align-self: start;
    }
    .report-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: calc(100vh - 280px);
      overflow: auto;
      padding-right: 2px;
    }
    .report-row {
      width: 100%;
      align-items: center;
    }
    .report-row-summary {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: flex-end;
      justify-content: center;
      min-width: 0;
    }
    .report-row-meta {
      color: var(--secondary-text);
      font-size: .78rem;
      line-height: 1.4;
      text-align: right;
      overflow-wrap: anywhere;
    }
    .report-detail {
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-width: 0;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-color);
    }
    .report-header h2 {
      margin: 2px 0;
      font-size: 1.2rem;
    }
    .report-header p {
      margin: 0;
      color: var(--secondary-text);
    }
    .report-hint {
      margin-top: 6px !important;
      font-size: .82rem;
      line-height: 1.45;
    }
    .report-summary-stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      min-width: min(100%, 460px);
    }
    .report-table-wrap {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: auto;
      background: var(--card-background);
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 720px;
    }
    .report-table th,
    .report-table td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-color);
      vertical-align: top;
      text-align: left;
    }
    .report-table th {
      position: sticky;
      top: 0;
      z-index: 1;
      background: var(--report-table-header-bg);
      font-size: .72rem;
      text-transform: uppercase;
      letter-spacing: .5px;
      color: var(--secondary-text);
    }
    .report-row.overdue > td {
      background: var(--report-overdue-surface);
    }
    .report-row.due-soon > td {
      background: var(--report-due-soon-surface);
    }
    .report-row.valid > td {
      background: var(--report-valid-surface);
    }
    .report-row.no-expiration > td {
      background: var(--report-neutral-surface);
    }
    .report-table .report-row.overdue > td:first-child {
      box-shadow: inset 4px 0 0 var(--report-overdue-text);
    }
    .report-table .report-row.due-soon > td:first-child {
      box-shadow: inset 4px 0 0 var(--report-due-soon-text);
    }
    .report-table .report-row.valid > td:first-child {
      box-shadow: inset 4px 0 0 var(--report-valid-text);
    }
    .report-table .report-row.no-expiration > td:first-child {
      box-shadow: inset 4px 0 0 var(--report-neutral-text);
    }
    .report-person {
      font-weight: 700;
      color: var(--primary-text);
      overflow-wrap: anywhere;
    }
    .report-person-meta {
      color: var(--secondary-text);
      font-size: .76rem;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }
    .report-empty {
      padding: 18px 0;
    }
    .qr-card {
      align-items: center;
      text-align: center;
    }
    .qr-card .panel-title,
    .qr-card .panel-note,
    .summary-card .panel-title,
    .summary-card .panel-note {
      align-self: stretch;
      text-align: left;
    }
    .qr-card app-qr-generator {
      align-self: center;
    }
    .detail-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .assignments-card {
      display: none;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 5000;
      background: rgba(0, 0, 0, 0.55);
    }
    .modal-shell {
      position: fixed;
      inset: 0;
      z-index: 5001;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 24px 16px 16px;
      box-sizing: border-box;
      pointer-events: none;
    }
    .modal-card {
      pointer-events: auto;
      width: min(940px, calc(100vw - 32px));
      max-height: calc(100vh - 40px);
      overflow: auto;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background: var(--card-background);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35);
      padding: 16px;
      box-sizing: border-box;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-color);
    }
    .modal-header h2 {
      margin: 2px 0;
      font-size: 1.25rem;
    }
    .modal-header p {
      margin: 0;
      color: var(--secondary-text);
      font-size: .86rem;
      line-height: 1.45;
    }
    .modal-form.editor {
      border: none;
      background: transparent;
      padding: 0;
    }
    .assignments-modal-toolbar {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .person-dialog-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(280px, 320px);
      gap: 12px;
      align-items: stretch;
      margin-bottom: 12px;
    }
    .person-dialog-qr {
      background: var(--report-qr-surface);
      color: var(--primary-text);
      align-items: center;
      text-align: center;
    }
    .person-dialog-qr .panel-title,
    .person-dialog-qr .panel-note {
      align-self: stretch;
      text-align: left;
    }
    .person-dialog-summary .summary-stats {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .dialog-note {
      margin: 0;
      font-size: .8rem;
      color: var(--secondary-text);
      line-height: 1.45;
    }
    .assignments-modal-note {
      color: var(--secondary-text);
      font-size: .82rem;
      line-height: 1.45;
      max-width: 64ch;
    }
    .assignments-modal-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: min(60vh, 640px);
      overflow: auto;
      padding-right: 2px;
    }
    .toolbar-actions, .editor-actions, .qr-actions, .row-actions, .catalog-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .seed-strip {
      display: flex;
      align-items: end;
      gap: 12px;
      flex-wrap: wrap;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--card-background);
    }
    .seed-select { display: flex; flex-direction: column; gap: 5px; min-width: min(100%, 380px); font-size: .85rem; font-weight: 650; }
    button, .qr-actions a { border: 1px solid var(--border-color); border-radius: 6px; background: var(--card-background); color: var(--primary-text); padding: 8px 12px; font: inherit; cursor: pointer; text-decoration: none; }
    button:disabled { opacity: .55; }
    button.danger { color: var(--error-text); }
    .busy-row { color: var(--secondary-text); padding: 12px 0; }
    .manager-grid { display: grid; grid-template-columns: minmax(190px, 250px) minmax(0, 1fr) minmax(270px, 340px); gap: 18px; padding-top: 16px; align-items: start; }
    .people-list, .side-tools { position: sticky; top: 0; align-self: start; }
    .people-list, .catalog-panel { display: flex; flex-direction: column; gap: 10px; }
    .side-tools, .assignment-rows, .qr-panel { display: flex; flex-direction: column; gap: 10px; }
    .panel-title, .person-name { font-weight: 700; }
    .panel-title { margin-bottom: 8px; }
    .person-row { width: 100%; display: flex; flex-direction: column; align-items: flex-start; gap: 3px; margin-bottom: 6px; text-align: left; }
    .person-row.selected { border-color: var(--accent-color); background: var(--selected-background); color: var(--selected-text); }
    .person-name, .workspace-header p { overflow-wrap: anywhere; }
    .person-meta { font-size: .78rem; }
    .workspace-header { align-items: flex-end; padding-bottom: 12px; }
    .eyebrow { display: block; font-size: .72rem; font-weight: 700; color: var(--secondary-text); }
    .workspace-header h2 { margin: 2px 0; font-size: 1.2rem; }
    .assignment-rows, .catalog-list { margin-bottom: 16px; }
    .assignment-row, .catalog-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; border-bottom: 1px solid var(--border-color); padding: 10px 0; }
    .catalog-row { cursor: pointer; }
    .assignment-row.expired, .catalog-row.inactive { opacity: .7; }
    .catalog-row.selected { border-color: var(--accent-color); background: var(--selected-background); }
    .assignment-row h3, .catalog-row h3 { margin: 0 0 4px; font-size: 1rem; }
    .assignment-row p, .catalog-row p { font-size: .86rem; display: flex; gap: 8px; flex-wrap: wrap; }
    .status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: .75rem;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: 0;
      background: var(--status-neutral-bg);
      color: var(--status-neutral-fg);
      border: 1px solid var(--status-neutral-border);
      white-space: nowrap;
    }
    .status[data-status='overdue'] {
      color: var(--status-overdue-fg);
      background: var(--status-overdue-bg);
      border-color: var(--status-overdue-border);
    }
    .status[data-status='due-soon'] {
      color: var(--status-due-soon-fg);
      background: var(--status-due-soon-bg);
      border-color: var(--status-due-soon-border);
    }
    .status[data-status='valid'] {
      color: var(--status-valid-fg);
      background: var(--status-valid-bg);
      border-color: var(--status-valid-border);
    }
    .status[data-status='no-expiration'],
    .status[data-status='inactive'] {
      color: var(--status-neutral-fg);
      background: var(--status-neutral-bg);
      border-color: var(--status-neutral-border);
    }
    .editor { border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; background: var(--card-background); }
    .editor h3 { margin: 0 0 12px; font-size: 1rem; }
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .form-grid.single { grid-template-columns: 1fr; }
    label { display: flex; flex-direction: column; gap: 5px; font-size: .85rem; font-weight: 650; }
    label.full { grid-column: 1 / -1; }
    input, select, textarea { border: 1px solid var(--border-color); border-radius: 6px; background: var(--input-bg); color: var(--primary-text); padding: 9px 10px; font: inherit; min-width: 0; box-sizing: border-box; }
    textarea { resize: vertical; }
    .check-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .check-row label { flex-direction: row; align-items: center; font-weight: 600; }
    .check-row input { width: 16px; height: 16px; padding: 0; }
    .editor-actions { margin-top: 12px; }
    .link-output { width: 100%; box-sizing: border-box; font-size: .78rem; }
    .qr-actions { justify-content: center; }
    .catalog-header { align-items: center; }
    .empty { padding: 16px 0; }
    @media (max-width: 1100px) {
      .master-detail { grid-template-columns: 1fr; }
      .report-layout { grid-template-columns: 1fr; }
      .report-list-panel { position: static; }
      .report-header { flex-direction: column; }
      .report-summary-stats { min-width: 0; }
      .detail-top { grid-template-columns: 1fr; }
      .person-dialog-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 760px) {
      .form-grid, .assignment-row, .catalog-row { grid-template-columns: 1fr; }
      .summary-stats { grid-template-columns: 1fr; }
      .catalog-summary-stats { grid-template-columns: 1fr; }
      .report-summary-stats { grid-template-columns: 1fr; }
      .report-row-summary { align-items: flex-start; }
      .toolbar, .workspace-header, .list-header, .detail-header, .modal-header { flex-direction: column; align-items: stretch; }
      .row-actions, .catalog-actions { justify-content: flex-start; }
    }
  `]
})
export class QualificationManagementComponent implements OnInit {
  private serverApi = inject(ServerApiService);
  private globalMessage = inject(GlobalMessageService);
  private pa = inject(PowerAutomateService);

  @ViewChild('qrPanel', { static: false }) qrPanel?: ElementRef<HTMLElement>;

  people = signal<PwaQualificationPersonDto[]>([]);
  definitions = signal<PwaQualificationDefinitionDto[]>([]);
  seedUsers = signal<PwaQualificationSeedUserDto[]>([]);
  seedUserId = signal<string>('');
  paFallbackActive = signal(false);
  selectedUserId = signal<string>('');
  busy = signal(false);
  statusMessage = signal('');
  editingSharepointId = signal<string | null>(null);
  editingDefinitionSharepointId = signal<string | null>(null);
  assignmentDraft = signal<PwaQualificationDto>(this.blankAssignmentDraft());
  definitionDraft = signal<PwaQualificationDefinitionDto>(this.blankDefinitionDraft());
  activeTab = signal<'people' | 'catalog' | 'report'>('people');
  reportSelectionKey = signal<string>('');
  personSeedDialogOpen = signal(false);
  assignmentEditorOpen = signal(false);
  definitionEditorOpen = signal(false);
  assignmentsDialogOpen = signal(false);
  private readonly reportDueSoonDays = 30;

  selectedPerson = computed(() => this.people().find(p => p.userId === this.selectedUserId()) || null);
  selectedQualifications = computed(() => this.selectedPerson()?.qualifications || []);
  activeDefinitions = computed(() => this.definitions().filter(def => def.active !== false));
  selectedReportKey = computed(() => this.reportSelectionKey());
  selectedReportDefinition = computed(() => this.definitions().find(def => this.reportDefinitionKey(def) === this.reportSelectionKey()) || null);
  selectedReportRows = computed(() => this.buildReportRows(this.selectedReportDefinition()));
  selectedReportSummary = computed(() => this.buildReportSummary(this.selectedReportRows()));

  ngOnInit(): void {
    this.load();
  }

  setTab(tab: 'people' | 'catalog' | 'report'): void {
    this.activeTab.set(tab);
    if (tab === 'report') {
      this.ensureReportSelection();
    }
  }

  openAssignmentsDialog(): void {
    if (this.selectedPerson()) {
      this.assignmentsDialogOpen.set(true);
    }
  }

  openPersonSeedDialog(): void {
    if (this.paFallbackActive()) {
      this.statusMessage.set('Adding employees requires the server.');
      return;
    }
    this.seedUserId.set('');
    this.personSeedDialogOpen.set(true);
  }

  closePersonSeedDialog(): void {
    this.personSeedDialogOpen.set(false);
    this.seedUserId.set('');
  }

  closeAssignmentsDialog(): void {
    this.assignmentsDialogOpen.set(false);
  }

  selectReportDefinition(definition: PwaQualificationDefinitionDto): void {
    this.reportSelectionKey.set(this.reportDefinitionKey(definition));
  }

  private ensureReportSelection(
    _people: PwaQualificationPersonDto[] = this.people(),
    definitions: PwaQualificationDefinitionDto[] = this.definitions()
  ): void {
    if (!definitions || definitions.length === 0) {
      this.reportSelectionKey.set('');
      return;
    }

    const currentKey = this.reportSelectionKey();
    if (currentKey && definitions.some(def => this.reportDefinitionKey(def) === currentKey)) {
      return;
    }

    const next = definitions.find(def => def.active !== false) || definitions[0];
    this.reportSelectionKey.set(next ? this.reportDefinitionKey(next) : '');
  }

  load(): void {
    this.busy.set(true);
    forkJoin({
      people: this.serverApi.getQualificationPeople(),
      definitions: this.serverApi.getQualificationDefinitions()
    }).subscribe({
      next: ({ people, definitions }) => {
        this.paFallbackActive.set(false);
        this.people.set(people || []);
        this.definitions.set(definitions || []);
        this.ensureReportSelection(people, definitions);
        if (!this.selectedUserId() || !people.some(p => p.userId === this.selectedUserId())) {
          this.selectedUserId.set(people[0]?.userId || '');
        }
        this.resetAssignmentDraft();
        this.loadSeedUsers();
        this.busy.set(false);
      },
      error: err => {
        this.seedUsers.set([]);
        this.loadViaPowerAutomate(err);
      }
    });
  }

  reportDefinitionSummaryText(definition: PwaQualificationDefinitionDto): string {
    const summary = this.buildReportSummary(this.buildReportRows(definition));
    if (summary.total === 0) {
      return 'No assignments';
    }

    const parts = [`${summary.total} assigned`];
    if (summary.overdue > 0) parts.push(`${summary.overdue} overdue`);
    if (summary.dueSoon > 0) parts.push(`${summary.dueSoon} due soon`);
    if (summary.noExpiration > 0) parts.push(`${summary.noExpiration} no expiration`);
    return parts.join(' · ');
  }

  reportDefinitionKey(definition: PwaQualificationDefinitionDto): string {
    return this.normalizeComparable(
      definition.localUuid || definition.sharepointId || definition.qualificationCode || definition.qualificationName
    );
  }

  private buildReportRows(definition: PwaQualificationDefinitionDto | null): QualificationReportRow[] {
    if (!definition) {
      return [];
    }

    const rows: QualificationReportRow[] = [];
    for (const person of this.people()) {
      for (const qualification of person.qualifications || []) {
        if (!this.qualificationMatchesDefinition(qualification, definition)) {
          continue;
        }

        const status = this.reportStatusForQualification(qualification);
        rows.push({
          trackKey: qualification.sharepointId
            || qualification.localUuid
            || `${person.userId}:${qualification.qualificationId || qualification.qualificationName || qualification.qualificationCode || rows.length}`,
          personName: qualification.userName || person.userName || `User ${person.userId}`,
          personEmail: qualification.userEmail || person.userEmail,
          windowsUsername: qualification.windowsUsername || person.windowsUsername,
          role: qualification.role || person.role,
          qualificationName: qualification.qualificationName || definition.qualificationName || 'Qualification',
          qualificationCode: qualification.qualificationCode || definition.qualificationCode || '',
          qualificationType: qualification.qualificationType || definition.qualificationType || '',
          issuedDate: qualification.issuedDate || '',
          expirationDate: qualification.expirationDate || '',
          credentialNumber: qualification.credentialNumber || '',
          issuer: qualification.issuer || '',
          notes: qualification.notes || '',
          daysRemaining: status.daysRemaining,
          statusKey: status.statusKey,
          statusLabel: status.statusLabel
        });
      }
    }

    return rows.sort((left, right) => {
      const leftWeight = this.reportStatusWeight(left.statusKey);
      const rightWeight = this.reportStatusWeight(right.statusKey);
      if (leftWeight !== rightWeight) {
        return leftWeight - rightWeight;
      }

      const leftDate = left.expirationDate ? new Date(`${left.expirationDate}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
      const rightDate = right.expirationDate ? new Date(`${right.expirationDate}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
      if (leftDate !== rightDate) {
        return leftDate - rightDate;
      }

      return (left.personName || '').localeCompare(right.personName || '');
    });
  }

  private buildReportSummary(rows: QualificationReportRow[]): QualificationReportSummary {
    return rows.reduce<QualificationReportSummary>((summary, row) => {
      summary.total += 1;
      if (row.statusKey === 'overdue') summary.overdue += 1;
      else if (row.statusKey === 'due-soon') summary.dueSoon += 1;
      else if (row.statusKey === 'valid') summary.valid += 1;
      else summary.noExpiration += 1;
      return summary;
    }, {
      total: 0,
      overdue: 0,
      dueSoon: 0,
      valid: 0,
      noExpiration: 0
    });
  }

  private reportStatusForQualification(qualification: PwaQualificationDto): {
    statusKey: QualificationReportRow['statusKey'];
    statusLabel: string;
    daysRemaining: number | null;
  } {
    if (!qualification.expirationDate) {
      return { statusKey: 'no-expiration', statusLabel: 'No expiration', daysRemaining: null };
    }

    const expiration = new Date(`${qualification.expirationDate}T00:00:00`);
    if (Number.isNaN(expiration.getTime())) {
      return { statusKey: 'no-expiration', statusLabel: 'No expiration', daysRemaining: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysRemaining = Math.floor((expiration.getTime() - today.getTime()) / 86400000);

    if (daysRemaining < 0) {
      const overdueDays = Math.abs(daysRemaining);
      return {
        statusKey: 'overdue',
        statusLabel: overdueDays === 1 ? 'Overdue 1 day' : `Overdue ${overdueDays} days`,
        daysRemaining
      };
    }

    if (daysRemaining <= this.reportDueSoonDays) {
      if (daysRemaining === 0) {
        return { statusKey: 'due-soon', statusLabel: 'Due today', daysRemaining };
      }
      return {
        statusKey: 'due-soon',
        statusLabel: daysRemaining === 1 ? 'Due in 1 day' : `Due in ${daysRemaining} days`,
        daysRemaining
      };
    }

    return {
      statusKey: 'valid',
      statusLabel: daysRemaining === 1 ? 'Valid 1 day' : `Valid ${daysRemaining} days`,
      daysRemaining
    };
  }

  private reportStatusWeight(statusKey: QualificationReportRow['statusKey']): number {
    switch (statusKey) {
      case 'overdue': return 0;
      case 'due-soon': return 1;
      case 'valid': return 2;
      default: return 3;
    }
  }

  private qualificationMatchesDefinition(
    qualification: PwaQualificationDto,
    definition: PwaQualificationDefinitionDto
  ): boolean {
    const qualificationId = this.normalizeComparable(qualification.qualificationId);
    const definitionUuid = this.normalizeComparable(definition.localUuid);
    const definitionSharepointId = this.normalizeComparable(definition.sharepointId);
    if (qualificationId && (qualificationId === definitionUuid || qualificationId === definitionSharepointId)) {
      return true;
    }

    const qualificationCode = this.normalizeComparable(qualification.qualificationCode);
    const definitionCode = this.normalizeComparable(definition.qualificationCode);
    if (qualificationCode && definitionCode && qualificationCode === definitionCode) {
      return true;
    }

    const qualificationName = this.normalizeComparable(qualification.qualificationName);
    const definitionName = this.normalizeComparable(definition.qualificationName);
    return !!qualificationName && !!definitionName && qualificationName === definitionName;
  }

  private normalizeComparable(value?: string | null): string {
    return (value || '').trim().toLowerCase();
  }

  provision(): void {
    if (this.paFallbackActive()) {
      this.statusMessage.set('Provisioning requires the server.');
      return;
    }
    this.busy.set(true);
    this.serverApi.provisionQualificationList().subscribe({
      next: () => {
        this.statusMessage.set('SharePoint qualification lists are ready.');
        this.busy.set(false);
        this.load();
      },
      error: err => {
        this.statusMessage.set(err?.message || 'Provision failed.');
        this.busy.set(false);
      }
    });
  }

  seedPlantUsers(): void {
    if (this.paFallbackActive()) {
      this.statusMessage.set('Seeding plant users requires the server.');
      return;
    }
    this.busy.set(true);
    this.serverApi.seedQualificationPlantUsers().subscribe({
      next: result => {
        this.statusMessage.set(`Seed complete: ${result.created} created, ${result.skipped} skipped, ${result.failed} failed.`);
        this.busy.set(false);
        this.load();
      },
      error: err => {
        this.statusMessage.set(err?.message || 'Seed failed.');
        this.busy.set(false);
      }
    });
  }

  selectPerson(person: PwaQualificationPersonDto): void {
    this.selectedUserId.set(person.userId);
    this.resetAssignmentDraft();
    this.assignmentsDialogOpen.set(true);
  }

  private resetAssignmentDraft(): void {
    this.editingSharepointId.set(null);
    this.assignmentDraft.set(this.blankAssignmentDraft(this.selectedPerson() || undefined));
  }

  startAssign(): void {
    this.assignmentsDialogOpen.set(false);
    this.resetAssignmentDraft();
    this.assignmentEditorOpen.set(true);
  }

  closeAssignmentEditor(): void {
    this.assignmentEditorOpen.set(false);
    this.editingSharepointId.set(null);
    this.resetAssignmentDraft();
  }

  editQualification(qualification: PwaQualificationDto): void {
    this.assignmentsDialogOpen.set(false);
    const definition = qualification.qualificationId
      ? this.definitions().find(def => def.localUuid === qualification.qualificationId)
      : this.definitions().find(def => def.qualificationName === qualification.qualificationName);
    this.editingSharepointId.set(qualification.sharepointId || null);
    this.assignmentDraft.set({
      ...qualification,
      qualificationId: qualification.qualificationId || definition?.localUuid || ''
    });
    this.assignmentEditorOpen.set(true);
  }

  onDefinitionSelected(qualificationId: string): void {
    const definition = this.definitions().find(def => def.localUuid === qualificationId);
    this.assignmentDraft.update(current => this.applyDefinitionToDraft({ ...current, qualificationId }, definition));
  }

  updateAssignmentDraft(field: keyof PwaQualificationDto, value: string): void {
    this.assignmentDraft.update(current => {
      const next = { ...current, [field]: value };
      return field === 'issuedDate' ? this.applyDefaultExpiration(next) : next;
    });
  }

  saveAssignment(): void {
    const payload = { ...this.assignmentDraft() };
    const person = this.selectedPerson();
    if (person) {
      payload.userId = person.userId;
      payload.userName = person.userName;
      payload.userEmail = person.userEmail;
      payload.windowsUsername = person.windowsUsername;
      payload.role = person.role;
    }

    this.busy.set(true);
    if (this.paFallbackActive()) {
      this.saveAssignmentViaPowerAutomate(payload);
      return;
    }

    const request = this.editingSharepointId()
      ? this.serverApi.updateQualification(this.editingSharepointId()!, payload)
      : this.serverApi.createQualification(payload);

    request.subscribe({
      next: () => {
        this.statusMessage.set('Qualification assignment saved.');
        this.closeAssignmentEditor();
        this.busy.set(false);
        this.load();
      },
      error: err => {
        this.statusMessage.set(err?.message || 'Save failed.');
        this.busy.set(false);
      }
    });
  }

  async deleteQualification(qualification: PwaQualificationDto): Promise<void> {
    if (!qualification.sharepointId) return;
    const ok = await this.globalMessage.confirm(
      `Delete ${qualification.qualificationName || 'qualification'} from this person?`,
      { confirmLabel: 'Delete', color: 'red' },
    );
    if (!ok) return;
    this.busy.set(true);
    if (this.paFallbackActive()) {
      this.deleteAssignmentViaPowerAutomate(qualification);
      return;
    }

    this.serverApi.deleteQualification(qualification.sharepointId).subscribe({
      next: () => {
        this.statusMessage.set('Qualification assignment deleted.');
        this.busy.set(false);
        this.load();
      },
      error: err => {
        this.statusMessage.set(err?.message || 'Delete failed.');
        this.busy.set(false);
      }
    });
  }

  startDefinitionCreate(): void {
    this.resetDefinitionDraft();
    this.definitionEditorOpen.set(true);
  }

  closeDefinitionEditor(): void {
    this.definitionEditorOpen.set(false);
    this.resetDefinitionDraft();
  }

  private resetDefinitionDraft(): void {
    this.editingDefinitionSharepointId.set(null);
    this.definitionDraft.set(this.blankDefinitionDraft());
  }

  editDefinition(definition: PwaQualificationDefinitionDto): void {
    this.editingDefinitionSharepointId.set(definition.sharepointId || null);
    this.definitionDraft.set({ ...definition });
    this.definitionEditorOpen.set(true);
  }

  updateDefinitionDraft(field: keyof PwaQualificationDefinitionDto, value: string | boolean): void {
    this.definitionDraft.update(current => ({ ...current, [field]: value }));
  }

  saveDefinition(): void {
    const payload = { ...this.definitionDraft() };
    this.busy.set(true);
    if (this.paFallbackActive()) {
      this.saveDefinitionViaPowerAutomate(payload);
      return;
    }

    const request = this.editingDefinitionSharepointId()
      ? this.serverApi.updateQualificationDefinition(this.editingDefinitionSharepointId()!, payload)
      : this.serverApi.createQualificationDefinition(payload);

    request.subscribe({
      next: () => {
        this.statusMessage.set('Catalog item saved.');
        this.closeDefinitionEditor();
        this.busy.set(false);
        this.load();
      },
      error: err => {
        this.statusMessage.set(err?.message || 'Catalog save failed.');
        this.busy.set(false);
      }
    });
  }

  async deleteDefinition(definition: PwaQualificationDefinitionDto): Promise<void> {
    if (!definition.sharepointId) return;
    const ok = await this.globalMessage.confirm(
      `Delete ${definition.qualificationName || 'catalog item'}?`,
      { confirmLabel: 'Delete', color: 'red' },
    );
    if (!ok) return;
    this.busy.set(true);
    if (this.paFallbackActive()) {
      this.deleteDefinitionViaPowerAutomate(definition);
      return;
    }

    this.serverApi.deleteQualificationDefinition(definition.sharepointId).subscribe({
      next: () => {
        this.statusMessage.set('Catalog item deleted.');
        this.busy.set(false);
        this.load();
      },
      error: err => {
        this.statusMessage.set(err?.message || 'Catalog delete failed.');
        this.busy.set(false);
      }
    });
  }

  qualificationLink(person: PwaQualificationPersonDto): string {
    const base = document.querySelector('base')?.href || `${window.location.origin}/`;
    return new URL(`qualifications/${encodeURIComponent(person.userId)}`, base).toString();
  }

  copyLink(person: PwaQualificationPersonDto): void {
    const write = navigator.clipboard?.writeText(this.qualificationLink(person));
    if (!write) {
      this.statusMessage.set('Clipboard is unavailable.');
      return;
    }
    write.then(
      () => this.statusMessage.set('Link copied.'),
      () => this.statusMessage.set('Could not copy link.')
    );
  }

  seedSelectedUser(): void {
    if (this.paFallbackActive()) {
      this.statusMessage.set('Adding one employee requires the server.');
      return;
    }

    const userId = this.seedUserId();
    const user = this.seedUsers().find(candidate => String(candidate.id) === userId);
    if (!user) {
      this.statusMessage.set('Select an employee first.');
      return;
    }

    this.busy.set(true);
    this.serverApi.seedQualificationPlantUser(user.id).subscribe({
      next: result => {
        const created = result?.created || 0;
        const skipped = result?.skipped || 0;
        this.statusMessage.set(
          created > 0
            ? `Employee added for ${user.name}.`
            : skipped > 0
              ? `${user.name} was already in the qualification list.`
              : 'No employee was added.'
        );
        this.seedUserId.set(userId);
        this.selectedUserId.set(String(user.id));
        this.closePersonSeedDialog();
        this.busy.set(false);
        this.load();
      },
      error: err => {
        this.statusMessage.set(err?.message || 'Could not add employee.');
        this.busy.set(false);
      }
    });
  }

  printQr(person: PwaQualificationPersonDto): void {
    const qrCard = this.qrPanel?.nativeElement.querySelector('.qr-container') as HTMLElement | null;
    if (!qrCard) {
      this.statusMessage.set('QR preview is not ready to print.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) {
      this.statusMessage.set('Popup blocked the print preview.');
      return;
    }

    const title = this.escapeHtml(person.userName || `User ${person.userId}`);
    const svgMarkup = qrCard.outerHTML;
    const documentHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} QR</title>
    <style>
      :root {
        color-scheme: light;
      }

      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #111111;
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      body {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        box-sizing: border-box;
      }

      .print-sheet {
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }

      .qr-container {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #ffffff;
        color: #111111;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        box-sizing: border-box;
        box-shadow: none;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .qr-markup {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }

      .qr-markup svg {
        display: block;
        width: 280px;
        height: 280px;
        background: #ffffff;
      }

      .qr-label {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        text-align: center;
        color: #111111;
      }

      @page {
        margin: 0.35in;
      }
    </style>
  </head>
  <body>
    <div class="print-sheet">
      ${svgMarkup}
    </div>
    <script>
      window.onload = () => {
        window.focus();
        window.print();
      };
      window.onafterprint = () => window.close();
    </script>
  </body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(documentHtml);
    printWindow.document.close();
  }

  catalogLabel(definition: PwaQualificationDefinitionDto): string {
    const code = definition.qualificationCode ? `${definition.qualificationCode} - ` : '';
    return `${code}${definition.qualificationName || 'Qualification'}`;
  }

  seedUserLabel(user: PwaQualificationSeedUserDto): string {
    const email = user.email ? ` (${user.email})` : '';
    return `${user.name || `User ${user.id}`}${email}`;
  }

  normalizedStatus(qualification: PwaQualificationDto): string {
    if (this.isExpired(qualification)) return 'expired';
    return (qualification.status || 'Active').trim().toLowerCase();
  }

  isExpired(qualification: PwaQualificationDto): boolean {
    if (!qualification.expirationDate) return false;
    const expiration = new Date(`${qualification.expirationDate}T23:59:59`);
    return !Number.isNaN(expiration.getTime()) && expiration.getTime() < Date.now();
  }

  private loadSeedUsers(): void {
    if (this.paFallbackActive()) {
      this.seedUsers.set([]);
      return;
    }

    this.serverApi.getQualificationSeedUsers().subscribe({
      next: users => {
        const plantUsers = (users || [])
          .filter(user => this.isPlantSeedUser(user))
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        this.seedUsers.set(plantUsers);
        if (this.seedUserId() && !plantUsers.some(user => String(user.id) === this.seedUserId())) {
          this.seedUserId.set('');
        }
      },
      error: () => {
        this.seedUsers.set([]);
        this.seedUserId.set('');
      }
    });
  }

  private isPlantSeedUser(user: PwaQualificationSeedUserDto): boolean {
    const roleValues = [
      user.role || '',
      ...(user.roles || [])
    ].map(value => value.toUpperCase());
    return user.isActive !== false && roleValues.some(role => role.includes('PLANT'));
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private loadViaPowerAutomate(originalError: any): void {
    this.seedUsers.set([]);
    this.seedUserId.set('');
    if (!this.pa.isV2Configured('qualifications')) {
      this.statusMessage.set(originalError?.message || 'Could not load qualifications.');
      this.busy.set(false);
      return;
    }

    forkJoin({
      assignments: this.pa.submitV2('qualifications', { actionType: 'getAll', data: {}, attachments: [] }),
      definitions: this.pa.submitV2('qualifications', { actionType: 'catalogGetAll', data: {}, attachments: [] })
    }).subscribe({
      next: ({ assignments, definitions }) => {
        const assignmentRows = (assignments.data || []).map(row => this.mapPaAssignment(row));
        const definitionRows = (definitions.data || []).map(row => this.mapPaDefinition(row));
        if (assignmentRows.length === 0 && definitionRows.length === 0) {
          this.statusMessage.set(assignments.message || definitions.message || 'Power Automate fallback returned no data.');
          this.busy.set(false);
          return;
        }

        const people = this.peopleFromAssignments(assignmentRows);
        const warnings = [assignments.success, definitions.success].some(success => success === false)
          ? [assignments.message, definitions.message].filter(Boolean).join(' | ')
          : '';

        this.paFallbackActive.set(true);
        this.people.set(people);
        this.definitions.set(this.sortDefinitions(definitionRows));
        this.ensureReportSelection(people, this.definitions());
        if (!this.selectedUserId() || !people.some(p => p.userId === this.selectedUserId())) {
          this.selectedUserId.set(people[0]?.userId || '');
        }
        this.resetAssignmentDraft();
        this.statusMessage.set(warnings ? `Loaded from Power Automate. ${warnings}` : 'Server is unreachable; loaded from Power Automate.');
        this.busy.set(false);
      },
      error: err => {
        this.statusMessage.set(err?.message || 'Server and Power Automate are unreachable.');
        this.busy.set(false);
      }
    });
  }

  private saveAssignmentViaPowerAutomate(payload: PwaQualificationDto): void {
    const actionType = this.editingSharepointId() ? 'update' : 'create';
    this.pa.submitV2('qualifications', {
      actionType,
      id: this.editingSharepointId() || undefined,
      data: this.assignmentToPaMap(payload),
      attachments: []
    }).subscribe({
      next: response => {
        if (!response.success) {
          this.statusMessage.set(response.message || 'Power Automate assignment save failed.');
          this.busy.set(false);
          return;
        }
        this.statusMessage.set('Qualification assignment saved through Power Automate.');
        this.closeAssignmentEditor();
        this.busy.set(false);
        this.load();
      },
      error: err => {
        this.statusMessage.set(err?.message || 'Power Automate assignment save failed.');
        this.busy.set(false);
      }
    });
  }

  private deleteAssignmentViaPowerAutomate(qualification: PwaQualificationDto): void {
    this.pa.submitV2('qualifications', {
      actionType: 'delete',
      id: qualification.sharepointId,
      data: {},
      attachments: []
    }).subscribe({
      next: response => {
        if (!response.success) {
          this.statusMessage.set(response.message || 'Power Automate assignment delete failed.');
          this.busy.set(false);
          return;
        }
        this.statusMessage.set('Qualification assignment deleted through Power Automate.');
        if (this.editingSharepointId() === qualification.sharepointId) {
          this.closeAssignmentEditor();
        }
        this.busy.set(false);
        this.load();
      },
      error: err => {
        this.statusMessage.set(err?.message || 'Power Automate assignment delete failed.');
        this.busy.set(false);
      }
    });
  }

  private saveDefinitionViaPowerAutomate(payload: PwaQualificationDefinitionDto): void {
    const actionType = this.editingDefinitionSharepointId() ? 'catalogUpdate' : 'catalogCreate';
    this.pa.submitV2('qualifications', {
      actionType,
      id: this.editingDefinitionSharepointId() || undefined,
      data: this.definitionToPaMap(payload),
      attachments: []
    }).subscribe({
      next: response => {
        if (!response.success) {
          this.statusMessage.set(response.message || 'Power Automate catalog save failed.');
          this.busy.set(false);
          return;
        }
        this.statusMessage.set('Catalog item saved through Power Automate.');
        this.closeDefinitionEditor();
        this.busy.set(false);
        this.load();
      },
      error: err => {
        this.statusMessage.set(err?.message || 'Power Automate catalog save failed.');
        this.busy.set(false);
      }
    });
  }

  private deleteDefinitionViaPowerAutomate(definition: PwaQualificationDefinitionDto): void {
    this.pa.submitV2('qualifications', {
      actionType: 'catalogDelete',
      id: definition.sharepointId,
      data: {},
      attachments: []
    }).subscribe({
      next: response => {
        if (!response.success) {
          this.statusMessage.set(response.message || 'Power Automate catalog delete failed.');
          this.busy.set(false);
          return;
        }
        this.statusMessage.set('Catalog item deleted through Power Automate.');
        if (this.editingDefinitionSharepointId() === definition.sharepointId) {
          this.closeDefinitionEditor();
        }
        this.busy.set(false);
        this.load();
      },
      error: err => {
        this.statusMessage.set(err?.message || 'Power Automate catalog delete failed.');
        this.busy.set(false);
      }
    });
  }

  private mapPaAssignment(row: any): PwaQualificationDto {
    return {
      sharepointId: this.text(row.ID ?? row.Id ?? row.id),
      localUuid: this.text(row.PwaId),
      userId: this.text(row.UserId),
      userName: this.text(row.UserName || row.Title),
      userEmail: this.text(row.UserEmail),
      windowsUsername: this.text(row.WindowsUsername),
      role: this.text(row.Role),
      qualificationId: this.text(row.QualificationId),
      qualificationCode: this.text(row.QualificationCode),
      qualificationName: this.text(row.QualificationName),
      qualificationType: this.text(row.QualificationType),
      status: this.text(row.Status),
      issuedDate: this.text(row.IssuedDate),
      expirationDate: this.text(row.ExpirationDate),
      credentialNumber: this.text(row.CredentialNumber),
      issuer: this.text(row.Issuer),
      notes: this.text(row.Notes),
      spModifiedTime: this.text(row.Modified)
    };
  }

  private mapPaDefinition(row: any): PwaQualificationDefinitionDto {
    return {
      sharepointId: this.text(row.ID ?? row.Id ?? row.id),
      localUuid: this.text(row.PwaId),
      qualificationCode: this.text(row.QualificationCode),
      qualificationName: this.text(row.QualificationName || row.Title),
      qualificationType: this.text(row.QualificationType),
      description: this.text(row.Description),
      requiresExpiration: this.bool(row.RequiresExpiration),
      defaultValidityMonths: this.text(row.DefaultValidityMonths),
      active: this.bool(row.IsActive ?? row.Active, true),
      sortOrder: this.text(row.SortOrder),
      notes: this.text(row.Notes),
      spModifiedTime: this.text(row.Modified)
    };
  }

  private peopleFromAssignments(assignments: PwaQualificationDto[]): PwaQualificationPersonDto[] {
    const byUser = new Map<string, PwaQualificationDto[]>();
    for (const assignment of assignments) {
      const key = assignment.userId || assignment.userEmail || assignment.userName || assignment.sharepointId || '';
      if (!key) continue;
      byUser.set(key, [...(byUser.get(key) || []), assignment]);
    }

    return Array.from(byUser.entries()).map(([userId, qualifications]) => {
      const sorted = [...qualifications].sort((a, b) => (a.qualificationName || '').localeCompare(b.qualificationName || ''));
      const first = sorted[0];
      return {
        userId,
        userName: first?.userName || `User ${userId}`,
        userEmail: first?.userEmail,
        windowsUsername: first?.windowsUsername,
        role: first?.role,
        qualificationCount: sorted.length,
        qualifications: sorted
      };
    }).sort((a, b) => (a.userName || '').localeCompare(b.userName || ''));
  }

  private assignmentToPaMap(dto: PwaQualificationDto): Record<string, any> {
    const pwaId = dto.localUuid || crypto.randomUUID();
    return {
      Title: this.assignmentTitle(dto),
      PwaId: pwaId,
      UserId: dto.userId || '',
      UserName: dto.userName || '',
      UserEmail: dto.userEmail || '',
      WindowsUsername: dto.windowsUsername || '',
      Role: dto.role || '',
      QualificationId: dto.qualificationId || '',
      QualificationCode: dto.qualificationCode || '',
      QualificationName: dto.qualificationName || '',
      QualificationType: dto.qualificationType || '',
      Status: dto.status || 'Active',
      IssuedDate: dto.issuedDate || '',
      ExpirationDate: dto.expirationDate || '',
      CredentialNumber: dto.credentialNumber || '',
      Issuer: dto.issuer || '',
      Notes: dto.notes || ''
    };
  }

  private definitionToPaMap(dto: PwaQualificationDefinitionDto): Record<string, any> {
    const pwaId = dto.localUuid || crypto.randomUUID();
    return {
      Title: dto.qualificationName || dto.qualificationCode || 'Qualification',
      PwaId: pwaId,
      QualificationCode: dto.qualificationCode || '',
      QualificationName: dto.qualificationName || '',
      QualificationType: dto.qualificationType || '',
      Description: dto.description || '',
      RequiresExpiration: !!dto.requiresExpiration,
      DefaultValidityMonths: dto.defaultValidityMonths || '',
      IsActive: dto.active !== false,
      SortOrder: dto.sortOrder || '',
      Notes: dto.notes || ''
    };
  }

  private sortDefinitions(definitions: PwaQualificationDefinitionDto[]): PwaQualificationDefinitionDto[] {
    return [...definitions].sort((a, b) => {
      const left = Number(a.sortOrder || Number.MAX_SAFE_INTEGER);
      const right = Number(b.sortOrder || Number.MAX_SAFE_INTEGER);
      if (Number.isFinite(left) && Number.isFinite(right) && left !== right) return left - right;
      return (a.qualificationName || '').localeCompare(b.qualificationName || '');
    });
  }

  private assignmentTitle(dto: PwaQualificationDto): string {
    const user = dto.userName || dto.userEmail || 'Unknown User';
    return dto.qualificationName ? `${user} - ${dto.qualificationName}` : user;
  }

  private text(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  private bool(value: any, defaultValue = false): boolean {
    if (value === null || value === undefined || value === '') return defaultValue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    const text = String(value).trim().toLowerCase();
    return text === 'true' || text === 'yes' || text === '1';
  }

  private applyDefinitionToDraft(
    draft: PwaQualificationDto,
    definition?: PwaQualificationDefinitionDto
  ): PwaQualificationDto {
    if (!definition) {
      return {
        ...draft,
        qualificationCode: '',
        qualificationName: '',
        qualificationType: ''
      };
    }
    return this.applyDefaultExpiration({
      ...draft,
      qualificationId: definition.localUuid || '',
      qualificationCode: definition.qualificationCode || '',
      qualificationName: definition.qualificationName || '',
      qualificationType: definition.qualificationType || ''
    });
  }

  private applyDefaultExpiration(draft: PwaQualificationDto): PwaQualificationDto {
    if (draft.expirationDate || !draft.issuedDate) return draft;
    const definition = this.definitions().find(def => def.localUuid === draft.qualificationId);
    const months = Number(definition?.defaultValidityMonths || 0);
    if (!definition?.requiresExpiration || !Number.isFinite(months) || months <= 0) return draft;
    const issued = new Date(`${draft.issuedDate}T00:00:00`);
    if (Number.isNaN(issued.getTime())) return draft;
    issued.setMonth(issued.getMonth() + months);
    return { ...draft, expirationDate: issued.toISOString().slice(0, 10) };
  }

  private blankAssignmentDraft(person?: PwaQualificationPersonDto): PwaQualificationDto {
    return {
      userId: person?.userId || '',
      userName: person?.userName || '',
      userEmail: person?.userEmail || '',
      windowsUsername: person?.windowsUsername || '',
      role: person?.role || '',
      qualificationId: '',
      qualificationCode: '',
      qualificationName: '',
      qualificationType: '',
      status: 'Active',
      issuedDate: '',
      expirationDate: '',
      credentialNumber: '',
      issuer: '',
      notes: ''
    };
  }

  private blankDefinitionDraft(): PwaQualificationDefinitionDto {
    return {
      qualificationName: '',
      qualificationCode: '',
      qualificationType: '',
      description: '',
      requiresExpiration: false,
      defaultValidityMonths: '',
      active: true,
      sortOrder: '',
      notes: ''
    };
  }
}
