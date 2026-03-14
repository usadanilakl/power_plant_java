import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AgentChatService, ChatMessage } from './agent-chat.service';
import { RfLotoPointApiService } from '../../features/loto-points/refactored/services/rf-loto-point-api.service';
import { LotoPointIdDto } from '../../models/loto/loto-point-id.model';
import { environment } from '../../../environments/environment';

export type FlowType = 'loto' | 'workRequest';

export type CreationStep =
  | 'summary'
  | 'tagNumber'
  | 'description'
  | 'eqType'
  | 'normPos'
  | 'isoPos'
  | 'location'
  | 'specificLocation'
  | 'zeroEnergy'
  | 'zeroEnergyTemplate'
  | 'pidConnection'
  | 'review'
  // WR-specific steps
  | 'workScope'
  | 'company'
  | 'workArea'
  | 'affectedEquipment'
  | 'hotWork'
  | 'lotoRequired'
  | 'confinedSpace'
  | 'dateOfWork'
  | 'requestedBy'
  | 'submitterInfo';

export interface ValueOption {
  id: number;
  name: string;
  description?: string;
}

export interface CreationFlowData {
  tagNumber: string | null;
  description: string | null;
  unit: string | null;
  specificLocation: string | null;
  eqType: ValueOption | null;
  normPos: ValueOption | null;
  isoPos: ValueOption | null;
  location: ValueOption | null;
  zeroEnergy: boolean | null;
  zeroEnergyTemplate: ValueOption | null;
  pidConnection: boolean | null;
  equipmentIds: number[] | null;
  mainFileId: number | null;
}

export interface WrFlowData {
  workScope: string | null;
  company: string | null;
  location: string | null;
  workArea: ValueOption | null;
  affectedEquipment: string | null;
  isHotWorkRequired: boolean | null;
  isLotoRequired: boolean | null;
  isConfinedSpaceEntryRequired: boolean | null;
  dateOfWork: string | null;
  requestedBy: string | null;
  foremanName: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  submitterPhone: string | null;
  submitterCompany: string | null;
}

const LOTO_STEP_ORDER: CreationStep[] = [
  'summary', 'tagNumber', 'description', 'eqType', 'normPos',
  'isoPos', 'location', 'specificLocation', 'zeroEnergy', 'zeroEnergyTemplate',
  'pidConnection', 'review'
];

const WR_STEP_ORDER: CreationStep[] = [
  'summary', 'workScope', 'company', 'workArea', 'affectedEquipment',
  'hotWork', 'lotoRequired', 'confinedSpace', 'dateOfWork', 'requestedBy',
  'submitterInfo', 'review'
];

const STEP_QUESTIONS: Record<string, string> = {
  // LOTO steps
  tagNumber: 'What is the tag number for this LOTO point?',
  description: 'What is the description for this LOTO point?',
  eqType: 'What type of equipment is this?',
  normPos: 'What is the normal operating position?',
  isoPos: 'What is the isolated position?',
  location: 'What is the general location?',
  specificLocation: 'What is the specific location? (optional — type or skip)',
  zeroEnergy: 'Does this point require zero energy verification?',
  zeroEnergyTemplate: 'Select a zero energy phrase template:',
  pidConnection: 'Connect this point to a P&ID drawing?',
  // WR steps
  workScope: 'Describe the work to be performed:',
  company: 'What is your company name?',
  workArea: 'Select the work area on the plant:',
  affectedEquipment: 'What equipment is affected? (optional — type or skip)',
  hotWork: 'Does this work require hot work? (welding, cutting, grinding)',
  lotoRequired: 'Does this work require energy isolation (LOTO)?',
  confinedSpace: 'Does this work require confined space entry?',
  dateOfWork: 'When will the work be performed? (MM/DD/YYYY)',
  requestedBy: 'Who is requesting this work?',
  submitterInfo: 'Please provide your contact information:',
  review: 'Ready to submit:'
};

@Injectable({ providedIn: 'root' })
export class AgentCreationFlowService {
  private chatService = inject(AgentChatService);
  private lotoPointApi = inject(RfLotoPointApiService);
  private http = inject(HttpClient);

  isActive = signal(false);
  flowType = signal<FlowType | null>(null);
  /** Tracks which category is showing the "new value" text input */
  creatingNewValueFor = signal<string | null>(null);
  currentStep = signal<CreationStep | null>(null);
  collectedData = signal<CreationFlowData>({
    tagNumber: null, description: null, unit: null, specificLocation: null,
    eqType: null, normPos: null, isoPos: null, location: null,
    zeroEnergy: null, zeroEnergyTemplate: null,
    pidConnection: null, equipmentIds: null, mainFileId: null
  });
  wrData = signal<WrFlowData>({
    workScope: null, company: null, location: null, workArea: null,
    affectedEquipment: null, isHotWorkRequired: null, isLotoRequired: null,
    isConfinedSpaceEntryRequired: null, dateOfWork: null, requestedBy: null,
    foremanName: null, submitterName: null, submitterEmail: null,
    submitterPhone: null, submitterCompany: null
  });
  hazardHints = signal<string[]>([]);
  availableOptions = signal<Record<string, ValueOption[]>>({});
  isCreating = signal(false);

  startFlow(responseData: Record<string, any>): void {
    const ft = responseData['flowType'] || 'loto';
    this.flowType.set(ft);

    if (ft === 'workRequest') {
      this.startWrFlow(responseData);
    } else {
      this.startLotoFlow(responseData);
    }
  }

  private startLotoFlow(responseData: Record<string, any>): void {
    const resolved = responseData['resolvedData'] || {};
    const options = responseData['availableOptions'] || {};

    this.collectedData.set({
      tagNumber: resolved['tagNumber'] || null,
      description: resolved['description'] || null,
      unit: resolved['unit'] || null,
      specificLocation: resolved['specificLocation'] || null,
      eqType: resolved['eqType'] || null,
      normPos: resolved['normPos'] || null,
      isoPos: resolved['isoPos'] || null,
      location: resolved['location'] || null,
      zeroEnergy: null,
      zeroEnergyTemplate: null,
      pidConnection: null,
      equipmentIds: null,
      mainFileId: null
    });

    this.availableOptions.set(options);
    this.isActive.set(true);

    this.addStepMessage('summary');
    this.currentStep.set('summary');
    setTimeout(() => this.advanceToNextUnfilled(), 100);
  }

  private startWrFlow(responseData: Record<string, any>): void {
    const resolved = responseData['resolvedData'] || {};
    const options = responseData['availableOptions'] || {};
    const hints = responseData['hazardHints'] || [];

    this.wrData.set({
      workScope: resolved['workScope'] || null,
      company: resolved['company'] || null,
      location: resolved['location'] || null,
      workArea: resolved['workArea'] || null,
      affectedEquipment: resolved['affectedEquipment'] || null,
      isHotWorkRequired: resolved['isHotWorkRequired'] ?? null,
      isLotoRequired: resolved['isLotoRequired'] ?? null,
      isConfinedSpaceEntryRequired: resolved['isConfinedSpaceEntryRequired'] ?? null,
      dateOfWork: resolved['dateOfWork'] || null,
      requestedBy: resolved['requestedBy'] || null,
      foremanName: resolved['foremanName'] || null,
      submitterName: null,
      submitterEmail: null,
      submitterPhone: null,
      submitterCompany: resolved['company'] || null
    });

    this.hazardHints.set(hints);
    this.availableOptions.set(options);
    this.isActive.set(true);

    this.addStepMessage('summary');
    this.currentStep.set('summary');
    setTimeout(() => this.advanceToNextUnfilled(), 100);
  }

  selectOption(field: string, option: ValueOption): void {
    if (this.flowType() === 'workRequest') {
      this.wrData.update(d => ({ ...d, [field]: option }));
    } else {
      this.collectedData.update(d => ({ ...d, [field]: option }));
    }
    this.addUserMessage(`${option.name}`);
    this.advanceToNextUnfilled();
  }

  submitText(field: string, value: string): void {
    if (this.flowType() === 'workRequest') {
      this.wrData.update(d => ({ ...d, [field]: value }));
    } else {
      this.collectedData.update(d => ({ ...d, [field]: value }));
    }
    this.addUserMessage(value || '(skipped)');
    this.advanceToNextUnfilled();
  }

  selectYesNo(field: string, value: boolean): void {
    if (this.flowType() === 'workRequest') {
      // Map WR step names to data field names
      const wrFieldMap: Record<string, string> = {
        hotWork: 'isHotWorkRequired',
        lotoRequired: 'isLotoRequired',
        confinedSpace: 'isConfinedSpaceEntryRequired'
      };
      const wrField = wrFieldMap[field] || field;
      this.wrData.update(d => ({ ...d, [wrField]: value }));
    } else {
      this.collectedData.update(d => ({ ...d, [field]: value }));
    }
    this.addUserMessage(value ? 'Yes' : 'No');
    this.advanceToNextUnfilled();
  }

  /** Submit multiple text fields at once (used for submitter info group) */
  submitMultipleText(fields: Record<string, string>): void {
    if (this.flowType() === 'workRequest') {
      this.wrData.update(d => ({ ...d, ...fields }));
    }
    const summary = Object.values(fields).filter(v => v).join(', ') || '(skipped)';
    this.addUserMessage(summary);
    this.advanceToNextUnfilled();
  }

  skipStep(): void {
    this.addUserMessage('(skipped)');
    this.advanceToNextUnfilled();
  }

  /** Show the "new value" text input for a category */
  startCreatingNewValue(categoryAlias: string): void {
    this.creatingNewValueFor.set(categoryAlias);
  }

  /** Cancel the "new value" text input */
  cancelCreatingNewValue(): void {
    this.creatingNewValueFor.set(null);
  }

  /** Create a new Value in the given category and auto-select it */
  createNewValue(categoryAlias: string, valueName: string): void {
    if (!valueName.trim()) return;
    this.creatingNewValueFor.set(null);

    this.http.post<any>(`${environment.apiUrl}/values/add-to-category-by-name`, {
      category: categoryAlias,
      value: valueName.trim(),
      valueAlias: ''
    }).subscribe({
      next: (res) => {
        const created = res.responseData || res;
        const option: ValueOption = { id: created.id, name: created.name || valueName.trim() };

        // Add to available options
        this.availableOptions.update(opts => {
          const current = opts[categoryAlias] || [];
          return { ...opts, [categoryAlias]: [...current, option] };
        });

        // Auto-select the new value
        this.selectOption(categoryAlias, option);
      },
      error: (err) => {
        const msg: ChatMessage = {
          role: 'assistant',
          content: 'Failed to create value: ' + (err?.error?.message || err?.message || 'Unknown error'),
          type: 'error',
          timestamp: new Date()
        };
        this.chatService.messages.update(msgs => [...msgs, msg]);
      }
    });
  }

  /** Called from the dialog result after P&ID connection */
  setEquipmentConnection(equipmentIds: number[], fileId: number | null): void {
    this.collectedData.update(d => ({
      ...d,
      pidConnection: true,
      equipmentIds,
      mainFileId: fileId
    }));
  }

  /** Advance past pidConnection step after dialog closes */
  advanceAfterPidConnection(): void {
    this.advanceToNextUnfilled();
  }

  createLotoPoint(): void {
    const data = this.collectedData();
    this.isCreating.set(true);

    const dto = new LotoPointIdDto({
      tagNumber: data.tagNumber,
      description: data.description,
      unit: data.unit,
      specificLocation: data.specificLocation,
      eqType: data.eqType?.id ?? null,
      normPos: data.normPos?.id ?? null,
      isoPos: data.isoPos?.id ?? null,
      location: data.location?.id ?? null,
      equipmentIdList: data.equipmentIds ?? null,
      zeroEnergy: data.zeroEnergyTemplate ? {
        id: null,
        zeroEnergyTemplateId: data.zeroEnergyTemplate.id,
        templateEquipmentIds: [],
      } : null,
    });

    this.lotoPointApi.createLotoPoint(dto as any).subscribe({
      next: (res) => {
        this.isCreating.set(false);
        const created = res.responseData;
        const msg: ChatMessage = {
          role: 'assistant',
          content: `LOTO point created successfully! Tag: ${created?.tagNumber || data.tagNumber}`,
          type: 'action_completed',
          data: { id: created?.id, tagNumber: created?.tagNumber },
          timestamp: new Date()
        };
        this.chatService.messages.update(msgs => [...msgs, msg]);
        this.cancelFlow();
      },
      error: (err) => {
        this.isCreating.set(false);
        const msg: ChatMessage = {
          role: 'assistant',
          content: 'Failed to create LOTO point: ' + (err?.error?.message || err?.message || 'Unknown error'),
          type: 'error',
          timestamp: new Date()
        };
        this.chatService.messages.update(msgs => [...msgs, msg]);
      }
    });
  }

  getWizardData(): Record<string, any> {
    const data = this.collectedData();
    return {
      tagNumber: data.tagNumber,
      description: data.description,
      unit: data.unit,
      specificLocation: data.specificLocation,
      eqType: data.eqType ? { id: data.eqType.id, name: data.eqType.name } : null,
      normPos: data.normPos ? { id: data.normPos.id, name: data.normPos.name } : null,
      isoPos: data.isoPos ? { id: data.isoPos.id, name: data.isoPos.name } : null,
      location: data.location ? { id: data.location.id, name: data.location.name } : null,
    };
  }

  createWorkRequest(): void {
    const data = this.wrData();
    this.isCreating.set(true);

    const dto: any = {
      workScope: data.workScope,
      company: data.company,
      location: data.location,
      affectedEquipment: data.affectedEquipment,
      isHotWorkRequired: data.isHotWorkRequired ?? false,
      isLotoRequired: data.isLotoRequired ?? false,
      isConfinedSpaceEntryRequired: data.isConfinedSpaceEntryRequired ?? false,
      dateOfWorkToBePerformed: data.dateOfWork,
      requestedBy: data.requestedBy,
      foreman: data.foremanName,
      submitterName: data.submitterName,
      submitterEmail: data.submitterEmail,
      submitterPhone: data.submitterPhone,
      submitterCompany: data.submitterCompany,
      workArea: data.workArea ? { id: data.workArea.id } : null
    };

    this.http.post<any>(`${environment.apiUrl}/work-requests`, [dto]).subscribe({
      next: (res) => {
        this.isCreating.set(false);
        const list = res.responseData || res;
        const created = Array.isArray(list) ? list[0] : list;
        const msg: ChatMessage = {
          role: 'assistant',
          content: `Work request created successfully! ID: ${created?.id || 'N/A'}`,
          type: 'action_completed',
          data: { id: created?.id },
          timestamp: new Date()
        };
        this.chatService.messages.update(msgs => [...msgs, msg]);
        this.cancelFlow();
      },
      error: (err) => {
        this.isCreating.set(false);
        const msg: ChatMessage = {
          role: 'assistant',
          content: 'Failed to create work request: ' + (err?.error?.message || err?.message || 'Unknown error'),
          type: 'error',
          timestamp: new Date()
        };
        this.chatService.messages.update(msgs => [...msgs, msg]);
      }
    });
  }

  cancelFlow(): void {
    this.isActive.set(false);
    this.flowType.set(null);
    this.currentStep.set(null);
    this.collectedData.set({
      tagNumber: null, description: null, unit: null, specificLocation: null,
      eqType: null, normPos: null, isoPos: null, location: null,
      zeroEnergy: null, zeroEnergyTemplate: null,
      pidConnection: null, equipmentIds: null, mainFileId: null
    });
    this.wrData.set({
      workScope: null, company: null, location: null, workArea: null,
      affectedEquipment: null, isHotWorkRequired: null, isLotoRequired: null,
      isConfinedSpaceEntryRequired: null, dateOfWork: null, requestedBy: null,
      foremanName: null, submitterName: null, submitterEmail: null,
      submitterPhone: null, submitterCompany: null
    });
    this.hazardHints.set([]);
    this.availableOptions.set({});
  }

  private advanceToNextUnfilled(): void {
    const ft = this.flowType();
    if (ft === 'workRequest') {
      this.advanceWrStep();
    } else {
      this.advanceLotoStep();
    }
  }

  private advanceLotoStep(): void {
    const data = this.collectedData();
    const currentIdx = this.currentStep()
      ? LOTO_STEP_ORDER.indexOf(this.currentStep()!)
      : 0;

    for (let i = currentIdx + 1; i < LOTO_STEP_ORDER.length; i++) {
      const step = LOTO_STEP_ORDER[i];

      if (step === 'tagNumber' && data.tagNumber) continue;
      if (step === 'description' && data.description) continue;
      if (step === 'specificLocation' && data.specificLocation) continue;
      if (step === 'zeroEnergyTemplate' && data.zeroEnergy === false) continue;

      this.currentStep.set(step);
      this.addStepMessage(step);
      return;
    }

    this.currentStep.set('review');
    this.addStepMessage('review');
  }

  private advanceWrStep(): void {
    const data = this.wrData();
    const currentIdx = this.currentStep()
      ? WR_STEP_ORDER.indexOf(this.currentStep()!)
      : 0;

    for (let i = currentIdx + 1; i < WR_STEP_ORDER.length; i++) {
      const step = WR_STEP_ORDER[i];

      // Skip pre-filled text fields
      if (step === 'workScope' && data.workScope) continue;
      if (step === 'company' && data.company) continue;
      if (step === 'affectedEquipment' && data.affectedEquipment) continue;
      if (step === 'requestedBy' && data.requestedBy) continue;

      // Skip pre-filled booleans
      if (step === 'hotWork' && data.isHotWorkRequired !== null) continue;
      if (step === 'lotoRequired' && data.isLotoRequired !== null) continue;
      if (step === 'confinedSpace' && data.isConfinedSpaceEntryRequired !== null) continue;

      // Skip date if pre-filled
      if (step === 'dateOfWork' && data.dateOfWork) continue;

      this.currentStep.set(step);
      this.addStepMessage(step);
      return;
    }

    this.currentStep.set('review');
    this.addStepMessage('review');
  }

  private addStepMessage(step: CreationStep): void {
    const ft = this.flowType();
    const options = this.availableOptions();
    const isWr = ft === 'workRequest';
    const activeData = isWr ? this.wrData() : this.collectedData();

    // Map WR step names to options keys
    const optionsKey = step === 'workArea' ? 'workAreas' : step;

    const msg: ChatMessage = {
      role: 'assistant',
      content: STEP_QUESTIONS[step] || '',
      type: 'creation_flow' as any,
      data: {
        step,
        field: step,
        flowType: ft,
        options: options[optionsKey] || [],
        preSelected: (activeData as any)[step] || null,
        collectedData: { ...activeData },
        hazardHints: isWr ? this.hazardHints() : []
      },
      timestamp: new Date()
    };

    this.chatService.messages.update(msgs => [...msgs, msg]);
  }

  private addUserMessage(text: string): void {
    const msg: ChatMessage = {
      role: 'user',
      content: text,
      type: 'text',
      timestamp: new Date()
    };
    this.chatService.messages.update(msgs => [...msgs, msg]);
  }
}
