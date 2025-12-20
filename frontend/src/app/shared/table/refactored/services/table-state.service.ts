import { Injectable, signal } from "@angular/core";

export type TableMode = 'row' | 'cell';

@Injectable()
export class TableStateService{
    tableMode = signal<'row' | 'cell'>('row');

  setTableMode(mode: TableMode): void {
    this.tableMode.set(mode);
  }
}