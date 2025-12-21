import { Injectable } from "@angular/core";
import { ContextMenuService } from "../../../../shared/menu/context-menu/context-menu.service";
import { ContextMenuAction } from "../../../../shared/menu/context-menu/context-menu.component";
import { LotoPointDto } from "../../../../models/loto/loto-point.model";

@Injectable({
    providedIn: "root"
})
export class LotoPointContextMenuService extends ContextMenuService {

  customMenuActions: ContextMenuAction[] = [
      {
        id:'inspect',
        label: 'Inspect',
        icon: '🔍',
        action: (item) => this.handleInspect(item),
      },
      {
        id: 'divider2',
        label: '',
        divider: true,
        action: () => {},
      },
      {
        id: 'print',
        label: 'Print',
        icon: '🖨️',
        action: (item) => this.handlePrint(item),
      },
      {
        id: 'divider3',
        label: '',
        divider: true,
        action: () => {},
      },
      {
        id: 'release',
        label: 'Release',
        icon: '🔓',
        action: (item) => this.handleRelease(item),
      },
  ]

  override contextMenuActions: ContextMenuAction[] = [
    ...this.contextDefaultMenuActions,
    ...this.customMenuActions,
  ]

    private handleInspect(item: LotoPointDto): void {
      console.log('Inspecting:', item);
      // Implement inspect logic
    }
  
    private handlePrint(item: LotoPointDto): void {
      console.log('Printing:', item);
      // Implement print logic
    }
  
    private handleRelease(item: LotoPointDto): void {
      console.log('Releasing:', item);
      // Implement release logic
    }
}