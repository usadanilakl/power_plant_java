import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import { QrGeneratorComponent } from '../../shared/qr-generator/qr-generator.component';
import {
  PwaQualificationDefinitionDto,
  PwaQualificationDto,
  PwaQualificationPersonDto,
  ServerApiService
} from '../../services/server-api.service';

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

          @if (busy()) {
            <div class="busy-row">Working...</div>
          }

          <div class="manager-grid">
            <aside class="people-list">
              <div class="panel-title">People</div>
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

            <section class="assignment-workspace">
              @if (selectedPerson()) {
                <header class="workspace-header">
                  <div>
                    <span class="eyebrow">Selected</span>
                    <h2>{{ selectedPerson()!.userName }}</h2>
                    @if (selectedPerson()!.userEmail) { <p>{{ selectedPerson()!.userEmail }}</p> }
                  </div>
                  <button type="button" (click)="startAssign()">Assign</button>
                </header>

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

                <form class="editor" (ngSubmit)="saveAssignment()">
                  <h3>{{ editingSharepointId() ? 'Edit Assignment' : 'Assign Qualification' }}</h3>
                  <div class="form-grid">
                    <label class="full">
                      <span>Qualification</span>
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
                      <select name="status" [ngModel]="assignmentDraft().status" (ngModelChange)="updateAssignmentDraft('status', $event)">
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </label>
                    <label>
                      <span>Issued</span>
                      <input name="issuedDate" type="date" [ngModel]="assignmentDraft().issuedDate" (ngModelChange)="updateAssignmentDraft('issuedDate', $event)">
                    </label>
                    <label>
                      <span>Expires</span>
                      <input name="expirationDate" type="date" [ngModel]="assignmentDraft().expirationDate" (ngModelChange)="updateAssignmentDraft('expirationDate', $event)">
                    </label>
                    <label>
                      <span>Credential</span>
                      <input name="credentialNumber" [ngModel]="assignmentDraft().credentialNumber" (ngModelChange)="updateAssignmentDraft('credentialNumber', $event)">
                    </label>
                    <label>
                      <span>Issuer</span>
                      <input name="issuer" [ngModel]="assignmentDraft().issuer" (ngModelChange)="updateAssignmentDraft('issuer', $event)">
                    </label>
                    <label class="full">
                      <span>Notes</span>
                      <textarea name="assignmentNotes" rows="3" [ngModel]="assignmentDraft().notes" (ngModelChange)="updateAssignmentDraft('notes', $event)"></textarea>
                    </label>
                  </div>
                  <div class="editor-actions">
                    <button type="submit" [disabled]="busy() || !assignmentDraft().qualificationId">Save</button>
                    <button type="button" (click)="startAssign()" [disabled]="busy()">Clear</button>
                  </div>
                </form>
              } @else {
                <div class="empty large">Select a person.</div>
              }
            </section>

            <aside class="side-tools">
              <section class="qr-panel">
                @if (selectedPerson()) {
                  <div class="panel-title">QR Code</div>
                  <app-qr-generator [data]="qualificationLink(selectedPerson()!)" [size]="220" [label]="selectedPerson()!.userName"></app-qr-generator>
                  <input class="link-output" readonly [value]="qualificationLink(selectedPerson()!)">
                  <div class="qr-actions">
                    <button type="button" (click)="copyLink(selectedPerson()!)">Copy Link</button>
                    <a [href]="qualificationLink(selectedPerson()!)" target="_blank" rel="noopener">Open</a>
                  </div>
                } @else {
                  <div class="empty">No QR selected.</div>
                }
              </section>

              <section class="catalog-panel">
                <header class="catalog-header">
                  <div class="panel-title">Catalog</div>
                  <button type="button" (click)="startDefinitionCreate()">New</button>
                </header>

                <div class="catalog-list">
                  @if (definitions().length === 0) {
                    <div class="empty">No catalog items.</div>
                  }
                  @for (definition of definitions(); track definition.sharepointId || definition.localUuid || $index) {
                    <article class="catalog-row" [class.inactive]="definition.active === false">
                      <div>
                        <h3>{{ definition.qualificationName || 'Qualification' }}</h3>
                        <p>
                          @if (definition.qualificationCode) { <span>{{ definition.qualificationCode }}</span> }
                          @if (definition.qualificationType) { <span>{{ definition.qualificationType }}</span> }
                          @if (definition.requiresExpiration) { <span>Expires</span> }
                        </p>
                      </div>
                      <div class="catalog-actions">
                        <button type="button" (click)="editDefinition(definition)">Edit</button>
                        <button type="button" class="danger" (click)="deleteDefinition(definition)">Delete</button>
                      </div>
                    </article>
                  }
                </div>

                <form class="editor catalog-editor" (ngSubmit)="saveDefinition()">
                  <h3>{{ editingDefinitionSharepointId() ? 'Edit Catalog Item' : 'New Catalog Item' }}</h3>
                  <div class="form-grid single">
                    <label>
                      <span>Name</span>
                      <input name="definitionName" [ngModel]="definitionDraft().qualificationName" (ngModelChange)="updateDefinitionDraft('qualificationName', $event)" required>
                    </label>
                    <label>
                      <span>Code</span>
                      <input name="definitionCode" [ngModel]="definitionDraft().qualificationCode" (ngModelChange)="updateDefinitionDraft('qualificationCode', $event)">
                    </label>
                    <label>
                      <span>Type</span>
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
                    <label>
                      <span>Default Months</span>
                      <input name="defaultValidityMonths" type="number" min="0" [ngModel]="definitionDraft().defaultValidityMonths" (ngModelChange)="updateDefinitionDraft('defaultValidityMonths', $event)">
                    </label>
                    <label>
                      <span>Sort</span>
                      <input name="sortOrder" type="number" [ngModel]="definitionDraft().sortOrder" (ngModelChange)="updateDefinitionDraft('sortOrder', $event)">
                    </label>
                    <label>
                      <span>Description</span>
                      <textarea name="definitionDescription" rows="2" [ngModel]="definitionDraft().description" (ngModelChange)="updateDefinitionDraft('description', $event)"></textarea>
                    </label>
                    <label>
                      <span>Notes</span>
                      <textarea name="definitionNotes" rows="2" [ngModel]="definitionDraft().notes" (ngModelChange)="updateDefinitionDraft('notes', $event)"></textarea>
                    </label>
                  </div>
                  <div class="editor-actions">
                    <button type="submit" [disabled]="busy() || !definitionDraft().qualificationName">Save</button>
                    <button type="button" (click)="startDefinitionCreate()" [disabled]="busy()">Clear</button>
                  </div>
                </form>
              </section>
            </aside>
          </div>
        </main>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .manager-shell { height: 100%; padding: 16px; overflow: auto; box-sizing: border-box; }
    .toolbar, .workspace-header, .catalog-header { display: flex; justify-content: space-between; gap: 12px; }
    .toolbar { align-items: flex-end; padding-bottom: 12px; border-bottom: 1px solid var(--border-color); }
    .toolbar h1 { margin: 0; font-size: 1.45rem; }
    .toolbar p, .person-meta, .workspace-header p, .assignment-row p, .catalog-row p, .empty { color: var(--secondary-text); }
    .toolbar p, .workspace-header p, .assignment-row p, .catalog-row p { margin: 0; }
    .toolbar-actions, .editor-actions, .qr-actions, .row-actions, .catalog-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    button, .qr-actions a { border: 1px solid var(--border-color); border-radius: 6px; background: var(--card-background); color: var(--primary-text); padding: 8px 12px; font: inherit; cursor: pointer; text-decoration: none; }
    button:disabled { opacity: .55; }
    button.danger { color: #b42318; }
    .busy-row { color: var(--secondary-text); padding: 12px 0; }
    .manager-grid { display: grid; grid-template-columns: minmax(190px, 250px) minmax(0, 1fr) minmax(270px, 340px); gap: 18px; padding-top: 16px; align-items: start; }
    .people-list, .side-tools { position: sticky; top: 0; align-self: start; }
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
    .assignment-row.expired, .catalog-row.inactive { opacity: .7; }
    .assignment-row h3, .catalog-row h3 { margin: 0 0 4px; font-size: 1rem; }
    .assignment-row p, .catalog-row p { font-size: .86rem; display: flex; gap: 8px; flex-wrap: wrap; }
    .status { border-radius: 999px; padding: 4px 9px; font-size: .75rem; font-weight: 700; background: var(--secondary-background); }
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
      .manager-grid { grid-template-columns: minmax(190px, 250px) minmax(0, 1fr); }
      .side-tools { position: static; grid-column: 1 / -1; display: grid; grid-template-columns: minmax(240px, 300px) minmax(0, 1fr); }
    }
    @media (max-width: 760px) {
      .manager-grid, .side-tools, .form-grid, .assignment-row, .catalog-row { grid-template-columns: 1fr; }
      .people-list { position: static; }
      .toolbar, .workspace-header { flex-direction: column; align-items: stretch; }
      .row-actions, .catalog-actions { justify-content: flex-start; }
    }
  `]
})
export class QualificationManagementComponent implements OnInit {
  private serverApi = inject(ServerApiService);

  people = signal<PwaQualificationPersonDto[]>([]);
  definitions = signal<PwaQualificationDefinitionDto[]>([]);
  selectedUserId = signal<string>('');
  busy = signal(false);
  statusMessage = signal('');
  editingSharepointId = signal<string | null>(null);
  editingDefinitionSharepointId = signal<string | null>(null);
  assignmentDraft = signal<PwaQualificationDto>(this.blankAssignmentDraft());
  definitionDraft = signal<PwaQualificationDefinitionDto>(this.blankDefinitionDraft());

  selectedPerson = computed(() => this.people().find(p => p.userId === this.selectedUserId()) || null);
  selectedQualifications = computed(() => this.selectedPerson()?.qualifications || []);
  activeDefinitions = computed(() => this.definitions().filter(def => def.active !== false));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.busy.set(true);
    forkJoin({
      people: this.serverApi.getQualificationPeople(),
      definitions: this.serverApi.getQualificationDefinitions()
    }).subscribe({
      next: ({ people, definitions }) => {
        this.people.set(people || []);
        this.definitions.set(definitions || []);
        if (!this.selectedUserId() || !people.some(p => p.userId === this.selectedUserId())) {
          this.selectedUserId.set(people[0]?.userId || '');
        }
        this.startAssign();
        this.busy.set(false);
      },
      error: err => {
        this.statusMessage.set(err?.message || 'Could not load qualifications.');
        this.busy.set(false);
      }
    });
  }

  provision(): void {
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
    this.startAssign();
  }

  startAssign(): void {
    const person = this.selectedPerson();
    this.editingSharepointId.set(null);
    this.assignmentDraft.set(this.blankAssignmentDraft(person || undefined));
  }

  editQualification(qualification: PwaQualificationDto): void {
    const definition = qualification.qualificationId
      ? this.definitions().find(def => def.localUuid === qualification.qualificationId)
      : this.definitions().find(def => def.qualificationName === qualification.qualificationName);
    this.editingSharepointId.set(qualification.sharepointId || null);
    this.assignmentDraft.set({
      ...qualification,
      qualificationId: qualification.qualificationId || definition?.localUuid || ''
    });
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
    const request = this.editingSharepointId()
      ? this.serverApi.updateQualification(this.editingSharepointId()!, payload)
      : this.serverApi.createQualification(payload);

    request.subscribe({
      next: () => {
        this.statusMessage.set('Qualification assignment saved.');
        this.busy.set(false);
        this.load();
      },
      error: err => {
        this.statusMessage.set(err?.message || 'Save failed.');
        this.busy.set(false);
      }
    });
  }

  deleteQualification(qualification: PwaQualificationDto): void {
    if (!qualification.sharepointId) return;
    if (!confirm(`Delete ${qualification.qualificationName || 'qualification'} from this person?`)) return;
    this.busy.set(true);
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
    this.editingDefinitionSharepointId.set(null);
    this.definitionDraft.set(this.blankDefinitionDraft());
  }

  editDefinition(definition: PwaQualificationDefinitionDto): void {
    this.editingDefinitionSharepointId.set(definition.sharepointId || null);
    this.definitionDraft.set({ ...definition });
  }

  updateDefinitionDraft(field: keyof PwaQualificationDefinitionDto, value: string | boolean): void {
    this.definitionDraft.update(current => ({ ...current, [field]: value }));
  }

  saveDefinition(): void {
    const payload = { ...this.definitionDraft() };
    this.busy.set(true);
    const request = this.editingDefinitionSharepointId()
      ? this.serverApi.updateQualificationDefinition(this.editingDefinitionSharepointId()!, payload)
      : this.serverApi.createQualificationDefinition(payload);

    request.subscribe({
      next: () => {
        this.statusMessage.set('Catalog item saved.');
        this.startDefinitionCreate();
        this.busy.set(false);
        this.load();
      },
      error: err => {
        this.statusMessage.set(err?.message || 'Catalog save failed.');
        this.busy.set(false);
      }
    });
  }

  deleteDefinition(definition: PwaQualificationDefinitionDto): void {
    if (!definition.sharepointId) return;
    if (!confirm(`Delete ${definition.qualificationName || 'catalog item'}?`)) return;
    this.busy.set(true);
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

  catalogLabel(definition: PwaQualificationDefinitionDto): string {
    const code = definition.qualificationCode ? `${definition.qualificationCode} - ` : '';
    return `${code}${definition.qualificationName || 'Qualification'}`;
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
