
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NestedItem, NestedItemImpl } from '../../../../models/ui/nested-item.model';
import { FileDto } from '../../../../models/file/file.model';
import { FileService } from '../../../../services/file.service';
import { RouteService } from '../../../../services/util/rout.service';
import { CurrentFileService } from '../../../../services/current-file.service';
import { RfToggleMenuComponent } from "../../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component";
import { tap } from 'rxjs';

@Component({
  selector: 'app-rf-file-left-menu',
  standalone: true,
  imports: [CommonModule, RfToggleMenuComponent],
  templateUrl: './rf-file-left-menu.component.html',
  styleUrl: './rf-file-left-menu.component.css',
})
export class RfFileLeftMenuComponent implements OnInit{

  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  currentFile = signal<FileDto | null>(null);
  isFileFormOpen = signal(false);
  isProcessingFile = signal(false);
  fileSubmitMessage = signal<string>("");

  currentRoute = signal("");

  selectedType = signal<string>("pid");


constructor(
  private fileService: FileService, 
  private routService: RouteService,
  private destroyRef: DestroyRef,
  private currentFileService: CurrentFileService,
) { }

  ngOnInit(): void {
    
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

    this.currentRoute.set(this.routService.getCurrentRouteInfo().path);
    this.routService.onRouteChange().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      const routeInfo = this.routService.getCurrentRouteInfo();
      this.currentRoute.set(routeInfo.path || '');
    });
    this.currentFileService.currentFile$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(file => {
      this.currentFile.set(file);
    });
  }


  loadFiles(type: string = 'pid'): void {
        const criteria = type==='pid' ? 'vendor' : 'fileType';
        const nestedItems = this.createListOfNestedItems(this.currentFileService.getFilesByType(type), criteria);
        this.menuItems.set(nestedItems);
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

  onItemClick(item: NestedItem): void {
    switch (this.currentRoute()) {
      case 'table':
        this.handleFileTableClick(item);
        break;
      case 'edit':
        this.handleFileEditClick(item);
        break;
      case 'files/tree':
        this.handleFileTreeClick(item);
        break;
      default:
        console.log('Unhandled route for item click:', this.currentRoute());
    }
  }

  onItemDoubleClick(item: NestedItem): void {
    this.onItemClick(item)
    this.isFileFormOpen.set(true);
  }

  onFormSubmit(formData: any) {

    this.isFileFormOpen.set(false);
    // if(!this.currentFile()) return;
    // const formDataToSend = new FormData();
    // this.isProcessingFile.set(true);
  
    // // Extract file from formData and remove it from the object
    // let file: File | null = null;
    // if (formData.file instanceof File) {
    //   file = formData.file;
    //   delete formData.file; // Remove file from formData
    // }
  
    // // Append the file if it exists
    // if (file) {
    //   formDataToSend.append('file', file);
    // }

    //   // Extract the override/revision checkbox value
    //   const overrideFile = formData.overrideFile;
    //   delete formData.overrideFile; // Remove it from formData as it's not part of the FileDto
  
    // // Continue with the rest of your logic...
    // // Merge the existing item data with the new form data
    // const updatedItem = { ...this.currentFile(), ...formData };
  
    // // Append the JSON data
    // formDataToSend.append('fileDto', new Blob([JSON.stringify(new FileDto(updatedItem).toIdModel())], {
    //   type: "application/json"
    // }));

    //   // Append the override/revision flag
    //   formDataToSend.append('overrideFile', overrideFile);
    
  
    // // Update in the backend
    // this.fileService.updateFile(formDataToSend).pipe(
    //   takeUntilDestroyed(this.destroyRef)
    // ).subscribe(
    //   (response) => {

    //     this.fileSubmitMessage.set('File updated successfully');
    //     this.currentFile.set(response.responseData);
  
    //     this.isProcessingFile.set(false);
    //     this.isFileFormOpen.set(false);
    //   },
    //   error => {
    //     console.error('Error updating file:', error);
    //     this.fileSubmitMessage.set('Error updating file ' + error.message);
    //   }
    // );
  }

  onFormDelete() {
    if (!this.currentFile()) return;
  
    const fileId = this.currentFile()!.id + '';
    this.isProcessingFile.set(true);
  
    this.fileService.deleteFile(fileId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        // console.log('File deleted successfully');
        this.fileSubmitMessage.set('File deleted successfully');
        
        // Remove the deleted file from the menu items
        this.removeDeletedFileFromMenu(fileId);
        
        // Clear the current file
        this.currentFileService.setCurrentFile(null);
        this.currentFile.set(null);
        
        // Close the file form
        this.isFileFormOpen.set(false);
        
        // Optionally, reload the file list
        // this.loadFiles();
      },
      error: (error) => {
        console.error('Error deleting file:', error);
        this.fileSubmitMessage.set('Error deleting file: ' + error.message);
      },
      complete: () => {
        this.isProcessingFile.set(false);
      }
    });
  }
  
  private removeDeletedFileFromMenu(fileId: string) {
    this.menuItems.update(items => {
      return items.map(item => {
        if (item.values) {
          item.values = item.values.filter(subItem => subItem.id !== fileId);
        }
        return item;
      }).filter(item => item.values && item.values.length > 0);
    });
  }

  onFileFormClose(){
    this.isFileFormOpen.set(false);
  }
  fileUploadMessageWindow(){
    this.isProcessingFile.set(false)
  }
  
  private handleFileTableClick(item: NestedItem): void {
    this.handleFileEditClick(item);
  }
  
  private handleFileEditClick(item: NestedItem): void {
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
        this.currentFileService.setCurrentFile(file);
        this.currentFile.set(file);
  
        const totalTime = performance.now() - startTime;
        console.log(`Total operation time: ${totalTime}ms`);
      },
      error: (error) => {
        console.error('Error getting file for edit:', error);
      }
    });
  }
  
  private handleFileTreeClick(item: NestedItem): void {
    console.log('Handling click for files/tree route', item);
    // Implement tree-specific click logic here
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

}
