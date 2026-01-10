import { Injectable } from '@angular/core';
import { LotoPointTableControlService } from '../rf-loto-point-table/rf-loto-point-table-control.service';

/**
 * Control service for the LOTO Point DB Table.
 * Extends the base LotoPointTableControlService to inherit standard controls:
 * - Add New Loto Point button
 * - Export to Excel button
 * - Bulk Edit button (for selected items)
 * - Print Labels button (for selected items)
 */
@Injectable()
export class LotoPointDbTableControlService extends LotoPointTableControlService {}
