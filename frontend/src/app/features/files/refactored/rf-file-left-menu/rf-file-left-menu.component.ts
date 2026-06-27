
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NestedItem, NestedItemImpl } from '../../../../models/ui/nested-item.model';
import { FileDto } from '../../../../models/file/file.model';
import { FileService } from '../../../../services/file.service';
import { RouteService } from '../../../../services/util/rout.service';
import { CurrentFileService } from '../../../../services/current-file.service';
import { RfToggleMenuComponent } from "../../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component";
import { FileContextMenuService } from '../services/file-context-menu.service';
import { RfFileStateService } from '../services/rf-file-state.service';
import { RfFileApiService, RevisionInfo, deriveRevisionKey, buildRevisionFileDto } from '../services/rf-file-api.service';
import { RfMultiUploadComponent } from '../rf-multi-upload/rf-multi-upload.component';
import { QaDirective } from '../../../../shared/qa/qa.directive';
import { FileMenuService, FileMenuGroupKey } from './rf-file-menu.service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-rf-file-left-menu',
  standalone: true,
  imports: [CommonModule, RfToggleMenuComponent, RfMultiUploadComponent, QaDirective],
  templateUrl: './rf-file-left-menu.component.html',
  styleUrl: './rf-file-left-menu.component.css',
})
export class RfFileLeftMenuComponent implements OnInit{
  protected contextMenuService = inject(FileContextMenuService);
  protected stateService = inject(RfFileStateService);

  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  currentFile = signal<FileDto | null>(null);
  isFileFormOpen = signal(false);
  isProcessingFile = signal(false);
  fileSubmitMessage = signal<string>("");
  showMultiUpload = signal<boolean>(false);

  currentRoute = signal("");

  /** Available file types, loaded dynamically from CurrentFileService. */
  fileTypes = signal<string[]>([]);
  /** Currently selected file types (multi-select). Defaults to PID on first load. */
  selectedTypes = signal<Set<string>>(new Set<string>());
  /** Convenience: a single representative type, used for per-type defaults (group key, etc.). */
  selectedType = computed<string>(() => {
    const s = this.selectedTypes();
    return s.size > 0 ? Array.from(s)[0] : '';
  });
  /** Dropdown open state for the multi-select file-type picker. */
  fileTypeDropdownOpen = signal(false);

  /** Label inside the file-type dropdown button: "All", a single type name, or "N selected". */
  selectedTypesLabel = computed<string>(() => {
    const s = this.selectedTypes();
    if (s.size === 0) return 'Select…';
    if (s.size === 1) return Array.from(s)[0];
    if (s.size === this.fileTypes().length) return 'All types';
    return `${s.size} types`;
  });

  /** Manual override of the grouping criteria; `null` means "use this type's default". */
  private explicitGroupBy = signal<FileMenuGroupKey | null>(null);
  /** Options surfaced in the Group-by dropdown. */
  availableGroupKeys: FileMenuGroupKey[] = ['vendor', 'system', 'fileType', 'tag'];
  /**
   * Effective group key: explicit override if the user picked one; otherwise
   *   - only PID selected → vendor (PID's traditional grouping)
   *   - any other selection (multi-select, or single non-PID) → system
   */
  effectiveGroupBy = computed<FileMenuGroupKey>(() => {
    const override = this.explicitGroupBy();
    if (override) return override;
    const s = this.selectedTypes();
    const isPidOnly = s.size === 1 && Array.from(s)[0].toLowerCase() === 'pid';
    return isPidOnly ? 'vendor' : 'system';
  });

  /** Disk-based revisions map (key -> physical revisions); drives expandable revision nodes. */
  revisionsMap = signal<Record<string, RevisionInfo[]>>({});

  /** Transient FileDtos for non-current revision tree nodes, keyed by synthetic node id. */
  private revisionFileLookup = new Map<string, FileDto>();


constructor(
  private fileService: FileService,
  private routService: RouteService,
  private destroyRef: DestroyRef,
  private currentFileService: CurrentFileService,
  private fileApi: RfFileApiService,
  private fileMenuService: FileMenuService,
) { }

  ngOnInit(): void {

    // Load the disk-based revisions map, then rebuild the menu so files with
    // physical revisions become expandable. Refreshed again on file updates.
    this.loadRevisionsMap();

    // Keep our tab list in sync with the dynamic file types. When the list
    // first resolves (or changes), auto-select the first type if none chosen.
    this.currentFileService.fileTypes$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(types => {
      this.fileTypes.set(types);
      if (this.selectedTypes().size === 0 && types.length > 0) {
        // Default to PID when present (most-used type), else the first available.
        const pid = types.find(t => t.toLowerCase() === 'pid');
        this.selectedTypes.set(new Set([pid ?? types[0]]));
      }
    });

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
        this.loadRevisionsMap();
        this.loadFiles();
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


  /**
   * Build the menu items from the currently-selected file types. Files from all
   * selected types are merged into one collection and then grouped uniformly by
   * the effective Group-by (vendor / system / fileType). So selecting PID + Electrical
   * with Group-by = system shows a single tree where "Feed Water" contains files of
   * both types together. Empty selection → empty.
   */
  loadFiles(): void {
    const types = Array.from(this.selectedTypes());
    if (types.length === 0) {
      this.menuItems.set([]);
      return;
    }
    const combined: FileDto[] = [];
    for (const type of types) {
      combined.push(...this.currentFileService.getFilesByType(type));
    }
    const items = this.createListOfNestedItems(combined, this.effectiveGroupBy());
    this.menuItems.set(items);
  }

  /** Toggle a file type in the multi-select. Empty selection clears the menu. */
  toggleFileType(type: string): void {
    const next = new Set(this.selectedTypes());
    if (next.has(type)) next.delete(type);
    else next.add(type);
    this.selectedTypes.set(next);
    // Drop manual Group-by override when the type set changes (different types
    // have different sensible defaults).
    this.explicitGroupBy.set(null);
    this.loadFiles();
  }

  /** Tick all available file types. */
  selectAllFileTypes(): void {
    this.selectedTypes.set(new Set(this.fileTypes()));
    this.explicitGroupBy.set(null);
    this.loadFiles();
  }

  /** Clear the file-type selection (menu becomes empty until the user picks types). */
  clearFileTypes(): void {
    this.selectedTypes.set(new Set());
    this.explicitGroupBy.set(null);
    this.loadFiles();
  }

  isFileTypeSelected(type: string): boolean {
    return this.selectedTypes().has(type);
  }

  toggleFileTypeDropdown(): void {
    this.fileTypeDropdownOpen.set(!this.fileTypeDropdownOpen());
  }

  closeFileTypeDropdown(): void {
    this.fileTypeDropdownOpen.set(false);
  }

  /** User override for grouping criteria (vendor / system / fileType / tag). Resets when the file type changes. */
  onGroupByChange(key: string): void {
    if (key === 'vendor' || key === 'system' || key === 'fileType' || key === 'tag') {
      this.explicitGroupBy.set(key);
      this.loadFiles();
    }
  }

  refresh(): void {
    this.loadFiles();
  }

  private loadRevisionsMap(): void {
    this.fileApi.getRevisionsMap().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        this.revisionsMap.set(res.responseData ?? {});
        // Rebuild with revision info now available.
        this.loadFiles();
      },
      error: () => { /* revisions are best-effort */ }
    });
  }

  onAddNewFile(): void {
    // Create a new empty FileDto and open the form
    this.stateService.setSelectedItem(new FileDto());
    this.stateService.openForm();
  }

  onMultiUpload(): void {
    this.showMultiUpload.set(true);
  }

  onMultiUploadClose(): void {
    this.showMultiUpload.set(false);
  }

  onMultiUploadComplete(files: FileDto[]): void {
    // Refresh the file list after successful upload
    this.currentFileService.refreshFiles();
    this.showMultiUpload.set(false);
  }

  private createListOfNestedItems(data: FileDto[], groupBy: FileMenuGroupKey): NestedItem[] {
    // Rebuild the transient-revision lookup from scratch on each (re)build.
    this.revisionFileLookup.clear();
    const groupFiles = (files: FileDto[], key: FileMenuGroupKey): Record<string, FileDto[]> => {
      // Files lacking the group key (e.g. an electrical file with no system
      // tagged) land here so they're still reachable instead of silently dropped.
      const missingLabel = `(No ${key})`;
      return files.reduce((acc, file) => {
        // When grouping by system, fan out: a file gets a row under every
        // system it belongs to (primary `system` + every name in
        // `relatedSystems`), so users see it from each system's perspective.
        if (key === 'system') {
          const groupNames = this.systemGroupNames(file);
          if (groupNames.length === 0) {
            if (!acc[missingLabel]) acc[missingLabel] = [];
            acc[missingLabel].push(file);
          } else {
            for (const groupName of groupNames) {
              if (!acc[groupName]) acc[groupName] = [];
              acc[groupName].push(file);
            }
          }
          return acc;
        }
        // Tags fan out the same way — a file appears under every Tag it carries.
        if (key === 'tag') {
          const tagNames = (file.tags ?? [])
            .map(v => v?.name?.trim())
            .filter((n): n is string => !!n);
          if (tagNames.length === 0) {
            if (!acc[missingLabel]) acc[missingLabel] = [];
            acc[missingLabel].push(file);
          } else {
            for (const groupName of tagNames) {
              if (!acc[groupName]) acc[groupName] = [];
              acc[groupName].push(file);
            }
          }
          return acc;
        }
        const groupValue = (file as any)[key];
        let groupName: string;
        if (groupValue && typeof groupValue === 'object' && 'name' in groupValue && groupValue.name) {
          groupName = groupValue.name;
        } else {
          groupName = missingLabel;
        }
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(file);
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

      parentItem.values = files.map(file => this.fileNode(file));

      return parentItem;
    });
  }

  /**
   * Build the tree node for a file. Revisions are physical sibling files on disk
   * (the Revise action writes "-revN" copies but keeps one DB row), so a file with
   * revisions becomes an EXPANDABLE node whose children are the physical revisions.
   * Files without revisions stay plain, directly-clickable leaves.
   */
  private fileNode(file: FileDto): NestedItem {
    const revisions = this.revisionsMap()[deriveRevisionKey(file.fileLink)] ?? [];
    if (revisions.length <= 1) {
      return this.fileLeaf(file);
    }

    const docNode = new NestedItemImpl({
      id: 'revgroup_' + file.id,
      name: file.name && file.name.trim() !== '' ? file.name : 'Unnamed File',
      subtitle: `${file.fileNumber && file.fileNumber.length > 0 ? file.fileNumber.join(', ') : ''} · ${revisions.length} revisions`,
      isExpanded: false,
      objectType: 'revisionGroup',
      color: this.setFileItemColor(file),
    });

    const currentRev = this.fileRevNum(file);
    docNode.values = revisions.map(rev => {
      const label = rev.revisionNumber === 0 ? 'Original' : `rev ${rev.revisionNumber}`;
      if (rev.revisionNumber === currentRev) {
        // The DB row points at this revision — open it normally (full equipment markup).
        return new NestedItemImpl({
          id: file.id.toString(),
          name: `${label} (current) — ${file.name && file.name.trim() !== '' ? file.name : 'Unnamed File'}`,
          subtitle: rev.fileName,
          isExpanded: false,
          objectType: file.objectType,
          color: this.setFileItemColor(file),
        });
      }
      // Older physical revision with no DB row — open as a transient file in the
      // same in-app viewer (pdf/jpg toggle works via the editor's format switch).
      const nodeId = `revfile::${file.id}::${rev.revisionNumber}`;
      this.revisionFileLookup.set(nodeId, buildRevisionFileDto(file, rev, 'jpg'));
      return new NestedItemImpl({
        id: nodeId,
        name: `${label} — ${rev.fileName}`,
        subtitle: rev.fileName,
        isExpanded: false,
        objectType: 'revisionFile',
        color: this.setFileItemColor(file),
      });
    });
    return docNode;
  }

  private fileLeaf(file: FileDto): NestedItem {
    return new NestedItemImpl({
      id: file.id.toString(),
      name: file.name && file.name.trim() !== '' ? file.name : 'Unnamed File',
      subtitle: file.fileNumber && file.fileNumber.length > 0 ? file.fileNumber.join(', ') : undefined,
      isExpanded: false,
      objectType: file.objectType,
      color: this.setFileItemColor(file),
    });
  }

  /** Revision number the DB row currently points at, from its fileNumber's -revN suffix. */
  private fileRevNum(file: FileDto): number {
    const joined = (file.fileNumber ?? []).join('__SEP__');
    const m = joined.match(/-rev(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  }

  onItemClick(item: NestedItem): void {
    // Older physical revision (no DB row) — open its transient FileDto in the viewer.
    if (item.objectType === 'revisionFile') {
      const transient = this.revisionFileLookup.get(item.id?.toString() ?? '');
      if (transient) this.currentFileService.setCurrentFile(transient);
      return;
    }
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
        // console.log('Unhandled route for item click:', this.currentRoute());
        this.handleFileEditClick(item);
    }
  }

  onItemDoubleClick(item: NestedItem): void {
    this.onItemClick(item)
    this.isFileFormOpen.set(true);
  }

  onItemRightClick(event: { event: MouseEvent; item: NestedItem }): void {
    // Only show context menu for leaf nodes (actual files, not groups)
    if (event.item.values && event.item.values.length > 0) {
      return;
    }

    // Show context menu with the item data
    this.contextMenuService.showContextMenu(event.item, event.event);
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
        // Convert PDF links to JPG by default for shape editing
        // User can toggle back to PDF using the format switcher
        if (file.fileLink.endsWith('.pdf')) {
          file.fileLink = file.fileLink.replace(/\.pdf$/, '.jpg');
          file.extension = 'jpg';
        }
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

  /**
   * System bucket names a file belongs to — sourced ONLY from the new
   * @ManyToMany {@link FileDto.systems} collection. Returns [] when the
   * collection is empty, which routes the file to the "(No system)" bucket.
   *
   * <p>Intentionally does NOT fall back to the legacy primary {@link FileDto.system}
   * FK or the {@code relatedSystems} CSV. Reasons:
   * <ul>
   *   <li>The legacy primary FK and the CSV are preserved server-side but no
   *       longer drive grouping — duplicating them here showed the same file
   *       under multiple buckets and made the unmigrated/migrated distinction
   *       visually noisy.</li>
   *   <li>Tag grouping (separate `tag` group-by mode) already covers the
   *       legacy free-form CSV's role after migration.</li>
   *   <li>Files whose {@code systems} collection is genuinely empty SHOULD
   *       appear under "(No system)" so the user can spot them and assign
   *       proper Values via the form.</li>
   * </ul>
   */
  private systemGroupNames(file: FileDto): string[] {
    if (!Array.isArray(file.systems) || file.systems.length === 0) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const v of file.systems) {
      const name = typeof v?.name === 'string' ? v.name.trim() : '';
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(name);
    }
    return out;
  }

  private setFileItemColor(item: FileDto): string{
    // Status semantics: missing name = red, not yet verified = amber, verified = green.
    // Returned as hex (not raw 'red'/'yellow') so the toggle list's tint + status-bar
    // styling renders pleasant, readable colors.
    if(!item.name || item.name === ''){
      return '#e74c3c';
    }
    if(!item.isVerified){
      return '#e6a700';
    }
    return '#27ae60';
  }

}
