import { Component, ElementRef, forwardRef, HostListener, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IAttachment } from '../../../models/permits/attachment.model';

@Component({
  selector: 'app-file-input',
  standalone: true,
  imports: [],
  templateUrl: './file-input.component.html',
  styleUrl: './file-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileInputComponent),
      multi: true
    }
  ]
})
export class FileInputComponent implements ControlValueAccessor {
  @Input() label: string = 'Choose File';
  @Input() accept: string = '*/*';
  @Input() multiple: boolean = false;
  @Input() capture: string = '';

  files: IAttachment[] = [];
  onChange: Function = () => {};
  onTouched: Function = () => {};
  isDragover: boolean = false;
  hasCamera: boolean = false;

  constructor(private host: ElementRef<HTMLInputElement>) {
    this.hasCamera = 'mediaDevices' in navigator && 'ontouchstart' in window;
  }

  @HostListener('dragover', ['$event']) onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = true;
  }

  @HostListener('dragleave', ['$event']) onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = false;
  }

  @HostListener('drop', ['$event']) onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = false;
    const fileList = event.dataTransfer?.files;
    if (fileList && fileList.length > 0) {
      this.processFiles(fileList);
    }
  }

  writeValue(value: any) {
    if (!value) {
      this.files = [];
    } else if (Array.isArray(value)) {
      this.files = value;
    }
  }

  registerOnChange(fn: Function) {
    this.onChange = fn;
  }

  registerOnTouched(fn: Function) {
    this.onTouched = fn;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(input.files);
      input.value = ''; // reset so same file can be re-selected
    }
  }

  private processFiles(fileList: FileList) {
    const fileArray = Array.from(fileList);
    const promises = fileArray.map(file => this.fileToAttachment(file));

    Promise.all(promises).then(attachments => {
      if (this.multiple) {
        this.files = [...this.files, ...attachments];
      } else {
        this.files = attachments.slice(0, 1);
      }
      this.emitValue();
    });
  }

  private fileToAttachment(file: File): Promise<IAttachment> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]; // strip data:... prefix
        const attachment: IAttachment = {
          fileName: file.name,
          contentType: file.type,
          base64Content: base64,
          type: this.guessAttachmentType(file.type)
        };

        // Generate thumbnail for images
        if (file.type.startsWith('image/')) {
          attachment.thumbnailBase64 = reader.result as string; // keep full data URI for preview
        }

        resolve(attachment);
      };
      reader.readAsDataURL(file);
    });
  }

  private guessAttachmentType(contentType: string): 'photo' | 'signature' | 'document' {
    if (contentType.startsWith('image/')) return 'photo';
    return 'document';
  }

  removeFile(index: number) {
    this.files.splice(index, 1);
    this.emitValue();
  }

  private emitValue() {
    if (this.multiple) {
      this.onChange(this.files);
    } else {
      this.onChange(this.files.length > 0 ? this.files : null);
    }
    this.onTouched();
  }
}
