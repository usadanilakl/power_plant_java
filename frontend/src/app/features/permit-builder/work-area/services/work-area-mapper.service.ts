import { Injectable } from '@angular/core';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { WorkAreaDto } from '../../../../models/permits/work-area.model';
import { Option } from '../../../../models/option.model';

@Injectable({ providedIn: 'root' })
export class WorkAreaMapperService {

  toFormFields(
    entity: WorkAreaDto,
    lotoStandardOptions: Option[] = [],
    locationOptions: Option[] = []
  ): RfFormField[] {
    return WorkAreaDto.toFormFields(entity, lotoStandardOptions, locationOptions);
  }
}
