import { Injectable } from '@angular/core';
import { SafeWorkDto } from '../../../../models/permits/safe-work.model';
import { HotWorkDto } from '../../../../models/permits/hot-work.model';
import { ConfinedSpaceDto } from '../../../../models/permits/confined-space.model';
import { LotoDto } from '../../../../models/loto/loto.model';
import { Jha, JobStep } from '../../../../models/permits/jha.model';
import { FormField } from '../../../../models/ui/form-field.model';

/**
 * Loads entity DTOs and their corresponding form fields for different form types
 */
@Injectable({
  providedIn: 'root'
})
export class FormEntityLoaderService {

  /**
   * Loads the entity DTO for a given form type
   */
  loadEntityDto(formType: string): any {
    switch (formType) {
      case 'SafeWork':
        return new SafeWorkDto();

      case 'HotWork':
        return new HotWorkDto();

      case 'ConfinedSpace':
        return new ConfinedSpaceDto();

      case 'Loto':
        return new LotoDto();

      case 'Jha':
        return new Jha();

      case 'JobStep':
        return new JobStep();

      case 'WorkRequest':
      default:
        return null;
    }
  }

  /**
   * Loads the form fields for a given entity DTO
   */
  loadEntityFields(formType: string): FormField[] {
    const entity = this.loadEntityDto(formType);
    if (!entity) return [];

    switch (formType) {
      case 'SafeWork':
        return SafeWorkDto.toFormFields(entity as SafeWorkDto, []);

      case 'HotWork':
        return HotWorkDto.toFormFields(entity as HotWorkDto, []);

      case 'ConfinedSpace':
        return ConfinedSpaceDto.toFormFields(entity as ConfinedSpaceDto, []);

      case 'Loto':
        return LotoDto.toFormFields(entity as LotoDto);

      case 'Jha':
        return (entity as Jha).getFormFields();

      case 'JobStep':
        return (entity as JobStep).getFormFields();

      default:
        return [];
    }
  }

  /**
   * Loads both entity and fields for a given form type
   */
  loadEntityWithFields(formType: string): { entity: any; fields: FormField[] } {
    const entity = this.loadEntityDto(formType);
    const fields = this.loadEntityFields(formType);

    return { entity, fields };
  }

  /**
   * Gets supported form types
   */
  getSupportedFormTypes(): string[] {
    return ['SafeWork', 'HotWork', 'ConfinedSpace', 'Loto', 'Jha', 'JobStep', 'WorkRequest'];
  }

  /**
   * Checks if a form type is supported
   */
  isFormTypeSupported(formType: string): boolean {
    return this.getSupportedFormTypes().includes(formType);
  }
}
