
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RfFileStateService } from '../services/rf-file-state.service';
import { FileDto } from '../../../../models/file/file.model';
import { NestedItem, NestedItemImpl } from '../../../../models/ui/nested-item.model';

@Component({
  selector: 'app-rf-file-left-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rf-file-left-menu.component.html',
  styleUrl: './rf-file-left-menu.component.css',
})
export class RfFileLeftMenuComponent implements OnInit {
  stateService = inject(RfFileStateService);
  destroyRef = inject(DestroyRef);

  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  selectedType = signal<string>('pid');
  expandedItems = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadFiles();
    this.subscribeToFileUpdates();
  }

  private subscribeToFileUpdates(): void {
    this.stateService.allLoadedFiles$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((files) => {
        if (files.length > 0) {
          this.loadFiles();
        }
      });
  }

  loadFiles(type: string = 'pid'): void {
    this.selectedType.set(type);
    const criteria = type === 'pid' ? 'vendor' : 'fileType';
    const files = this.stateService.allLoadedFilesSubject.value;
    const nestedItems = this.createListOfNestedItems(files, criteria);
    this.menuItems.set(nestedItems);
  }

  private createListOfNestedItems(
    data: FileDto[],
    groupBy: 'vendor' | 'system' | 'fileType'
  ): NestedItem[] {
    const groupFiles = (
      files: FileDto[],
      key: 'vendor' | 'system' | 'fileType'
    ): Record<string, FileDto[]> => {
      return files.reduce((acc, file, index) => {
        const groupValue = file[key];

        if (groupValue && typeof groupValue === 'object' && 'name' in groupValue) {
          const groupName = groupValue.name;
          if (!acc[groupName]) {
            acc[groupName] = [];
          }
          acc[groupName].push(file);
        } else {
          console.warn(`File ${index} has invalid or missing ${key}:`, groupValue);
        }

        return acc;
      }, {} as Record<string, FileDto[]>);
    };

    const groupedFiles = groupFiles(data, groupBy);

    return Object.entries(groupedFiles).map(([groupName, files]) => {
      const parentItem = new NestedItemImpl({
        id: groupBy + '_' + groupName,
        name: groupName,
        isExpanded: false,
        objectType: groupBy,
      });

      parentItem.values = files.map(
        (file) =>
          new NestedItemImpl({
            id: file.id.toString(),
            name:
              file.name && file.name.trim() !== ''
                ? file.name
                : file.fileNumber.join(',') || 'Unnamed File',
            isExpanded: false,
            objectType: file.objectType,
            color: this.setFileItemColor(file),
          })
      );

      return parentItem;
    });
  }

  onItemClick(item: NestedItem): void {
    if (item.values && item.values.length > 0) {
      // Parent item clicked - toggle expansion
      this.toggleItemExpansion(item.id+'');
    } else {
      // Child item clicked - select file
      this.selectFile(item.id+'');
    }
  }

  onItemDoubleClick(item: NestedItem): void {
    if (item.values && item.values.length === 0) {
      // Only open form for child items (files)
      this.stateService.openForm();
    }
  }

  toggleItemExpansion(itemId: string): void {
    this.expandedItems.update((expanded) => {
      const newExpanded = new Set(expanded);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      return newExpanded;
    });
  }

  isItemExpanded(itemId: string): boolean {
    return this.expandedItems().has(itemId);
  }

  selectFile(fileId: string): void {
    const files = this.stateService.allLoadedFilesSubject.value;
    const selectedFile = files.find((f) => f.id.toString() === fileId);

    if (selectedFile) {
      this.stateService.setSelectedItem(selectedFile);
    }
  }

  private setFileItemColor(item: FileDto): string {
    if (!item.name || item.name === '') {
      return 'red';
    }
    if (!item.isVerified) {
      return 'yellow';
    }
    return 'green';
  }

  onTypeChange(type: string): void {
    this.loadFiles(type);
  }
}
