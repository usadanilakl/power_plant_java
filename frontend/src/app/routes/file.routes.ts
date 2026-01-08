import { Routes } from '@angular/router';
import { RfFilePageComponent } from '../features/files/refactored/rf-file-page/rf-file-page.component';
import { RfFileEditroComponent } from '../features/files/refactored/rf-file-editor.component';
import { FileTableComponent } from '../features/files/file-table/file-table.component';

export const FILE_ROUTES: Routes = [
  {
    path: 'file',
    component: RfFilePageComponent,
    children: [
      { path: '', redirectTo: 'edit', pathMatch: 'full' },
      { path: 'edit', component: RfFileEditroComponent },
      { path: 'table', component: FileTableComponent }
    ]
  }
];
