import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
import { LotoPointMapperService } from '../services/rf-loto-point-mapper.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { ClipboardFormComponent } from '../../../../shared/reactive-form/refactored/form-clipboard/clipboard-form.component';
import { ClipboardService } from '../../../../shared/clipboard/clipboard.service';

type LotoPointFieldName = keyof LotoPointDto;

@Component({
  selector: 'app-rf-loto-point-form',
  imports: [RfReactiveFormComponent, ClipboardFormComponent],
  templateUrl: './rf-loto-point-form.component.html',
  styleUrl: './rf-loto-point-form.component.css',
})
export class RfLotoPointFormComponent {
  protected stateService = inject(RfLotoPointStateService);
  protected mapperService = inject(LotoPointMapperService);
  protected clipboardService = inject(ClipboardService);

  entityInput = input<LotoPointDto>();
  fieldsInput = input<LotoPointFieldName[]>([]);

  private entityFromState = this.stateService.selectedItem;

  entity = computed(
    () => this.entityInput() ?? this.entityFromState() ?? new LotoPointDto()
  );

  fields = computed(() => {
    const customFields = this.fieldsInput();
    const entity = this.entity();

    if (customFields.length > 0) {
      console.log(
        'Using custom fields:',
        this.mapperService.toFormFields(entity, customFields)
      );
      return this.mapperService.toFormFields(entity, customFields);
    }

    return this.mapperService.toFormFields(entity);
  });

  onAnyValueChange(item: LotoPointDto) {
    this.stateService.saveDraft(item);
  }

  onSubmit(item: LotoPointDto) {
    this.stateService.submitForm(item);
  }

  //===========================CLIPBOARD===========================
  initialEntity = signal<LotoPointDto>(new LotoPointDto());

  private captureInitialEntity = effect(() => {
    const entity = this.entity();
    const current = this.initialEntity();

    if (
      entity &&
      (entity.id || entity.tagNumber || entity.description) &&
      !(current.id || current.tagNumber || current.description)
    ) {
      this.initialEntity.set(structuredClone(entity));
    }
  });

  clipboardItems = computed(() => {
    const section = this.clipboardService.getSectionByType('LotoPoint');
    return section?.items ?? [];
  });

  hasValidData = (entity: LotoPointDto): boolean => {
    return !!(entity.id || entity.tagNumber || entity.description);
  };

  getItemSummary = (item: LotoPointDto): string => {
    return `${item.tagNumber || 'N/A'} - ${
      item.description || 'No description'
    }`;
  };

  onClipboardItemSelected(item: LotoPointDto): void {
    if (item) {
      console.log('Loading item from clipboard:', item);
      this.stateService.setSelectedItem(new LotoPointDto(item));
    }
  }
}

// import {
//   Component,
//   computed,
//   effect,
//   inject,
//   input,
//   signal,
// } from '@angular/core';
// import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
// import { LotoPointMapperService } from '../services/rf-loto-point-mapper.service';
// import { LotoPointDto } from '../../../../models/loto/loto-point.model';
// import { FormField } from '../../../../models/ui/form-field.model';
// import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
// import { ClipboardService } from '../../../../shared/clipboard/clipboard.service';

// type LotoPointFieldName = keyof LotoPointDto;

// @Component({
//   selector: 'app-rf-loto-point-form',
//   imports: [RfReactiveFormComponent],
//   templateUrl: './rf-loto-point-form.component.html',
//   styleUrl: './rf-loto-point-form.component.css',
// })
// export class RfLotoPointFormComponent {
//   protected stateService = inject(RfLotoPointStateService);
//   protected mapperService = inject(LotoPointMapperService);
//   protected clipboardService = inject(ClipboardService);

//   entityInput = input<LotoPointDto>();
//   fieldsInput = input<LotoPointFieldName[]>([]);

//   private entityFromState = this.stateService.selectedItem;

//   entity = computed(
//     () => this.entityInput() ?? this.entityFromState() ?? new LotoPointDto()
//   );

//   fields = computed(() => {
//     const customFields = this.fieldsInput();
//     const entity = this.entity();

//     // If custom fields provided, use them
//     if (customFields.length > 0) {
//       console.log(
//         'Using custom fields:',
//         this.mapperService.toFormFields(entity, customFields)
//       );
//       return this.mapperService.toFormFields(entity, customFields);
//     }

//     // Otherwise use default fields
//     return this.mapperService.toFormFields(entity);
//   });

//   onAnyValueChange(item: LotoPointDto) {
//     this.stateService.saveDraft(item);
//   }

//   onSubmit(item: LotoPointDto) {
//     this.stateService.submitForm(item);
//   }

//   //===========================CLIPBOARD===========================
//   itemNumber = signal<number>(0);
//   initialEntity = new LotoPointDto();

//   private captureInitialEntity = effect(() => {
//     // Only capture once - if already captured, skip
//     if (
//       this.initialEntity.id ||
//       this.initialEntity.tagNumber ||
//       this.initialEntity.description
//     )
//       return;

//     const entity = this.entity();
//     if (entity && (entity.id || entity.tagNumber || entity.description)) {
//       // Create a new instance to preserve the original state
//       this.initialEntity = new LotoPointDto(entity);
//     }
//   });

//   clipboardItems = computed(() => {
//     const section = this.clipboardService.getSectionByType('LotoPoint');
//     if (section) {
//       return section.items;
//     }
//     return [];
//   });
//   clipboardItem = computed(() => {
//     return this.clipboardItems()[this.itemNumber() - 1];
//   });

//   loadItemEffect = effect(() => {
//     if (this.itemNumber() > 0) {
//       const item = this.clipboardItem(); // ✓ Now tracked and re-computed
//       if (item) {
//         console.log('Loading item from clipboard:', item);
//         this.stateService.setSelectedItem(new LotoPointDto(item));
//       }
//     } else {
//       // Load initial entity
//       this.stateService.setSelectedItem(this.initialEntity);
//     }
//   });
// }
