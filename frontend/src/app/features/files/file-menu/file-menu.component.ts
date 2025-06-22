import { Component, OnInit, signal } from '@angular/core';
import { NestedItem, NestedItemImpl } from '../../../models/ui/nested-item.model';
import { FileService } from '../../../services/file.service';
import { ToggleMenuComponent } from "../../../shared/menu/toggle-menu/toggle-menu.component";
import { FileDto } from '../../../models/file/file.model';
import { ValueDto } from '../../../models/value.model';

@Component({
  selector: 'app-file-menu',
  imports: [ToggleMenuComponent],
  templateUrl: './file-menu.component.html',
  styleUrl: './file-menu.component.css'
})
export class FileMenuComponent implements OnInit {

  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(private fileService: FileService) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.isLoading.set(true);
    this.fileService.getByFileType("PID").subscribe(
      (response) => {
        this.isLoading.set(false);
        // Choose 'vendor', 'system', or 'fileType' as the grouping criteria
        const nestedItems = this.createListOfNestedItems(response.responseData, 'vendor');
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
      return files.reduce((acc, file) => {
        const groupValue = file[key];
        if (groupValue instanceof ValueDto) {
          const groupName = groupValue.name;
          if (!acc[groupName]) {
            acc[groupName] = [];
          }
          acc[groupName].push(file);
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
        objectType: 'file'
      }));
  
      return parentItem;
    });
  }


}