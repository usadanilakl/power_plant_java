import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ContextMenuService } from '../../../shared/menu/context-menu/context-menu.service';
import { ContextMenuAction } from '../../../shared/menu/context-menu/context-menu.component';
import { InstrumentDto } from '../../../models/instrumentation/instrument.model';

/**
 * Right-click menu for the instrument register.
 *
 * Emits rather than acting: deletion has to be confirmed and reported by the table (which owns the
 * selection and the error banner), and "Details" belongs to the page that hosts the dialog. Keeping
 * the menu free of that logic means the same actions work whether they were reached by right-click,
 * double-click, or the bulk toolbar.
 */
@Injectable()
export class InstrumentContextMenuService extends ContextMenuService {

  readonly detailsRequested = new Subject<InstrumentDto>();
  readonly viewLogsRequested = new Subject<InstrumentDto>();
  readonly deleteRequested = new Subject<InstrumentDto>();

  override contextMenuActions: ContextMenuAction[] = [
    {
      id: 'details',
      label: 'Details',
      icon: '🔍',
      action: (item) => this.detailsRequested.next(item as InstrumentDto),
    },
    {
      id: 'logs',
      label: 'View logs',
      icon: '📋',
      action: (item) => this.viewLogsRequested.next(item as InstrumentDto),
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
      icon: '🗑️',
      action: (item) => this.deleteRequested.next(item as InstrumentDto),
    },
  ];
}
