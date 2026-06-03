import { DestroyRef, inject, Injectable, Signal, signal, WritableSignal } from "@angular/core";
import { CurrentFileService } from "../../../../services/current-file.service";
import { FileDto } from "../../../../models/file/file.model";
import { NestedItem, NestedItemImpl } from "../../../../models/ui/nested-item.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FileService } from "../../../../services/file.service";
import { tap } from "rxjs";

/** Keys a FileDto can be grouped by in the toggle menu. */
export type FileMenuGroupKey = 'vendor' | 'system' | 'fileType';

/**
 * Per-type default grouping. The renderer used to hard-code "P&ID → vendor,
 * everything else → fileType"; this table extends that to physical-layout types
 * (electrical / isometric / heat-trace / one-line) that group more usefully by
 * the file's `system` (which in this domain is effectively the physical area).
 *
 * Matching is `lowercase().includes(needle)` so naming variants like "Heat
 * Trace", "heat-trace", "PID", "P&ID" all resolve to the same default.
 */
const TYPE_GROUP_DEFAULTS: Array<[string, FileMenuGroupKey]> = [
  ['pid',         'vendor'],
  ['electrical',  'system'],
  ['isometric',   'system'],
  ['heat trace',  'system'],
  ['heat-trace',  'system'],
  ['one-line',    'system'],
  ['one line',    'system'],
];

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
     * If `overrideGroupBy` is given it wins; otherwise the per-type default
     * from {@link TYPE_GROUP_DEFAULTS} is used.
     *
     * Returns an empty array when the type is empty or has no files.
     */
    buildItemsForType(type: string, overrideGroupBy?: FileMenuGroupKey): NestedItem[] {
        if (!type) return [];
        const criteria = overrideGroupBy ?? this.defaultGroupForType(type);
        return this.createListOfNestedItems(this.currentFileService.getFilesByType(type), criteria);
    }

    /** Recommended grouping for a given file type (P&ID→vendor, electrical/iso/heat-trace→system, else fileType). */
    defaultGroupForType(type: string): FileMenuGroupKey {
        const lower = (type || '').toLowerCase();
        for (const [needle, key] of TYPE_GROUP_DEFAULTS) {
            if (lower.includes(needle)) return key;
        }
        return 'fileType';
    }

    private createListOfNestedItems(data: FileDto[], groupBy: FileMenuGroupKey): NestedItem[] {
    const groupFiles = (files: FileDto[], key: FileMenuGroupKey): Record<string, FileDto[]> => {
        // Files lacking the group key (e.g. an electrical file with no system
        // tagged) land in this bucket so they're still reachable from the menu
        // instead of silently dropped.
        const missingLabel = `(No ${key})`;
        return files.reduce((acc, file) => {
        // When grouping by system, fan out across every system the file
        // belongs to (primary + relatedSystems) so the same file appears
        // under each.
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
        const groupValue = file[key];
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

    /**
     * Every system bucket name a file belongs to: primary `system.name` plus
     * every entry in `relatedSystems` (deduped, trimmed, non-empty). Returns
     * an empty array when the file has no system info at all — callers route
     * such files to the "(No system)" bucket.
     */
    private systemGroupNames(file: FileDto): string[] {
        const out: string[] = [];
        const seen = new Set<string>();
        const push = (raw: any) => {
            if (typeof raw !== 'string') return;
            const v = raw.trim();
            if (!v) return;
            const key = v.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            out.push(v);
        };
        push(file.system?.name);
        // `relatedSystems` is wire-typed as string[] but legacy payloads may
        // still arrive as a CSV string — handle both defensively.
        const related: any = (file as any).relatedSystems;
        if (Array.isArray(related)) {
            for (const r of related) push(r);
        } else if (typeof related === 'string') {
            for (const r of related.split(',')) push(r);
        }
        return out;
    }

}