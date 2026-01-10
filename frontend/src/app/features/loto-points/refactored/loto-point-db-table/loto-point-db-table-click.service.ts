import { Injectable } from '@angular/core';
import { RfLotoPointClickService } from '../rf-loto-point-table/rf-loto-point-click.service';

/**
 * Click service for the LOTO Point DB Table.
 * Extends the base RfLotoPointClickService to inherit standard behavior:
 * - Double-click opens the edit form
 * - Right-click shows context menu
 * - Cell double-click opens form with field focus
 */
@Injectable()
export class LotoPointDbTableClickService extends RfLotoPointClickService {}
