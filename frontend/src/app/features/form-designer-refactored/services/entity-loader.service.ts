import { Injectable } from '@angular/core';
import { SafeWorkDto } from '../../../models/permits/safe-work.model';
import { HotWorkDto } from '../../../models/permits/hot-work.model';
import { ConfinedSpaceDto } from '../../../models/permits/confined-space.model';
import { LotoDto } from '../../../models/loto/loto.model';
import { Jha, JobStep } from '../../../models/permits/jha.model';
import { FormField } from '../../../models/ui/form-field.model';

@Injectable({ providedIn: 'root' })
export class EntityLoaderService {

  loadEntityDto(formType: string): any {
    switch (formType) {
      case 'SafeWork': return new SafeWorkDto();
      case 'HotWork': return new HotWorkDto();
      case 'ConfinedSpace': return new ConfinedSpaceDto();
      case 'Loto': return new LotoDto();
      case 'Jha': return new Jha();
      case 'JobStep': return new JobStep();
      case 'WorkRequest':
      default: return null;
    }
  }

  loadEntityFields(formType: string): FormField[] {
    const entity = this.loadEntityDto(formType);
    if (!entity) return [];

    switch (formType) {
      case 'SafeWork': return SafeWorkDto.toFormFields(entity as SafeWorkDto, []);
      case 'HotWork': return HotWorkDto.toFormFields(entity as HotWorkDto, []);
      case 'ConfinedSpace': return ConfinedSpaceDto.toFormFields(entity as ConfinedSpaceDto, []);
      case 'Loto': return LotoDto.toFormFields(entity as LotoDto);
      case 'Jha': return (entity as Jha).getFormFields();
      case 'JobStep': return (entity as JobStep).getFormFields();
      default: return [];
    }
  }

  loadEntityWithFields(formType: string): { entity: any; fields: FormField[] } {
    return {
      entity: this.loadEntityDto(formType),
      fields: this.loadEntityFields(formType),
    };
  }

  getSupportedFormTypes(): string[] {
    return ['SafeWork', 'HotWork', 'ConfinedSpace', 'Loto', 'Jha', 'JobStep', 'WorkRequest'];
  }

  isFormTypeSupported(formType: string): boolean {
    return this.getSupportedFormTypes().includes(formType);
  }
}
