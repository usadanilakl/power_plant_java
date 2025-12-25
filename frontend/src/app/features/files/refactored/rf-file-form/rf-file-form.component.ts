
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RfFileStateService } from '../services/rf-file-state.service';
import { FileDto } from '../../../../models/file/file.model';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { ClipboardFormComponent } from '../../../../shared/reactive-form/refactored/form-clipboard/clipboard-form.component';
import { ClipboardService } from '../../../../shared/clipboard/clipboard.service';
import { FileMapperService } from '../services/rf-file-mapper.service';

type FileFieldName = keyof FileDto;

@Component({
  selector: 'app-rf-file-form',
  imports: [RfReactiveFormComponent, ClipboardFormComponent],
  templateUrl: './rf-file-form.component.html',
  styleUrl: './rf-file-form.component.css',
})
export class RfFileFormComponent {
  protected stateService = inject(RfFileStateService);
  protected mapperService = inject(FileMapperService);
  protected clipboardService = inject(ClipboardService);

  entityInput = input<FileDto>();
  fieldsInput = input<FileFieldName[]>([]);

  private entityFromState = this.stateService.selectedItem;

  entity = computed(
    () => this.entityInput() ?? this.entityFromState() ?? new FileDto()
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

    console.log('Entity:', entity);
    console.log('Using default fields:', this.mapperService.toFormFields(entity));
    return this.mapperService.toFormFields(entity);
  });

  onAnyValueChange(item: FileDto) {
    this.stateService.saveDraft(item);
  }

  onSubmit(item: FileDto) {
    this.stateService.submitForm(item);
  }

  //===========================CLIPBOARD===========================
  initialEntity = signal<FileDto>(new FileDto());

  private captureInitialEntity = effect(() => {
    const entity = this.entity();
    const current = this.initialEntity();

    if (
      entity &&
      (entity.id || entity.name || entity.fileNumber.length > 0) &&
      !(current.id || current.name || current.fileNumber.length > 0)
    ) {
      this.initialEntity.set(structuredClone(entity));
    }
  });

  clipboardItems = computed(() => {
    const section = this.clipboardService.getSectionByType('File');
    return section?.items ?? [];
  });

  hasValidData = (entity: FileDto): boolean => {
    return !!(entity.id || entity.name || entity.fileNumber.length > 0);
  };

  getItemSummary = (item: FileDto): string => {
    return `${item.name || item.fileNumber.join(',') || 'N/A'} - ${
      item.fileType?.name || 'No type'
    }`;
  };

  onClipboardItemSelected(item: FileDto): void {
    if (item) {
      console.log('Loading item from clipboard:', item);
      this.stateService.setSelectedItem(new FileDto(item));
    }
  }
}
