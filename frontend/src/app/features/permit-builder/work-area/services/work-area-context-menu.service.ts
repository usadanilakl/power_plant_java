import { inject, Injectable } from '@angular/core';
import { ContextMenuAction } from '../../../../shared/menu/context-menu/context-menu.component';
import { ContextMenuService } from '../../../../shared/menu/context-menu/context-menu.service';
import { ConfirmationService } from '../../../../services/ui/confirmation.service';
import { WorkAreaDto } from '../../../../models/permits/work-area.model';
import { WorkAreaMapStateService } from '../work-area-map/work-area-map-state.service';

@Injectable()
export class WorkAreaContextMenuService extends ContextMenuService {
  private stateService = inject(WorkAreaMapStateService);
  private confirmationService = inject(ConfirmationService);

  constructor() {
    super();
    this.contextMenuActions = this.buildContextMenuActions();
  }

  private buildContextMenuActions(): ContextMenuAction[] {
    return [
      {
        id: 'view',
        label: 'View Details',
        action: (item) => this.handleViewDetails(item),
      },
      {
        id: 'edit',
        label: 'Edit',
        action: (item) => this.handleEdit(item),
      },
      {
        id: 'counterpart',
        label: 'Create Counterpart',
        action: (item) => this.handleCreateCounterpart(item),
      },
      {
        id: 'divider1',
        label: '',
        divider: true,
        action: () => {},
      },
      {
        id: 'delete',
        label: 'Delete',
        action: (item) => this.handleDelete(item),
      },
    ];
  }

  override handleViewDetails(item: WorkAreaDto): void {
    if (!item?.id) return;
    this.stateService.selectedWorkArea.set(item);
    if (item.shapeId) {
      this.stateService.selectedShapeId.set(item.shapeId);
    }
    this.closeContextMenu();
  }

  override handleEdit(item: WorkAreaDto): void {
    if (!item) return;
    this.stateService.openWorkAreaForm(item);
    this.closeContextMenu();
  }

  handleCreateCounterpart(item: WorkAreaDto): void {
    if (!item) return;
    this.stateService.openCounterpartForm(item);
    this.closeContextMenu();
  }

  override handleDelete(item: WorkAreaDto): void {
    if (!item?.id) return;

    this.confirmationService.confirm(`Delete work area "${item.name}"?`).then((confirmed) => {
      if (!confirmed) return;
      this.stateService.deleteWorkArea(item.id!);
      this.closeContextMenu();
    });
  }
}
