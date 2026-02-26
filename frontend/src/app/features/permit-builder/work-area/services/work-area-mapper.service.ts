import { Injectable } from '@angular/core';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { WorkAreaDto } from '../../../../models/permits/work-area.model';

@Injectable({ providedIn: 'root' })
export class WorkAreaMapperService {

  toFormFields(entity: WorkAreaDto): RfFormField[] {
    return WorkAreaDto.toFormFields(entity);
  }
}
