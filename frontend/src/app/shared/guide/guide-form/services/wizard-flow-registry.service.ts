import { Injectable } from '@angular/core';
import { WizardFlow, WizardFlowType } from '../wizard-stack.types';

// Import flow definitions
import { BUILD_STANDARD_FLOW } from '../flows/build-standard.flow';
import { ADD_LOTO_POINT_FLOW } from '../flows/add-loto-point.flow';
import { CREATE_VALUE_FLOW } from '../flows/create-value.flow';
import { CREATE_ZERO_ENERGY_FLOW } from '../flows/create-zero-energy.flow';
import { UPLOAD_FILE_FLOW } from '../flows/upload-file-wizard.flow';
import { SELECT_FILE_FLOW } from '../flows/select-file.flow';

@Injectable({ providedIn: 'root' })
export class WizardFlowRegistryService {
  private flows = new Map<WizardFlowType, WizardFlow>();

  constructor() {
    // Register all flows
    this.registerFlow(BUILD_STANDARD_FLOW);
    this.registerFlow(ADD_LOTO_POINT_FLOW);
    this.registerFlow(CREATE_VALUE_FLOW);
    this.registerFlow(CREATE_ZERO_ENERGY_FLOW);
    this.registerFlow(UPLOAD_FILE_FLOW);
    this.registerFlow(SELECT_FILE_FLOW);
  }

  /**
   * Register a flow definition
   */
  registerFlow(flow: WizardFlow): void {
    this.flows.set(flow.type, flow);
  }

  /**
   * Get a flow by type
   */
  getFlow(type: WizardFlowType): WizardFlow | undefined {
    return this.flows.get(type);
  }

  /**
   * Get all registered flows
   */
  getAllFlows(): WizardFlow[] {
    return Array.from(this.flows.values());
  }

  /**
   * Get main flows (entry points - not branches)
   */
  getMainFlows(): WizardFlow[] {
    return this.getAllFlows().filter(f => !f.canBranch);
  }

  /**
   * Get branch-capable flows
   */
  getBranchFlows(): WizardFlow[] {
    return this.getAllFlows().filter(f => f.canBranch);
  }

  /**
   * Check if a flow type exists
   */
  hasFlow(type: WizardFlowType): boolean {
    return this.flows.has(type);
  }
}
