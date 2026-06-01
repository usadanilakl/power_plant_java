import { DestroyRef, inject, Injectable, Signal, signal, WritableSignal } from "@angular/core";
import { CurrentFileService } from "../../../../services/current-file.service";
import { FileDto } from "../../../../models/file/file.model";
import { NestedItem, NestedItemImpl } from "../../../../models/ui/nested-item.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FileService } from "../../../../services/file.service";
import { tap } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class FileMenuService{
    currentFileService = inject(CurrentFileService);
    fileService = inject(FileService);
    destroyRef = inject(DestroyRef);

    menuItems = signal<NestedItem[]>([]);
    isLoading = signal(false);
    error = signal<string | null>(null);
    currentFile = signal<FileDto | null>(null);
    /** Starts empty; resolved to the first P&ID-like type on first load. */
    selectedType = signal<string>("");

    constructor(){
    this.currentFileService.filesLoaded$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (loaded) => {
        if(loaded){
          this.loadFiles();
          this.isLoading.set(false);
        }
        else{
          this.isLoading.set(true);
        } 
      },
      error: (error) => {
        console.error('Error loading files:', error);
        this.error.set(error.message);
      }
    })

    this.currentFileService.filesUpdated$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.loadFiles(this.selectedType());
      },
      error: (error) => {
        console.error('Error fetching current file:', error);
      }
    });

    }
    
    
    loadFiles(type?: string): void {
        // Resolve the type to use: explicit arg → current selection → first
        // P&ID-like type from the dynamic list → first available type.
        const types = this.currentFileService.fileTypes;
        const effective = type
            ?? (this.selectedType() || null)
            ?? types.find(t => t.toLowerCase().includes('pid'))
            ?? types[0]
            ?? '';
        if (!effective) {
            this.menuItems.set([]);
            return;
        }
        this.selectedType.set(effective);
        this.menuItems.set(this.buildItemsForType(effective));
    }

    /**
     * Build the nested menu items for a given file type **without** mutating
     * this singleton's selected-type / menu-items state. Consumers that need
     * an isolated, per-component file menu (e.g. the equipment-unified-dialog
     * type picker) should call this directly instead of `loadFiles`, which
     * would clobber the global selection used by the main file feature.
     *
     * Returns an empty array when the type is empty or has no files.
     */
    buildItemsForType(type: string): NestedItem[] {
        if (!type) return [];
        // P&ID files group by vendor; other types group by fileType.
        const criteria: 'vendor' | 'fileType' = type.toLowerCase().includes('pid') ? 'vendor' : 'fileType';
        return this.createListOfNestedItems(this.currentFileService.getFilesByType(type), criteria);
    }

    private createListOfNestedItems(data: FileDto[], groupBy: 'vendor' | 'system' | 'fileType'): NestedItem[] {
    const groupFiles = (files: FileDto[], key: 'vendor' | 'system' | 'fileType'): Record<string, FileDto[]> => {
    
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
        objectType: groupBy
        });
    
        parentItem.values = files.map(file => new NestedItemImpl({
        id: file.id.toString(),
        name: file.name && file.name.trim() !== '' ? file.name : file.fileNumber.join(',') || 'Unnamed File',
        isExpanded: false,
        objectType: file.objectType,
        color: this.setFileItemColor(file)
        }));
    
        return parentItem;
    });
    }

  private setFileItemColor(item: FileDto): string{
    if(!item.name || item.name === ''){
      return 'red';
    }
    if(!item.isVerified){
      return 'yellow';
    }
    return 'green';
  }  
  
  getFileFromNestedItem(item: NestedItem, fileSignal: WritableSignal<FileDto | null>): void {
      if (item.values && item.values.length > 0) return;
    
      const startTime = performance.now();
    
      this.fileService.getFileById(item.id.toString()).pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          const endTime = performance.now();
          console.log(`File fetch time: ${endTime - startTime}ms`);
        })
      ).subscribe({
        next: (response) => {
          const file = FileDto.fromJson(response.responseData);
          file.fileLink = file.fileLink.replaceAll('pdf','jpg');
          fileSignal.set(file);
    
          const totalTime = performance.now() - startTime;
          console.log(`Total operation time: ${totalTime}ms`);
        },
        error: (error) => {
          console.error('Error getting file for edit:', error);
        }
      });
    }

}