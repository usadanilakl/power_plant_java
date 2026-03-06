import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AgentChatService, ChatMessage } from './agent-chat.service';
import { RfLotoPointApiService } from '../../features/loto-points/refactored/services/rf-loto-point-api.service';
import { LotoPointIdDto } from '../../models/loto/loto-point-id.model';
import { environment } from '../../../environments/environment';

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
  | 'review';

export interface ValueOption {
  id: number;
  name: string;
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

const STEP_ORDER: CreationStep[] = [
  'summary', 'tagNumber', 'description', 'eqType', 'normPos',
  'isoPos', 'location', 'specificLocation', 'zeroEnergy', 'zeroEnergyTemplate',
  'pidConnection', 'review'
];

const STEP_QUESTIONS: Record<string, string> = {
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
  review: 'Ready to create this LOTO point:'
};

@Injectable({ providedIn: 'root' })
export class AgentCreationFlowService {
  private chatService = inject(AgentChatService);
  private lotoPointApi = inject(RfLotoPointApiService);
  private http = inject(HttpClient);

  isActive = signal(false);
  /** Tracks which category is showing the "new value" text input */
  creatingNewValueFor = signal<string | null>(null);
  currentStep = signal<CreationStep | null>(null);
  collectedData = signal<CreationFlowData>({
    tagNumber: null, description: null, unit: null, specificLocation: null,
    eqType: null, normPos: null, isoPos: null, location: null,
    zeroEnergy: null, zeroEnergyTemplate: null,
    pidConnection: null, equipmentIds: null, mainFileId: null
  });
  availableOptions = signal<Record<string, ValueOption[]>>({});
  isCreating = signal(false);

  startFlow(responseData: Record<string, any>): void {
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

    // Add summary message
    this.addStepMessage('summary');
    this.currentStep.set('summary');

    // Auto-advance past summary after a short delay
    setTimeout(() => this.advanceToNextUnfilled(), 100);
  }

  selectOption(field: string, option: ValueOption): void {
    this.collectedData.update(d => ({ ...d, [field]: option }));

    // Add user "selected" message
    this.addUserMessage(`${option.name}`);

    this.advanceToNextUnfilled();
  }

  submitText(field: string, value: string): void {
    this.collectedData.update(d => ({ ...d, [field]: value }));
    this.addUserMessage(value || '(skipped)');
    this.advanceToNextUnfilled();
  }

  selectYesNo(field: string, value: boolean): void {
    this.collectedData.update(d => ({ ...d, [field]: value }));
    this.addUserMessage(value ? 'Yes' : 'No');
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

  cancelFlow(): void {
    this.isActive.set(false);
    this.currentStep.set(null);
    this.collectedData.set({
      tagNumber: null, description: null, unit: null, specificLocation: null,
      eqType: null, normPos: null, isoPos: null, location: null,
      zeroEnergy: null, zeroEnergyTemplate: null,
      pidConnection: null, equipmentIds: null, mainFileId: null
    });
    this.availableOptions.set({});
  }

  private advanceToNextUnfilled(): void {
    const data = this.collectedData();
    const currentIdx = this.currentStep()
      ? STEP_ORDER.indexOf(this.currentStep()!)
      : 0;

    for (let i = currentIdx + 1; i < STEP_ORDER.length; i++) {
      const step = STEP_ORDER[i];

      // Skip steps that already have values (AI pre-filled)
      if (step === 'tagNumber' && data.tagNumber) continue;
      if (step === 'description' && data.description) continue;
      if (step === 'specificLocation' && data.specificLocation) continue;

      // Skip zeroEnergyTemplate if user said "No" to zero energy
      if (step === 'zeroEnergyTemplate' && data.zeroEnergy === false) continue;

      // Dropdown steps: skip if AI resolved, but still show if not resolved
      // (even if resolved, we show them — user can change via chips)
      // Actually per plan: always show chip selects so user can confirm/change
      // But skip text fields that are already filled

      this.currentStep.set(step);
      this.addStepMessage(step);
      return;
    }

    // All steps done — show review
    this.currentStep.set('review');
    this.addStepMessage('review');
  }

  private addStepMessage(step: CreationStep): void {
    const data = this.collectedData();
    const options = this.availableOptions();

    const msg: ChatMessage = {
      role: 'assistant',
      content: STEP_QUESTIONS[step] || '',
      type: 'creation_flow' as any,
      data: {
        step,
        field: step,
        options: options[step] || [],
        preSelected: (data as any)[step] || null,
        collectedData: { ...data }
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
