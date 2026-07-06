import { Routes } from '@angular/router';
import { PlantMapComponent } from '../features/physical/plant-map/plant-map.component';
import { PhysicalObjectBrowserComponent } from '../features/physical/physical-object-browser/physical-object-browser.component';
import { Plant3dComponent } from '../features/physical/plant-3d/plant-3d.component';
import { Plant3dBuilderComponent } from '../features/physical/plant-3d/plant-3d-builder.component';

/**
 * Top-level "Plant" section — the global PhysicalObject binder (the plant map + hierarchy). This is NOT a Maximo
 * feature: PhysicalObject is the canonical thing everything binds to, and Maximo (WOs/SRs/assets) ties INTO it.
 * The Maximo facets (per-node WO/SR tab, reseed) are still served from the gated Maximo endpoints, but the
 * navigation lives here.
 */
export const PLANT_ROUTES: Routes = [
  { path: 'plant', redirectTo: 'plant/map', pathMatch: 'full' },
  { path: 'plant/map', component: PlantMapComponent },
  { path: 'plant/map/:nodeId', component: PlantMapComponent },
  { path: 'plant/3d', component: Plant3dComponent },
  { path: 'plant/3d/build', component: Plant3dBuilderComponent },
  { path: 'plant/hierarchy', component: PhysicalObjectBrowserComponent },
];
