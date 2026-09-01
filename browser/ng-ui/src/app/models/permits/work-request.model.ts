import { Validators } from "@angular/forms";
import { FormField } from "../inputs/form-field.model";
import { BaseModel, IBaseModel } from "./base.model";
import {
  atLeastOneCheckedValidator,
  futureOrPresentDateValidator,
  futureTimeIfTodayValidator,
} from "../../shared/forms/validators/date.validators";
import {
  ConfinedSpaceHazards,
  HotWorkMeasures,
  SwHazards,
  CHROME_CONTENT_OPTIONS,
  FUME_LEVEL_OPTIONS,
  HotWorkProfile,
  confinedSpaceHazardOptions,
  declaredHazardsEnvelope,
  hotWorkExposureScore,
  hotWorkMeasureOptions,
  hotWorkTypeOptions,
  swHazardOptions,
  tickedHotWorkTypes,
  tickedConfinedSpaceHazards,
  tickedHotWorkMeasures,
  tickedSwHazards,
} from "./permit-hazards.model";
import { WorkRequestPa } from "./work-request-pa.model";
import { Column } from "../inputs/column.model";
import { IAttachment } from "./attachment.model";

/**
 * One work area the request covers, and what is planned there.
 *
 * <p>Wire shape of the backend `WorkRequestArea`. The single `workAreaId` stays the primary area;
 * this decides how many Confined Space and Hot Work permits the operator ends up generating.
 * `hotWork` is a flag only — the hot-work DETAIL is asked once for the whole request, because it is
 * the same crew doing the same job.
 */
export interface WorkRequestAreaDto {
  id: number | null;
  name: string;
  primary: boolean;
  confinedSpaceEntry: boolean;
  spaceName: string | null;
  hotWork: boolean;
}

export interface IWorkRequest extends IBaseModel {
  id: number;
  sharepointId: string;
  localUuid: string;
  submissionStatus: 'draft' | 'pending' | 'submitted' | 'failed' | 'sent via email';
  submissionMethod?: string;
  company: string;
  dateOfWork: Date;
  timeOfWork: string;
  locationOfWork: string;
  workRequestedBy: string;
  affectedEquipment: string;
  workScope: string;
  isLOTORequired: string;
  isHotWorkRequired: string;
  isConfinedSpaceEntryRequired: string;
  foremanName: string;
  fireWatchName: string;
  spaceToBeEntered: string;
  jhaStatus?: string;
  workCategoryName: string;
  workAreaId: number | null;
  workAreaName: string;
  /** The requester could not place the work on the map and described it in words instead. */
  workAreaUnknown: boolean;
  /** Every area covered. Empty means the single area above is the whole story. */
  workAreas: WorkRequestAreaDto[];
  declaredHazards: SwHazards;
  declaredHotWorkMeasures: HotWorkMeasures;
  declaredConfinedSpaceHazards: ConfinedSpaceHazards;
  /** Type of hot work + Cr(VI) assessment. Only meaningful when isHotWorkRequired is 'Yes'. */
  hotWorkProfile: HotWorkProfile;
  attachments: IAttachment[];
}

export class WorkRequest extends BaseModel<IWorkRequest> implements IWorkRequest {
  sharepointId: string;
  localUuid: string;
  submissionStatus: 'draft' | 'pending' | 'submitted' | 'failed' | 'sent via email';
  submissionMethod?: string;
  company: string;
  dateOfWork: Date;
  timeOfWork: string;
  locationOfWork: string;
  workRequestedBy: string;
  affectedEquipment: string;
  workScope: string;
  isLOTORequired: string;
  isHotWorkRequired: string;
  isConfinedSpaceEntryRequired: string;
  foremanName: string;
  fireWatchName: string;
  spaceToBeEntered: string;
  jhaStatus?: string;
  workCategoryName: string;
  workAreaId: number | null;
  workAreaName: string;
  workAreaUnknown: boolean;
  /** Every area covered. Empty means the single area above is the whole story. */
  workAreas: WorkRequestAreaDto[];
  declaredHazards: SwHazards;
  declaredHotWorkMeasures: HotWorkMeasures;
  declaredConfinedSpaceHazards: ConfinedSpaceHazards;
  hotWorkProfile: HotWorkProfile;
  attachments: IAttachment[];

  constructor(data: Partial<IWorkRequest> = {}) {
    super(data);
    this.sharepointId = data.sharepointId ?? '';
    this.localUuid = data.localUuid ?? crypto.randomUUID();
    this.submissionStatus = data.submissionStatus ?? 'draft';
    this.submissionMethod = data.submissionMethod;
    this.company = data.company ?? '';
    this.dateOfWork = data.dateOfWork ? new Date(data.dateOfWork) : new Date();
    this.timeOfWork = data.timeOfWork ?? '';
    this.locationOfWork = data.locationOfWork ?? '';
    this.workRequestedBy = data.workRequestedBy ?? '';
    this.affectedEquipment = data.affectedEquipment ?? '';
    this.workScope = data.workScope ?? '';
    this.isLOTORequired = data.isLOTORequired ?? 'No';
    this.isHotWorkRequired = data.isHotWorkRequired ?? 'No';
    this.isConfinedSpaceEntryRequired = data.isConfinedSpaceEntryRequired ?? 'No';
    this.foremanName = data.foremanName ?? '';
    this.fireWatchName = data.fireWatchName ?? '';
    this.spaceToBeEntered = data.spaceToBeEntered ?? '';
    this.jhaStatus = data.jhaStatus;
    this.workCategoryName = data.workCategoryName ?? '';
    this.workAreaId = data.workAreaId ?? null;
    this.workAreaName = data.workAreaName ?? '';
    this.workAreaUnknown = data.workAreaUnknown ?? false;
    this.workAreas = data.workAreas ?? [];
    // Always a concrete object, never null. The reactive form coerces a falsy checkbox-group value
    // to [], which would flip the group into array mode and stop it writing back by key.
    this.declaredHazards = new SwHazards(data.declaredHazards ?? {});
    this.declaredHotWorkMeasures = new HotWorkMeasures(data.declaredHotWorkMeasures ?? {});
    this.declaredConfinedSpaceHazards = new ConfinedSpaceHazards(data.declaredConfinedSpaceHazards ?? {});
    this.hotWorkProfile = new HotWorkProfile(data.hotWorkProfile ?? {});
    this.attachments = data.attachments ?? [];
  }

  /**
   * The map control's starting value: every area, primary first.
   *
   * <p>Falls back to the scalar pair for requests made before multi-area existed, so an old request
   * opened for resubmission still shows its area rather than an empty map.
   */
  private workAreaMapInitialValue(): { id: number; name: string }[] {
    const areas = (this.workAreas ?? [])
      .filter(a => typeof a.id === 'number')
      .map(a => ({ id: a.id as number, name: a.name }));
    if (areas.length) return areas;
    return this.workAreaId && this.workAreaName
      ? [{ id: this.workAreaId, name: this.workAreaName }]
      : [];
  }

  getFormFields(): FormField[] {
    return [
      { name: 'company', label: 'Company', type: 'text', initialValue: this.company, placeholder: 'e.g. DK Power', validators: [Validators.required] },
      {
        name: 'dateOfWork',
        label: 'Date of Work',
        type: 'date',
        initialValue: `${this.dateOfWork.getFullYear()}-${String(this.dateOfWork.getMonth() + 1).padStart(2, '0')}-${String(this.dateOfWork.getDate()).padStart(2, '0')}`,
        validators: [Validators.required, futureOrPresentDateValidator()]
      },
      { name: 'timeOfWork', label: 'Time of Work', type: 'time', initialValue: this.timeOfWork, validators: [Validators.required, futureTimeIfTodayValidator('dateOfWork')] },

      // --- Where is the work? Map first, words as the fallback. ---
      // The map is the preferred answer: it gives operators the area's constant hazards, its LOTO
      // standards and the right job grouping. But a contractor who genuinely does not know which
      // area they are in must still be able to submit - this used to be a hard `required`, and
      // with no map data cached (first run, hub unreachable) the form simply could not be sent.
      {
        name: 'workAreaMap',
        // Multi-select, so the review form shows and can correct EVERY area. It used to render a
        // single-area picker and mention the others only as text in this label, which meant a
        // request covering three areas looked, on the screen the requester actually confirms, like
        // a request covering one.
        label: 'Work Areas — tap each area on the map',
        type: 'work-area-map',
        multiple: true,
        initialValue: this.workAreaMapInitialValue(),
        showWhen: { field: 'workAreaUnknown', value: false },
        validators: [Validators.required],
      },
      {
        name: 'locationDetail',
        label: 'Location Details',
        type: 'text',
        initialValue: this.getLocationDetail(),
        placeholder: 'Anything that helps us find you (optional)',
        showWhen: { field: 'workAreaUnknown', value: false },
      },
      {
        name: 'workAreaUnknown',
        label: "I'm not sure which area this is — let me describe it instead",
        type: 'checkbox',
        initialValue: this.workAreaUnknown,
      },
      {
        name: 'locationDescription',
        label: 'Where is the work?',
        type: 'textarea',
        initialValue: this.workAreaUnknown ? this.locationOfWork : '',
        placeholder: 'e.g. outside the Unit 2 turbine building, by the blue tanks near the north gate',
        showWhen: { field: 'workAreaUnknown', value: true },
        validators: [Validators.required],
      },
      {
        name: 'workCategoryName',
        label: 'Main Work Scope',
        type: 'select',
        initialValue: this.workCategoryName,
        // Options are injected at runtime by the two hosts that render this field
        // (WorkRequestFormComponent / WorkRequestWizardComponent) — the model has no
        // access to the hub / Supabase / cache. A hardcoded list here would silently
        // drift every time ops adds a category on the hub.
        options: [],
        // Not required — the wizard's own scope-step validator only asks for a
        // couple of words of work-scope text, so requiring the dropdown here made
        // the review form refuse to submit exactly when the wizard said it was
        // done. Left up to the requester to pick or skip.
      },
      { name: 'workRequestedBy', label: 'Work Requested By', type: 'text', initialValue: this.workRequestedBy, placeholder: 'Full name', validators: [Validators.required] },
      { name: 'affectedEquipment', label: 'Affected Equipment', type: 'equipment-picker', initialValue: this.affectedEquipment, validators: [Validators.required] },
      { name: 'workScope', label: 'Detailed Work Scope', type: 'textarea', initialValue: this.workScope, placeholder: 'Describe the work to be performed', validators: [Validators.required] },
      { name: 'isLOTORequired', label: 'LOTO Required?', type: 'radio-group', initialValue: this.isLOTORequired, options: [{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}], validators: [Validators.required] },
      { name: 'isHotWorkRequired', label: 'Hot Work Required?', type: 'radio-group', initialValue: this.isHotWorkRequired, options: [{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}], validators: [Validators.required] },
      {
        name: 'foremanName',
        label: 'Foreman Name',
        type: 'text',
        initialValue: this.foremanName,
        placeholder: 'Hot work foreman name',
        showWhen: { field: 'isHotWorkRequired', value: 'Yes' },
        validators: [Validators.required]
      },
      {
        name: 'fireWatchName',
        label: 'Fire Watch Name',
        type: 'text',
        initialValue: this.fireWatchName,
        placeholder: 'Fire watch person name',
        showWhen: { field: 'isHotWorkRequired', value: 'Yes' },
        validators: [Validators.required]
      },
      // --- Hot work: what kind, and (for welding) the Cr(VI) assessment ---
      // Two levels so the long assessment is only asked of the jobs that need it. The whole block
      // hangs off the Hot Work radio; the Cr(VI) half hangs off Welding specifically, because
      // welding is what liberates hexavalent chromium from chrome-bearing base metal.
      {
        name: 'hotWorkTypes',
        label: 'What kind of hot work?',
        type: 'checkbox-group',
        initialValue: this.hotWorkProfile,
        options: hotWorkTypeOptions(this.hotWorkProfile),
        showWhen: { field: 'isHotWorkRequired', value: 'Yes' },
        // Validators.required is no use on a checkbox-group: the value is an object, and {} is
        // truthy, so it would pass with nothing ticked.
        validators: [atLeastOneCheckedValidator()],
        group: { label: 'Hot Work' },
      },
      {
        name: 'hotWorkOtherDescription',
        label: 'Describe the other hot work',
        type: 'text',
        initialValue: this.hotWorkProfile.otherDescription,
        placeholder: 'e.g. thermal spraying',
        showWhen: { field: 'hotWorkTypes', matches: (v: any) => v?.other === true },
        validators: [Validators.required],
        group: { label: 'Hot Work' },
      },
      {
        name: 'hotWorkFumeLevel',
        label: 'Hot Work Method',
        type: 'radio-group',
        initialValue: this.hotWorkProfile.fumeLevel,
        options: FUME_LEVEL_OPTIONS,
        showWhen: { field: 'hotWorkTypes', matches: (v: any) => v?.welding === true },
        validators: [Validators.required],
        group: { label: 'Welding — Hexavalent Chromium Assessment' },
      },
      {
        name: 'hotWorkChromeContent',
        label: 'Base Metal Chrome Content',
        type: 'radio-group',
        initialValue: this.hotWorkProfile.chromeContent,
        options: CHROME_CONTENT_OPTIONS,
        showWhen: { field: 'hotWorkTypes', matches: (v: any) => v?.welding === true },
        validators: [Validators.required],
        group: { label: 'Welding — Hexavalent Chromium Assessment' },
      },

      {
        name: 'isConfinedSpaceEntryRequired',
        label: 'Confined Space Entry Required?',
        type: 'radio-group',
        initialValue: this.isConfinedSpaceEntryRequired,
        options: [{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}],
        validators: [Validators.required]
      },
      {
        name: 'spaceToBeEntered',
        label: 'Space to be Entered',
        type: 'text',
        initialValue: this.spaceToBeEntered,
        placeholder: 'e.g. Condenser A',
        showWhen: { field: 'isConfinedSpaceEntryRequired', value: 'Yes' },
        validators: [Validators.required]
      },
      // --- Hazards, in the same words the permits use ---
      // What is ticked here seeds the Safe Work / Hot Work / Confined Space permits the operator
      // generates, merged with the work area's own constant hazards. Hot Work and Confined Space
      // only appear once the requester has said that work is involved, so the form stays short for
      // the common case; `setupConditionalValidators` clears a hidden block's value for us.
      {
        name: 'declaredHazards',
        label: 'Tick every hazard present where you will be working',
        type: 'checkbox-group',
        initialValue: this.declaredHazards,
        options: swHazardOptions(this.declaredHazards),
        group: { label: 'Safety Hazards' },
      },
      {
        name: 'declaredHotWorkMeasures',
        label: 'Confirm the hot work precautions in place',
        type: 'checkbox-group',
        initialValue: this.declaredHotWorkMeasures,
        options: hotWorkMeasureOptions(this.declaredHotWorkMeasures),
        showWhen: { field: 'isHotWorkRequired', value: 'Yes' },
        group: { label: 'Hot Work Precautions' },
      },
      {
        name: 'declaredConfinedSpaceHazards',
        label: 'Tick every hazard present in the space',
        type: 'checkbox-group',
        initialValue: this.declaredConfinedSpaceHazards,
        options: confinedSpaceHazardOptions(this.declaredConfinedSpaceHazards),
        showWhen: { field: 'isConfinedSpaceEntryRequired', value: 'Yes' },
        group: { label: 'Confined Space Hazards' },
      },

      { name: 'files', label: 'Attachments', type: 'file', accept: 'image/*,.pdf,.doc,.docx', multiple: true, initialValue: this.attachments.filter(a => a.type !== 'signature'), group: { label: 'Attachments' } },
    ];
  }

  /** The Cr(VI) worksheet score (fume x chrome), or 0 when not assessed. */
  hotWorkExposureScore(): number {
    return hotWorkExposureScore(this.hotWorkProfile);
  }

  /** Everything the requester declared, as readable labels — for summaries and the email fallback. */
  declaredHazardSummary(): { group: string; items: string[] }[] {
    const hotWorkItems: string[] = [];
    if (this.isHotWorkRequired === 'Yes') {
      hotWorkItems.push(...tickedHotWorkTypes(this.hotWorkProfile));
      if (this.hotWorkProfile.other && this.hotWorkProfile.otherDescription) {
        hotWorkItems.push(`Other: ${this.hotWorkProfile.otherDescription}`);
      }
      if (this.hotWorkProfile.welding) {
        const fume = FUME_LEVEL_OPTIONS.find(o => o.value === this.hotWorkProfile.fumeLevel);
        const chrome = CHROME_CONTENT_OPTIONS.find(o => o.value === this.hotWorkProfile.chromeContent);
        if (fume) hotWorkItems.push(fume.label);
        if (chrome) hotWorkItems.push(chrome.label);
        const score = this.hotWorkExposureScore();
        if (score > 0) hotWorkItems.push(`Cr(VI) exposure score: ${score}`);
      }
    }

    const blocks = [
      { group: 'Hot Work', items: hotWorkItems },
      { group: 'Safety Hazards', items: tickedSwHazards(this.declaredHazards) },
      { group: 'Hot Work Precautions', items: this.isHotWorkRequired === 'Yes' ? tickedHotWorkMeasures(this.declaredHotWorkMeasures) : [] },
      { group: 'Confined Space Hazards', items: this.isConfinedSpaceEntryRequired === 'Yes' ? tickedConfinedSpaceHazards(this.declaredConfinedSpaceHazards) : [] },
    ];
    return blocks.filter(b => b.items.length > 0);
  }



    getTableColumns(): Column[] {
      return [
        { id: 'workScope', header: 'Detailed Work Scope', accessorKey: 'workScope' },
        { id: 'company', header: 'Company', accessorKey: 'company' },
        {
          id: 'workAreaName',
          header: 'Work Area',
          accessorFn: (item: IWorkRequest) => item.workAreaName || (item.workAreaUnknown ? 'Not sure — described' : ''),
        },
        { id: 'workCategoryName', header: 'Main Work Scope', accessorKey: 'workCategoryName' },
        { id: 'workRequestedBy', header: 'Requested By', accessorKey: 'workRequestedBy' },
        { id: 'locationOfWork', header: 'Location', accessorKey: 'locationOfWork' },
        { id: 'affectedEquipment', header: 'Affected Equipment', accessorKey: 'affectedEquipment' },
        {
          id: 'status',
          header: 'Status',
          accessorKey: 'status',
          conditionalStyling: (item: IWorkRequest) => this.getStyleByStatus(item.status)
        },
        {
          id: 'dateOfWork',
          header: 'Date of Work',
          accessorFn: (item: IWorkRequest) => new Date(item.dateOfWork).toLocaleDateString()
        },
        { id: 'timeOfWork', header: 'Time of Work', accessorKey: 'timeOfWork' },
        { id: 'isLOTORequired', header: 'LOTO?', accessorKey: 'isLOTORequired' },
        { id: 'isHotWorkRequired', header: 'Hot Work?', accessorKey: 'isHotWorkRequired' },
        { id: 'foremanName', header: 'Foreman', accessorKey: 'foremanName' },
        { id: 'fireWatchName', header: 'Fire Watch', accessorKey: 'fireWatchName' },
        { id: 'isConfinedSpaceEntryRequired', header: 'Confined Space?', accessorKey: 'isConfinedSpaceEntryRequired' },
        { id: 'spaceToBeEntered', header: 'Space Entered', accessorKey: 'spaceToBeEntered' },
        {
          id: 'updatedAt',
          header: 'Last Updated',
          accessorFn: (item: IWorkRequest) => new Date(item.updatedAt).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'short', timeStyle: 'short' })
        },
        { id: 'jhaStatus', header: 'JHA Status', accessorKey: 'jhaStatus'  },
        {
          id: 'attachments',
          header: 'Attachments',
          accessorFn: (item: IWorkRequest) => {
            if (!item.attachments?.length) return '';
            return item.attachments.map(a => a.fileName || a.type).join(', ');
          },
          conditionalStyling: (item: IWorkRequest): { [key: string]: string } => {
            if (item.attachments?.length) {
              return { color: '#1976d2', cursor: 'pointer', textDecoration: 'underline' };
            }
            return {};
          },
          onCellClick: (item: IWorkRequest, event: MouseEvent) => {
            if (!item.attachments?.length) return;
            event.stopPropagation();
            const blobUrls: { url: string; fileName: string; contentType: string }[] = [];
            for (const att of item.attachments) {
              const byteChars = atob(att.base64Content);
              const byteArray = new Uint8Array(byteChars.length);
              for (let i = 0; i < byteChars.length; i++) {
                byteArray[i] = byteChars.charCodeAt(i);
              }
              const blob = new Blob([byteArray], { type: att.contentType });
              blobUrls.push({ url: URL.createObjectURL(blob), fileName: att.fileName, contentType: att.contentType });
            }
            const htmlParts = blobUrls.map(b => {
              if (b.contentType.startsWith('image/')) {
                return `<div style="margin-bottom:1rem"><h3>${b.fileName}</h3><img src="${b.url}" style="max-width:100%;border:1px solid #ccc;border-radius:4px"></div>`;
              } else if (b.contentType === 'application/pdf') {
                return `<div style="margin-bottom:1rem"><h3>${b.fileName}</h3><iframe src="${b.url}" style="width:100%;height:600px;border:1px solid #ccc;border-radius:4px"></iframe></div>`;
              } else {
                return `<div style="margin-bottom:1rem"><h3><a href="${b.url}" download="${b.fileName}">${b.fileName}</a> (click to download)</h3></div>`;
              }
            });
            const html = `<!DOCTYPE html><html><head><title>Attachments</title><style>body{font-family:sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem}h3{margin:0.5rem 0}</style></head><body><h2>Attachments (${blobUrls.length})</h2>${htmlParts.join('')}</body></html>`;
            const pageBlob = new Blob([html], { type: 'text/html' });
            window.open(URL.createObjectURL(pageBlob), '_blank');
          }
        },
      ];
    }

    getStyleByStatus(status: string): { backgroundColor: string; color: string } {
      switch (status) {
        case 'new':
          return { backgroundColor: '#f1f1f1', color: '#000' };
        case 'pending':
          return { backgroundColor: '#ffeb3b', color: '#000' };
        case 'received':
          return { backgroundColor: '#4caf50', color: '#fff' };
        case 'revoked':
          return { backgroundColor: '#f44336', color: '#fff' };
        case 'sent via email':
          return { backgroundColor: '#2196f3', color: '#fff' };
        default:
          return { backgroundColor: '#f1f1f1', color: '#000' };
      }
    }

  getAttachmentsByType(type: 'photo' | 'signature' | 'document'): IAttachment[] {
    return this.attachments.filter(a => a.type === type);
  }

  getSignatureDataUrl(): string | null {
    const sig = this.attachments.find(a => a.type === 'signature');
    if (!sig?.base64Content) return null;
    return `data:${sig.contentType || 'image/png'};base64,${sig.base64Content}`;
  }

  getLocationDetail(): string {
    if (!this.locationOfWork || !this.workAreaName) return this.locationOfWork || '';
    const prefix = `${this.workAreaName} - `;
    return this.locationOfWork.startsWith(prefix)
      ? this.locationOfWork.slice(prefix.length)
      : (this.locationOfWork === this.workAreaName ? '' : this.locationOfWork);
  }

  convertToPaModel(): WorkRequestPa {
    // Build a UTC ISO string for Power Automate.
    // The user enters date + time which represent Central Time.
    // We construct a Date using the form values (interpreted as browser-local time),
    // then toISOString() converts to UTC. This is correct when the browser is in
    // Central Time (America/Chicago), which is always the case for this power plant PWA.
    const d = this.dateOfWork instanceof Date ? this.dateOfWork : new Date(this.dateOfWork);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const centralDateTime = new Date(`${dateStr}T${this.timeOfWork || '00:00'}:00`);
    const combinedDateTime = centralDateTime.toISOString(); // UTC with Z suffix

    return new WorkRequestPa({
      PwaId: this.localUuid,
      Company: this.company,
      DateOfWork: combinedDateTime,
      LocationOfWork: this.locationOfWork,
      WorkRequestedBy: this.workRequestedBy,
      AffectedEquipment: this.affectedEquipment,
      WorkScope: this.workScope,
      MainWorkScope: this.workCategoryName,
      WorkAreaName: this.workAreaName,
      IsLOTORequired: this.isLOTORequired === 'Yes',
      IsHotWorkRequired: this.isHotWorkRequired === 'Yes',
      IsConfinedSpaceEntryRequired: this.isConfinedSpaceEntryRequired === 'Yes',
      ForemanName: this.foremanName,
      FireWatchName: this.fireWatchName,
      SpaceToBeEntered: this.spaceToBeEntered,
      // This is the hub-is-down path, so SharePoint is the only place the declaration will exist
      // until the hub polls the item back in.
      DeclaredHazards: declaredHazardsEnvelope(
        this.declaredHazards, this.declaredHotWorkMeasures, this.declaredConfinedSpaceHazards,
        this.isHotWorkRequired === 'Yes' ? this.hotWorkProfile : null),
      // Same reasoning as the hazard envelope above, and the same path: this is the hub-is-down
      // route, so SharePoint is the only place the extra areas will exist until the hub polls the
      // item back in. Only sent when there is genuinely more than the primary area.
      WorkAreas: (this.workAreas?.length ?? 0) > 1 ? JSON.stringify(this.workAreas) : ''
    });
  }

  getEmailBody(): string {
    const d = this.dateOfWork instanceof Date ? this.dateOfWork : new Date(this.dateOfWork);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = this.timeOfWork || 'Not specified';

    const lines: [string, string][] = [
      ['Company', this.company],
      ['Work Area', this.workAreaName],
      ['Main Work Scope', this.workCategoryName],
      ['Date of Work', dateStr],
      ['Time of Work', timeStr],
      ['Location of Work', this.locationOfWork],
      ['Work Requested By', this.workRequestedBy],
      ['Affected Equipment', this.affectedEquipment],
      ['Detailed Work Scope', this.workScope],
      ['LOTO Required', this.isLOTORequired],
      ['Hot Work Required', this.isHotWorkRequired],
      ['Foreman Name', this.foremanName],
      ['Fire Watch Name', this.fireWatchName],
      ['Confined Space Entry Required', this.isConfinedSpaceEntryRequired],
      ['Space to be Entered', this.spaceToBeEntered],
    ];

    let body = '--- Work Request ---\n\n';
    for (const [label, value] of lines) {
      if (value) {
        body += `${label}: ${value}\n`;
      }
    }

    // The email fallback is the last resort, so it has to carry the declaration too - an operator
    // reading it needs the same hazards they would have seen in the app.
    for (const block of this.declaredHazardSummary()) {
      body += `\n${block.group}:\n`;
      for (const item of block.items) {
        body += `  - ${item}\n`;
      }
    }

    if (this.attachments.length > 0) {
      body += `\nAttachments: ${this.attachments.length} file(s) - please download and attach separately.\n`;
    }

    return body;
  }
}
