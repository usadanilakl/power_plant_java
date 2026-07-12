import { Routes } from '@angular/router';
import { RoundsWorkbenchComponent } from '../features/rounds/rounds-workbench/rounds-workbench.component';
import { RoundsIssuesComponent } from '../features/rounds/rounds-issues/rounds-issues.component';
import { RoundsEditorComponent } from '../features/rounds/rounds-editor/rounds-editor.component';

/**
 * Rounds authoring section (hub-served desktop). The workbench imports WebView-AMS round columns into staging and
 * turns each into an editable, PhysicalObject-bound RoundQuestion inside a Round. Performing/scheduling rounds
 * lives in the PWA (ng-ui); this section is the admin/authoring side.
 */
export const ROUNDS_ROUTES: Routes = [
  { path: 'rounds', redirectTo: 'rounds/workbench', pathMatch: 'full' },
  { path: 'rounds/workbench', component: RoundsWorkbenchComponent },
  { path: 'rounds/issues', component: RoundsIssuesComponent },
  { path: 'rounds/editor/:id', component: RoundsEditorComponent },
];
