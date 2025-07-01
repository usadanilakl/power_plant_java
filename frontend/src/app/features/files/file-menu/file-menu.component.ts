import { Component, DestroyRef, OnDestroy, OnInit, signal } from '@angular/core';
import { NestedItem, NestedItemImpl } from '../../../models/ui/nested-item.model';
import { FileService } from '../../../services/file.service';
import { ToggleMenuComponent } from "../../../shared/menu/toggle-menu/toggle-menu.component";
import { FileDto } from '../../../models/file/file.model';
import { RouteService } from '../../../services/util/rout.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrentFileService } from '../../../services/current-file.service';

@Component({
  selector: 'app-file-menu',
  imports: [ToggleMenuComponent],
  templateUrl: './file-menu.component.html',
  styleUrl: './file-menu.component.css',
  standalone: true
})
export class FileMenuComponent implements OnInit{

  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

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
      // console.log('Current route:', routeInfo);
    });
  }

  loadFiles(): void {
    this.isLoading.set(true);
    this.fileService.getByFileType("PID").subscribe(
      (response) => {
        this.isLoading.set(false);
        // Choose 'vendor', 'system', or 'fileType' as the grouping criteria
        const nestedItems = this.createListOfNestedItems(response.responseData, 'vendor');
        // console.log('Files loaded successfully:', nestedItems);
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
        name: file.name,
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
  
  private handleFileTableClick(item: NestedItem): void {
    // console.log('Handling click for table route', item);
    // Implement table-specific click logic here
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