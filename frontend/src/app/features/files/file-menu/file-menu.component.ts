import { Component, DestroyRef, OnDestroy, OnInit, signal } from '@angular/core';
import { NestedItem, NestedItemImpl } from '../../../models/ui/nested-item.model';
import { FileService } from '../../../services/file.service';
import { ToggleMenuComponent } from "../../../shared/menu/toggle-menu/toggle-menu.component";
import { FileDto } from '../../../models/file/file.model';
import { RouteService } from '../../../services/util/rout.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrentFileService } from '../../../services/current-file.service';
import { PopupProjectionComponent } from "../../../shared/popup-projection/popup-projection.component";
import { FileDetailFormComponent } from "../file-detail-form/file-detail-form.component";

@Component({
  selector: 'app-file-menu',
  imports: [ToggleMenuComponent, PopupProjectionComponent, FileDetailFormComponent],
  templateUrl: './file-menu.component.html',
  styleUrl: './file-menu.component.css',
  standalone: true
})
export class FileMenuComponent implements OnInit{

  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  currentFile = signal<FileDto | null>(null);
  isFileFormOpen = signal(false);
  isProcessingFile = signal(false);
  fileSubmitMessage = signal<string>("");


constructor(
  private fileService: FileService, 
  private routService: RouteService,
  private destroyRef: DestroyRef,
  private currentFileService: CurrentFileService,
) {}

  currentRoute = signal("");

  ngOnInit(): void {
    this.loadFiles();
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
    this.isLoading.set(true);
    this.fileService.getByFileType(type).subscribe(
      (response) => {
        this.isLoading.set(false);
        // Choose 'vendor', 'system', or 'fileType' as the grouping criteria
        const criteria = type==='pid' ? 'vendor' : 'fileType';
        const nestedItems = this.createListOfNestedItems(response.responseData, criteria);
        this.menuItems.set(nestedItems);
      },
      (error) => {
        this.isLoading.set(false);
        this.error.set(error.message);
      }
    );
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

    if(!this.currentFile()) return;
    const formDataToSend = new FormData();
    this.isProcessingFile.set(true);
  
    // Extract file from formData and remove it from the object
    let file: File | null = null;
    if (formData.file instanceof File) {
      file = formData.file;
      delete formData.file; // Remove file from formData
    }
  
    // Append the file if it exists
    if (file) {
      formDataToSend.append('file', file);
    }

      // Extract the override/revision checkbox value
      const overrideFile = formData.overrideFile;
      delete formData.overrideFile; // Remove it from formData as it's not part of the FileDto
  
    // Continue with the rest of your logic...
    // Merge the existing item data with the new form data
    const updatedItem = { ...this.currentFile(), ...formData };
  
    // Append the JSON data
    formDataToSend.append('fileDto', new Blob([JSON.stringify(new FileDto(updatedItem).toIdModel())], {
      type: "application/json"
    }));

      // Append the override/revision flag
      formDataToSend.append('overrideFile', overrideFile);
    
  
    // Update in the backend
    this.fileService.updateFile(formDataToSend).subscribe(
      (response) => {

        this.fileSubmitMessage.set('File updated successfully');
        this.currentFile.set(response.responseData);
  
        this.isProcessingFile.set(false);
        this.isFileFormOpen.set(false);
      },
      error => {
        console.error('Error updating file:', error);
        this.fileSubmitMessage.set('Error updating file ' + error.message);
      }
    );
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
    // console.log('Handling click for edit route', item);

    this.fileService.getFileById(item.id.toString()).subscribe(
      (response) => {
        const file = FileDto.fromJson(response.responseData);
        file.fileLink = file.fileLink.replaceAll('pdf','jpg');
        this.currentFileService.setCurrentFile(file);
        this.currentFile.set(file);
      },
      (error) => {
        console.error('Error getting file for edit:', error);
      }
    );
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