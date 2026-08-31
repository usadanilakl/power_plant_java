import { Component, DestroyRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, forkJoin, merge, of } from 'rxjs';
import { catchError, debounceTime } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { InteractiveImageComponent } from '../../../../shared/image/refactored/interactive-image/interactive-image.component';
import { getPreset } from '../../../../shared/image/refactored/models/interactive-image-config.model';
import { RfShape, ShapeCountBadge } from '../../../../shared/image/refactored/models/fr-shape.model';
import { WorkAreaApiService } from '../../work-area/services/work-area-api.service';
import { workAreaShapeToRf } from '../../work-area/work-area-shape.util';
import { WorkAreaMapShapeDto } from '../../../../models/permits/work-area.model';
import {
  PERMIT_MAP_LAYERS,
  PERMIT_MAP_LAYER_META,
  PERMIT_MAP_MATCH_LABEL,
  PermitMapArea,
  PermitMapItem,
  PermitMapLayer,
  PermitMapPayload,
} from '../../../../models/permits/permit-map.model';
import { WrDetailDialogService } from '../../../../shared/wr-detail-dialog/wr-detail-dialog.service';
import { SyncUpdateService } from '../../../../services/sync/sync-update.service';

/**
 * The permits monitor as a plant map.
 *
 * <p>Same shapes the work-area editor draws — this reuses {@link InteractiveImageComponent} and
 * the shared shape-geometry helper rather than re-deriving either, so an area is in the same place
 * on both screens by construction.
 *
 * <p>Placement is decided entirely on the server (`NgPermitMapService`); this component draws what
 * it is handed. That matters because the placement rules are the part that can be wrong, and
 * having one implementation of them means the map cannot disagree with anything else that asks
 * where a permit is.
 *
 * <h2>Placing items</h2>
 *
 * Items the rules could not place are listed rather than dropped, and can be assigned to a work
 * area from here — this screen is where an operator sees the whole backlog at once with the plant
 * layout in front of them.
 *
 * <p>Staging an item and choosing a target area are INDEPENDENT, in either order. Pick the area
 * first and click through everything that belongs to it, or tick a few items and then click where
 * they go. Both are the same two pieces of state, so neither is a special case, and a mis-click is
 * undone by clicking again rather than by an undo of a write that already happened.
 */
@Component({
  selector: 'app-permits-map-view',
  standalone: true,
  imports: [CommonModule, FormsModule, InteractiveImageComponent],
  template: `
    <div class="map-view">
      <div class="layer-bar">
        <button
          *ngFor="let layer of layers"
          class="layer-chip"
          [class.on]="isLayerOn(layer)"
          [style.--layer-color]="meta[layer].color"
          (click)="toggleLayer(layer)"
          [title]="meta[layer].label"
        >
          <span class="material-icons layer-icon">{{ meta[layer].icon }}</span>
          <span class="layer-label">{{ meta[layer].label }}</span>
          <span class="layer-count">{{ layerTotals()[layer] }}</span>
        </button>

        <span class="bar-spacer"></span>

        <button class="plain-btn" (click)="showAll()" [disabled]="allLayersOn()">All layers</button>
        <button class="plain-btn" (click)="load()" [disabled]="loading()">
          {{ loading() ? 'Loading…' : 'Refresh' }}
        </button>
      </div>

      <div class="map-body">
        <div class="map-canvas">
          <div class="staging-banner" *ngIf="staged().size">
            <strong>{{ staged().size }}</strong> item(s) staged &mdash;
            <ng-container *ngIf="targetArea() as area">
              placing into <strong>{{ area.name }}</strong>.
            </ng-container>
            <ng-container *ngIf="!targetArea()">
              click an area on the map, or choose one below.
            </ng-container>
            <button class="link-btn" (click)="clearStaged()">Clear</button>
          </div>

          <div class="load-error" *ngIf="loadError()">
            {{ loadError() }}
            <button class="link-btn" (click)="load()">Retry</button>
          </div>

          <!-- Without an area linked to a shape there is literally nothing this map can draw, and a
               blank plant drawing looks identical to "a quiet day". Say which it is. -->
          <div class="setup-notice" *ngIf="!loadError() && mappedAreaCount() === 0">
            <ng-container *ngIf="payload().areas.length === 0">
              <strong>This database has no work areas.</strong>
              Nothing can be drawn or placed until some exist &mdash; and with no area names to match
              against, every open item falls to "Not on the map".
            </ng-container>
            <ng-container *ngIf="payload().areas.length > 0">
              <strong>None of the {{ payload().areas.length }} work areas is drawn on this map.</strong>
              Items still list on the right and can be placed using the dropdown; they just cannot
              appear on the drawing until each area has a shape.
            </ng-container>
            <button class="link-btn" (click)="goToMapEditor()">Open the work-area map</button>
          </div>

          <ng-container *ngIf="mapImageUrl(); else noMap">
            <app-interactive-image
              [imageUrl]="mapImageUrl()!"
              [shapesInput]="rfShapes()"
              [selectedShapeIdInput]="selectedShapeId()"
              [config]="imageConfig"
              (shapeClicked)="onShapeClicked($event)"
            ></app-interactive-image>
          </ng-container>
          <ng-template #noMap>
            <div class="empty-map">
              <!-- A failed load and a genuinely absent map are different problems and must not look
                   the same: one is fixed by signing in again, the other by uploading a drawing. -->
              <p *ngIf="loadError()">The map could not be loaded.</p>
              <p *ngIf="!loadError()">No plant map image has been uploaded yet.</p>
              <button class="plain-btn" *ngIf="loadError()" (click)="load()">Try again</button>
              <button class="plain-btn" *ngIf="!loadError()" (click)="goToMapEditor()">
                Open the work-area map
              </button>
            </div>
          </ng-template>
        </div>

        <aside class="side-panel">
          <!-- Selected area ------------------------------------------------ -->
          <ng-container *ngIf="selectedShapeId() !== null; else overview">
            <div class="panel-head">
              <h3>{{ selectedAreaNames() }}</h3>
              <button class="icon-btn" (click)="clearSelection()" title="Clear selection">×</button>
            </div>

            <!-- A shape can carry several work areas, so "place it here" needs a specific one. -->
            <div class="area-chooser" *ngIf="shapeAreas().length > 1">
              <span class="panel-note">This shape covers several areas &mdash; pick one to place into:</span>
              <button
                *ngFor="let area of shapeAreas()"
                class="chooser-btn"
                [class.on]="targetAreaId() === area.id"
                (click)="targetAreaId.set(area.id)"
              >{{ area.name }}</button>
            </div>

            <p class="panel-sub">{{ selectedItems().length }} open item(s) here</p>

            <!-- One section per category, each headed by its own count. Clicking the count opens
                 that group — a single total told an operator nothing about what they'd be walking
                 into. -->
            <div class="group" *ngFor="let group of selectedGroups()">
              <button
                class="group-head"
                [style.--layer-color]="meta[group.layer].color"
                (click)="toggleGroup(group.layer)"
              >
                <span class="material-icons group-icon">{{ meta[group.layer].icon }}</span>
                <span class="group-name">{{ meta[group.layer].label }}</span>
                <span class="group-count">{{ group.items.length }}</span>
                <span class="material-icons group-chevron">
                  {{ isGroupOpen(group.layer) ? 'expand_less' : 'expand_more' }}
                </span>
              </button>

            <div class="item-list" *ngIf="isGroupOpen(group.layer)">
              <div
                *ngFor="let item of group.items"
                class="item-card"
                [style.--layer-color]="meta[item.layer].color"
                [class.staged]="isStaged(item)"
                (click)="openItem(item)"
              >
                <div class="item-top">
                  <span class="item-layer">{{ meta[item.layer].short }}</span>
                  <span class="item-number">{{ item.permitNumber || '#' + item.id }}</span>
                  <span class="item-status" *ngIf="item.status">{{ item.status }}</span>
                  <!-- Only guessed placements can be re-pinned from here. An assigned area is a
                       decision somebody recorded; it is changed on the record, not on a map. -->
                  <button
                    *ngIf="item.matchedBy !== 'AREA'"
                    class="move-btn"
                    [class.on]="isStaged(item)"
                    (click)="toggleStaged(item); $event.stopPropagation()"
                    title="Stage this item to be placed in a work area"
                  >{{ isStaged(item) ? 'staged' : 'move' }}</button>
                </div>
                <div class="item-title">{{ item.title || '(no scope recorded)' }}</div>
                <div class="item-meta">
                  <span *ngIf="item.person">{{ item.person }}</span>
                  <span *ngIf="item.company">{{ item.company }}</span>
                  <span *ngIf="item.date">{{ item.date }}</span>
                </div>
                <div class="item-match" *ngIf="item.matchedBy" [attr.data-match]="item.matchedBy">
                  {{ matchLabel(item) }}
                  <em *ngIf="item.matchedBy === 'TEXT' && item.location">“{{ item.location }}”</em>
                </div>
              </div>
            </div>
            </div>
          </ng-container>

          <!-- Nothing selected --------------------------------------------- -->
          <ng-template #overview>
            <div class="panel-head"><h3>Plant overview</h3></div>
            <p class="panel-sub">Click an area on the map to see what is open there.</p>

            <div class="rollup">
              <div class="rollup-row" *ngFor="let row of busiestAreas()">
                <button class="rollup-name" (click)="selectArea(row.area)">{{ row.area.name }}</button>
                <span class="rollup-count">{{ row.count }}</span>
              </div>
              <p class="panel-note" *ngIf="!busiestAreas().length">
                Nothing open in any mapped area for the selected layers.
              </p>
            </div>
          </ng-template>

          <!-- Unplaced items — always visible, so an area can be picked first -->
          <div class="warn-block" *ngIf="unplacedForLayers().length">
            <div class="block-head">
              <h4>Not on the map ({{ unplacedForLayers().length }})</h4>
              <button class="link-btn" (click)="stageAllUnplaced()">
                {{ allUnplacedStaged() ? 'Deselect all' : 'Select all' }}
              </button>
            </div>
            <p class="panel-note">
              No work area on the record, and the location text matched no area name. Click to
              stage, then choose where they go.
            </p>
            <div class="item-list">
              <div
                *ngFor="let item of unplacedForLayers()"
                class="item-card selectable"
                [style.--layer-color]="meta[item.layer].color"
                [class.staged]="isStaged(item)"
                (click)="toggleStaged(item)"
              >
                <div class="item-top">
                  <span class="tick" [class.on]="isStaged(item)">{{ isStaged(item) ? '✓' : '' }}</span>
                  <span class="item-layer">{{ meta[item.layer].short }}</span>
                  <span class="item-number">{{ item.permitNumber || '#' + item.id }}</span>
                  <button
                    class="move-btn"
                    (click)="openItem(item); $event.stopPropagation()"
                    title="Open this record"
                  >open</button>
                </div>
                <div class="item-title">{{ item.title || '(no scope recorded)' }}</div>
                <div class="item-meta"><span>{{ item.location || '(no location text)' }}</span></div>
              </div>
            </div>
          </div>

          <!-- Always shown. When nothing is placed, "how much of the plant is actually drawn" is
               the first question, and gating this on having items hid the answer exactly when it
               mattered most. -->
          <div class="warn-block">
            <h4>Map coverage</h4>
            <p class="panel-note">
              {{ payload().areas.length }} work area(s) &middot;
              <strong>{{ mappedAreaCount() }}</strong> drawn on the map &middot;
              {{ shapeCount() }} shape(s) on the drawing
            </p>
            <ng-container *ngIf="unmappedAreas().length">
              <p class="panel-note">
                These have no shape, so nothing in them can ever be drawn &mdash; they are still
                selectable in the dropdown below when placing items.
              </p>
              <div class="chip-wrap">
                <span class="chip" *ngFor="let area of unmappedAreas()">{{ area.name }}</span>
              </div>
            </ng-container>
          </div>

          <!-- Commit bar ---------------------------------------------------- -->
          <div class="assign-bar" *ngIf="staged().size">
            <label class="assign-label">Place {{ staged().size }} item(s) in</label>
            <select
              class="assign-select"
              [ngModel]="targetAreaId()"
              (ngModelChange)="targetAreaId.set($event)"
            >
              <option [ngValue]="null">Choose a work area…</option>
              <option *ngFor="let area of payload().areas" [ngValue]="area.id">{{ area.name }}</option>
            </select>
            <div class="assign-actions">
              <button
                class="primary-btn"
                [disabled]="targetAreaId() === null || assigning()"
                (click)="assign()"
              >{{ assigning() ? 'Placing…' : 'Place' }}</button>
              <button class="plain-btn" (click)="clearStaged()" [disabled]="assigning()">Cancel</button>
            </div>
          </div>

          <p class="assign-error" *ngIf="assignError()">{{ assignError() }}</p>
          <p class="assign-done" *ngIf="assignMessage()">{{ assignMessage() }}</p>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .map-view {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 520px;
      background: var(--card-background);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
    }

    .layer-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color);
      background: var(--secondary-background);
      flex-wrap: wrap;
    }

    .bar-spacer { flex: 1; }

    .layer-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 14px;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--secondary-text);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 120ms ease;
    }

    /* An off layer keeps its colour dot but drops the fill, so the legend is readable in both
       themes without a second palette. */
    .layer-chip.on {
      color: var(--primary-text);
      border-color: var(--layer-color);
      box-shadow: inset 0 0 0 1px var(--layer-color);
    }

    .layer-chip:hover { border-color: var(--layer-color); }

    .layer-icon {
      font-size: 15px;
      color: var(--layer-color);
      opacity: 0.4;
    }

    .layer-chip.on .layer-icon { opacity: 1; }

    .group { margin-bottom: 8px; }

    .group-head {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 8px;
      border: 1px solid var(--border-color);
      border-left: 3px solid var(--layer-color);
      border-radius: 4px;
      background: var(--secondary-background);
      color: var(--primary-text);
      font-size: 12px;
      cursor: pointer;
    }

    .group-head:hover { background: var(--hover-color); }
    .group-icon { font-size: 16px; color: var(--layer-color); }
    .group-name { flex: 1; text-align: left; font-weight: 600; }

    .group-count {
      min-width: 20px;
      padding: 0 6px;
      border-radius: 9px;
      background: var(--layer-color);
      color: #fff;
      font-weight: 700;
      text-align: center;
    }

    .group-chevron { font-size: 16px; color: var(--secondary-text); }
    .group .item-list { margin: 6px 0 0 8px; }

    .layer-count {
      min-width: 18px;
      text-align: center;
      padding: 0 5px;
      border-radius: 9px;
      background: var(--hover-color);
      color: var(--primary-text);
      font-size: 11px;
    }

    .plain-btn {
      padding: 4px 12px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--primary-text);
      font-size: 12px;
      cursor: pointer;
    }

    .plain-btn:hover:not(:disabled) { background: var(--hover-color); }
    .plain-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    .primary-btn {
      padding: 5px 14px;
      border-radius: 4px;
      border: 1px solid var(--accent-color);
      background: var(--accent-color);
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .primary-btn:hover:not(:disabled) { background: var(--accent-color-hover); }
    .primary-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    .link-btn {
      border: none; background: transparent; padding: 0 0 0 6px;
      color: var(--accent-color); font-size: 12px; cursor: pointer;
    }
    .link-btn:hover { text-decoration: underline; }

    .map-body { flex: 1; display: flex; min-height: 0; }

    .map-canvas {
      flex: 1;
      min-width: 0;
      position: relative;
      background: var(--primary-background);
    }

    /* Floats over the canvas so the staging state is visible while the eye is on the map, which is
       where the next click goes. */
    .staging-banner {
      position: absolute;
      top: 8px; left: 50%;
      transform: translateX(-50%);
      z-index: 5;
      padding: 5px 12px;
      border-radius: 14px;
      background: var(--accent-color);
      color: #fff;
      font-size: 12px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
      white-space: nowrap;
    }

    .staging-banner .link-btn { color: #fff; text-decoration: underline; }

    .load-error {
      position: absolute;
      top: 8px; left: 50%;
      transform: translateX(-50%);
      z-index: 6;
      max-width: 90%;
      padding: 5px 12px;
      border-radius: 14px;
      background: #c62828;
      color: #fff;
      font-size: 12px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    }

    .load-error .link-btn { color: #fff; text-decoration: underline; }

    .setup-notice {
      position: absolute;
      top: 8px; left: 50%;
      transform: translateX(-50%);
      z-index: 5;
      max-width: 92%;
      padding: 6px 14px;
      border-radius: 14px;
      background: var(--secondary-background);
      border: 1px solid var(--border-color);
      color: var(--primary-text);
      font-size: 12px;
      line-height: 1.5;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .empty-map {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--secondary-text);
      font-size: 14px;
    }

    .side-panel {
      width: 340px;
      flex-shrink: 0;
      border-left: 1px solid var(--border-color);
      background: var(--card-background);
      overflow-y: auto;
      padding: 12px;
    }

    .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .panel-head h3 { margin: 0; font-size: 15px; color: var(--primary-text); }
    .panel-sub { margin: 4px 0 12px; font-size: 12px; color: var(--secondary-text); }
    .panel-note { margin: 4px 0 8px; font-size: 12px; color: var(--secondary-text); }

    .block-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }

    .icon-btn {
      border: none; background: transparent; cursor: pointer;
      color: var(--secondary-text); font-size: 18px; line-height: 1; padding: 0 4px;
    }
    .icon-btn:hover { color: var(--primary-text); }

    .area-chooser { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0 10px; }

    .chooser-btn {
      padding: 3px 10px; border-radius: 12px;
      border: 1px solid var(--border-color);
      background: transparent; color: var(--primary-text);
      font-size: 12px; cursor: pointer;
    }
    .chooser-btn.on { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }

    .item-list { display: flex; flex-direction: column; gap: 8px; }

    .item-card {
      border: 1px solid var(--border-color);
      border-left: 3px solid var(--layer-color);
      border-radius: 4px;
      padding: 8px 10px;
      cursor: pointer;
      background: var(--primary-background);
    }

    .item-card:hover { background: var(--hover-color); }
    .item-card.staged { border-color: var(--accent-color); background: var(--accent-color-shadow); }

    .item-top { display: flex; align-items: center; gap: 8px; font-size: 11px; }

    .tick {
      width: 13px; height: 13px;
      border: 1px solid var(--border-color);
      border-radius: 3px;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 10px; line-height: 1; flex-shrink: 0;
    }
    .tick.on { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }

    .item-layer {
      font-weight: 700;
      color: var(--layer-color);
      letter-spacing: 0.5px;
    }

    .item-number { color: var(--secondary-text); }

    .item-status {
      margin-left: auto;
      padding: 1px 6px;
      border-radius: 8px;
      background: var(--hover-color);
      color: var(--primary-text);
    }

    .move-btn {
      margin-left: auto;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--secondary-text);
      border-radius: 8px;
      padding: 0 7px;
      font-size: 10px;
      cursor: pointer;
    }
    .move-btn:hover { color: var(--primary-text); border-color: var(--accent-color); }
    .move-btn.on { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }
    .item-status + .move-btn { margin-left: 6px; }

    .item-title {
      font-size: 13px;
      color: var(--primary-text);
      margin: 4px 0 2px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .item-meta {
      display: flex; flex-wrap: wrap; gap: 8px;
      font-size: 11px; color: var(--secondary-text);
    }

    .item-match { margin-top: 5px; font-size: 11px; color: var(--secondary-text); }
    .item-match em { font-style: normal; opacity: 0.8; }
    /* Only the guessed placements are called out; an assigned area needs no caveat. */
    .item-match[data-match="TEXT"] { color: #d97706; }

    .rollup { display: flex; flex-direction: column; gap: 2px; margin-bottom: 16px; }

    .rollup-row {
      display: flex; align-items: center; gap: 8px;
      padding: 3px 0;
      border-bottom: 1px solid var(--border-color);
    }

    .rollup-name {
      flex: 1; text-align: left;
      border: none; background: transparent; padding: 0;
      color: var(--primary-text); font-size: 12px; cursor: pointer;
    }
    .rollup-name:hover { color: var(--accent-color); text-decoration: underline; }

    .rollup-count { font-size: 12px; font-weight: 700; color: var(--accent-color); }

    .warn-block { margin-top: 16px; }
    .warn-block h4 { margin: 0; font-size: 13px; color: var(--primary-text); }

    .chip-wrap { display: flex; flex-wrap: wrap; gap: 4px; }

    .chip {
      font-size: 11px; padding: 2px 8px; border-radius: 10px;
      background: var(--secondary-background);
      border: 1px solid var(--border-color);
      color: var(--secondary-text);
    }

    /* Sticks to the bottom of the panel: the staged list can be long, and the commit must stay
       reachable without scrolling back. */
    .assign-bar {
      position: sticky;
      bottom: -12px;
      margin: 16px -12px -12px;
      padding: 10px 12px;
      background: var(--secondary-background);
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .assign-label { font-size: 12px; color: var(--primary-text); font-weight: 600; }

    .assign-select {
      width: 100%;
      padding: 5px 6px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      background: var(--primary-background);
      color: var(--primary-text);
      font-size: 12px;
    }

    .assign-actions { display: flex; gap: 6px; }
    .assign-error { margin: 10px 0 0; font-size: 12px; color: #ef5350; }
    .assign-done { margin: 10px 0 0; font-size: 12px; color: #66bb6a; }

    @media (max-width: 900px) {
      .map-body { flex-direction: column; }
      .side-panel { width: auto; border-left: none; border-top: 1px solid var(--border-color); }
    }
  `],
})
export class PermitsMapViewComponent implements OnInit {
  /** Areas with nothing open in the active layers, so the map still shows their outline. */
  private static readonly EMPTY_AREA_COLOR = '#94a3b8';

  private api = inject(WorkAreaApiService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private wrDetailDialogService = inject(WrDetailDialogService);
  private syncUpdateService = inject(SyncUpdateService);

  readonly layers = PERMIT_MAP_LAYERS;
  readonly meta = PERMIT_MAP_LAYER_META;
  readonly imageConfig = getPreset('WORK_AREA_OVERVIEW');

  loading = signal(false);
  /** What failed on the last load, phrased for an operator. Empty when everything came back. */
  loadError = signal('');
  mapImageUrl = signal<string | null>(null);
  shapes = signal<WorkAreaMapShapeDto[]>([]);
  payload = signal<PermitMapPayload>({ areas: [], items: [], unplaced: [] });
  selectedShapeId = signal<number | null>(null);
  activeLayers = signal<Set<PermitMapLayer>>(new Set(PERMIT_MAP_LAYERS));

  /** Items queued for placing, keyed `layer:id`. Independent of which area is chosen. */
  staged = signal<Set<string>>(new Set());
  /** Where staged items will go. Set by clicking a shape or by the dropdown. */
  targetAreaId = signal<number | null>(null);
  assigning = signal(false);
  assignError = signal('');
  assignMessage = signal('');

  ngOnInit(): void {
    this.load();
    this.followLiveChanges();
  }

  /**
   * Load the three pieces the map needs, each failing independently.
   *
   * <p>A plain forkJoin aborts the whole thing the moment ANY source errors, so a single failing
   * request left the map with no image, no shapes and — because the error branch only cleared the
   * spinner — no message either. The screen just sat there empty, which is indistinguishable from
   * "there is nothing here". The common trigger is mundane: a backend restart drops the in-memory
   * session, every call comes back 401, and the map silently goes blank.
   *
   * <p>Now each request degrades on its own. Shapes still draw when the permit data fails, and
   * whatever broke is named on screen with a retry.
   */
  load(): void {
    this.loading.set(true);
    const failed: string[] = [];
    // The explicit type arguments matter: without them catchError widens the SOURCE type to
    // unknown, and every value coming out of the forkJoin loses its type.
    const survive = <T>(what: string, fallback: T) =>
      catchError<T, Observable<T>>((err: unknown) => {
        failed.push(`${what} (${describeHttpError(err)})`);
        return of(fallback);
      });

    forkJoin({
      image: this.api.getMapImage().pipe(survive('the plant map image', null as string | null)),
      shapes: this.api.getAllShapes().pipe(survive('the work areas', [] as WorkAreaMapShapeDto[])),
      payload: this.api.getPermitMap().pipe(survive('the permit data', EMPTY_PAYLOAD)),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ image, shapes, payload }) => {
        this.mapImageUrl.set(image);
        this.shapes.set(shapes);
        this.payload.set(payload);
        this.loadError.set(failed.length ? `Could not load ${failed.join(', ')}.` : '');
        this.loading.set(false);
      });
  }

  /**
   * Keep the picture current. A map of what is happening right now is worse than useless once it
   * is stale — an operator reads "nothing open here" off a snapshot taken an hour ago and walks
   * into live work. Every layer's entity type is watched, plus SSE reconnect: SSE is at-most-once,
   * so any broadcast during a disconnect is simply lost and only a refetch recovers it.
   */
  private followLiveChanges(): void {
    const layerEntities = ['WorkRequest', 'SafeWork', 'HotWork', 'ConfinedSpace', 'Loto'];
    merge(
      ...layerEntities.map(type => this.syncUpdateService.getEntityTypeUpdates$(type)),
      this.syncUpdateService.reconnected$,
    )
      .pipe(debounceTime(1500), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  // ---------------------------------------------------------------- layers

  isLayerOn(layer: PermitMapLayer): boolean {
    return this.activeLayers().has(layer);
  }

  allLayersOn = computed(() => this.activeLayers().size === PERMIT_MAP_LAYERS.length);

  toggleLayer(layer: PermitMapLayer): void {
    const next = new Set(this.activeLayers());
    if (next.has(layer)) next.delete(layer);
    else next.add(layer);
    // Turning the last layer off leaves an unreadable blank map with no way back except the
    // "All layers" button, so a solo click on the only active layer isolates it instead.
    this.activeLayers.set(next.size === 0 ? new Set([layer]) : next);
  }

  showAll(): void {
    this.activeLayers.set(new Set(PERMIT_MAP_LAYERS));
  }

  /** Item counts per layer across the whole plant — the numbers on the legend chips. */
  layerTotals = computed<Record<PermitMapLayer, number>>(() => {
    const totals = {} as Record<PermitMapLayer, number>;
    for (const layer of PERMIT_MAP_LAYERS) totals[layer] = 0;
    const p = this.payload();
    for (const item of [...p.items, ...p.unplaced]) totals[item.layer]++;
    return totals;
  });

  private visibleItems = computed(() =>
    this.payload().items.filter(item => this.activeLayers().has(item.layer))
  );

  unplacedForLayers = computed(() =>
    this.payload().unplaced.filter(item => this.activeLayers().has(item.layer))
  );

  // ---------------------------------------------------------------- map

  /** Items per work area, for the shape colours and the badge counts. */
  private itemsByArea = computed(() => {
    const map = new Map<number, PermitMapItem[]>();
    for (const item of this.visibleItems()) {
      for (const areaId of item.workAreaIds ?? []) {
        const bucket = map.get(areaId);
        if (bucket) bucket.push(item);
        else map.set(areaId, [item]);
      }
    }
    return map;
  });

  /** Areas drawn on each shape. A shape can carry several work areas. */
  private areasByShape = computed(() => {
    const byId = new Map(this.payload().areas.map(a => [a.id, a]));
    const map = new Map<number, PermitMapArea[]>();
    for (const shape of this.shapes()) {
      const areas = (shape.workAreaIds ?? [])
        .map(id => byId.get(id))
        .filter((a): a is PermitMapArea => !!a);
      map.set(shape.id, areas);
    }
    return map;
  });

  /**
   * Distinct items on a shape. Distinct matters: a shape carrying two work areas would otherwise
   * count an item present in both of them twice.
   */
  private itemsForShape(shapeId: number): PermitMapItem[] {
    const byArea = this.itemsByArea();
    const seen = new Set<string>();
    const out: PermitMapItem[] = [];
    for (const area of this.areasByShape().get(shapeId) ?? []) {
      for (const item of byArea.get(area.id) ?? []) {
        const key = keyOf(item);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(item);
      }
    }
    return out;
  }

  rfShapes = computed<RfShape[]>(() => {
    const active = this.activeLayers();
    // With exactly one layer showing, the map is unambiguous, so every populated area takes that
    // layer's signature colour. With several, a per-layer colour would be a lie about a shape
    // holding a mix, so it falls back to a heat scale on the total.
    const soleLayer = active.size === 1 ? [...active][0] : null;

    return this.shapes().map(shape => {
      const items = this.itemsForShape(shape.id);
      const count = items.length;
      const color = count === 0
        ? PermitsMapViewComponent.EMPTY_AREA_COLOR
        : soleLayer
          ? PERMIT_MAP_LAYER_META[soleLayer].color
          : heatColor(count);
      // The per-category pills replace the single total: "5" on an area could be five hot-work
      // permits or five requests, and those are not the same situation to walk into.
      return workAreaShapeToRf(shape, color, undefined, this.badgesForShape(items));
    });
  });

  /**
   * Selecting a shape both focuses the panel and nominates a target for anything staged, so
   * "pick the area, then click its items" and "tick the items, then click the area" are the same
   * two actions in either order.
   */
  onShapeClicked(shape: RfShape): void {
    if (this.selectedShapeId() === shape.id) {
      this.clearSelection();
      return;
    }
    this.selectedShapeId.set(shape.id);
    const areas = this.areasByShape().get(shape.id) ?? [];
    // Only an unambiguous shape can nominate a target on its own; with several areas the operator
    // picks which, because placing into the wrong one is silent and wrong.
    this.targetAreaId.set(areas.length === 1 ? areas[0].id : null);
    this.assignError.set('');
  }

  clearSelection(): void {
    this.selectedShapeId.set(null);
    this.targetAreaId.set(null);
  }

  selectArea(area: PermitMapArea): void {
    if (area.shapeId != null) this.selectedShapeId.set(area.shapeId);
    this.targetAreaId.set(area.id);
  }

  // ---------------------------------------------------------------- side panel

  shapeAreas = computed<PermitMapArea[]>(() => {
    const shapeId = this.selectedShapeId();
    if (shapeId == null) return [];
    return this.areasByShape().get(shapeId) ?? [];
  });

  selectedAreaNames = computed(() => {
    const areas = this.shapeAreas();
    return areas.length ? areas.map(a => a.name).join(', ') : 'Unassigned shape';
  });

  targetArea = computed<PermitMapArea | null>(() => {
    const id = this.targetAreaId();
    if (id == null) return null;
    return this.payload().areas.find(a => a.id === id) ?? null;
  });

  /** Which category sections are expanded in the panel. All start open. */
  private collapsedGroups = signal<Set<PermitMapLayer>>(new Set());

  isGroupOpen(layer: PermitMapLayer): boolean {
    return !this.collapsedGroups().has(layer);
  }

  toggleGroup(layer: PermitMapLayer): void {
    const next = new Set(this.collapsedGroups());
    if (next.has(layer)) next.delete(layer);
    else next.add(layer);
    this.collapsedGroups.set(next);
  }

  /** The selected shape's items split into per-category sections, in legend order. */
  selectedGroups = computed<{ layer: PermitMapLayer; items: PermitMapItem[] }[]>(() => {
    const byLayer = new Map<PermitMapLayer, PermitMapItem[]>();
    for (const item of this.selectedItems()) {
      const bucket = byLayer.get(item.layer);
      if (bucket) bucket.push(item);
      else byLayer.set(item.layer, [item]);
    }
    return PERMIT_MAP_LAYERS
      .filter(layer => byLayer.has(layer))
      .map(layer => ({ layer, items: byLayer.get(layer)! }));
  });

  /** Per-category pills for one shape, in legend order, zero-counts omitted. */
  private badgesForShape(items: PermitMapItem[]): ShapeCountBadge[] {
    const counts = new Map<PermitMapLayer, number>();
    for (const item of items) counts.set(item.layer, (counts.get(item.layer) ?? 0) + 1);
    return PERMIT_MAP_LAYERS
      .filter(layer => (counts.get(layer) ?? 0) > 0)
      .map(layer => ({
        label: PERMIT_MAP_LAYER_META[layer].short,
        count: counts.get(layer)!,
        color: PERMIT_MAP_LAYER_META[layer].color,
      }));
  }

  selectedItems = computed<PermitMapItem[]>(() => {
    const shapeId = this.selectedShapeId();
    if (shapeId == null) return [];
    return this.itemsForShape(shapeId)
      .slice()
      .sort((a, b) => PERMIT_MAP_LAYERS.indexOf(a.layer) - PERMIT_MAP_LAYERS.indexOf(b.layer));
  });

  /** Mapped areas with anything open, busiest first — the panel's default content. */
  busiestAreas = computed(() => {
    const byArea = this.itemsByArea();
    return this.payload().areas
      .map(area => ({ area, count: byArea.get(area.id)?.length ?? 0 }))
      .filter(row => row.count > 0 && row.area.shapeId != null)
      .sort((a, b) => b.count - a.count || a.area.name.localeCompare(b.area.name));
  });

  /** Shapes on the drawing, whether or not any work area claims them. */
  shapeCount = computed(() => this.shapes().length);

  /** Work areas actually linked to a shape — the only ones that can ever be drawn. */
  mappedAreaCount = computed(() => this.payload().areas.filter(a => a.shapeId != null).length);

  unmappedAreas = computed(() => this.payload().areas.filter(a => a.shapeId == null));

  matchLabel(item: PermitMapItem): string {
    return item.matchedBy ? PERMIT_MAP_MATCH_LABEL[item.matchedBy] : '';
  }

  // ---------------------------------------------------------------- staging

  isStaged(item: PermitMapItem): boolean {
    return this.staged().has(keyOf(item));
  }

  toggleStaged(item: PermitMapItem): void {
    const next = new Set(this.staged());
    const key = keyOf(item);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.staged.set(next);
    this.assignError.set('');
    this.assignMessage.set('');
  }

  allUnplacedStaged = computed(() => {
    const unplaced = this.unplacedForLayers();
    if (!unplaced.length) return false;
    const staged = this.staged();
    return unplaced.every(item => staged.has(keyOf(item)));
  });

  stageAllUnplaced(): void {
    const next = new Set(this.staged());
    const unplaced = this.unplacedForLayers();
    if (this.allUnplacedStaged()) unplaced.forEach(item => next.delete(keyOf(item)));
    else unplaced.forEach(item => next.add(keyOf(item)));
    this.staged.set(next);
  }

  clearStaged(): void {
    this.staged.set(new Set());
    this.assignError.set('');
  }

  /** Escape backs out of a staging run without touching anything. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.staged().size) this.clearStaged();
    else if (this.selectedShapeId() !== null) this.clearSelection();
  }

  assign(): void {
    const areaId = this.targetAreaId();
    const staged = this.staged();
    if (areaId == null || !staged.size || this.assigning()) return;

    // Resolve the staged keys against the CURRENT payload rather than trusting a snapshot: a
    // background refresh may have closed one out from under the selection.
    const all = [...this.payload().items, ...this.payload().unplaced];
    const refs = all.filter(item => staged.has(keyOf(item)))
      .map(item => ({ layer: item.layer, id: item.id }));

    if (!refs.length) {
      // clearStaged() also resets the error, so it has to happen before the message is set.
      this.clearStaged();
      this.assignError.set('Those items are no longer open — the map has been refreshed.');
      return;
    }

    this.assigning.set(true);
    this.assignError.set('');
    this.assignMessage.set('');
    this.api.assignPermitMapItems(areaId, refs)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.assigning.set(false);
          this.clearStaged();
          this.assignMessage.set(
            `Placed ${result.assigned} item(s) in ${result.workAreaName}.`);
          // The area stays selected so a run of "pick area, click its items" keeps going.
          this.load();
        },
        error: err => {
          this.assigning.set(false);
          // Nothing was written — the server validates the whole batch before it touches anything,
          // so the staged selection is still exactly what the operator chose and is left intact.
          this.assignError.set(
            err?.error?.message || err?.message || 'Could not place those items.');
        },
      });
  }

  // ---------------------------------------------------------------- navigation

  openItem(item: PermitMapItem): void {
    if (item.layer === 'WR') {
      this.wrDetailDialogService.open(item.id);
      return;
    }
    if (item.layer === 'LOTO') {
      this.router.navigate(['/loto/loto'], { queryParams: { id: item.id } });
      return;
    }
    // Safe Work / Hot Work / Confined Space are edited inside their package, which is the only
    // place that takes an id for them.
    if (item.packageId != null) {
      this.router.navigate(['/permit-builder/daily-packages'], {
        queryParams: { packageId: item.packageId },
      });
    }
  }

  goToMapEditor(): void {
    this.router.navigate(['/work-area-map']);
  }
}

const EMPTY_PAYLOAD: PermitMapPayload = { areas: [], items: [], unplaced: [] };

/**
 * Turn a failed request into something an operator can act on. 401 gets named explicitly because
 * it is by far the most common cause here and it does not mean anything is broken — restarting the
 * backend drops every in-memory session, so the tab is simply signed out.
 */
function describeHttpError(err: unknown): string {
  const e = err as HttpErrorResponse;
  if (e?.status === 401) return 'signed out — the server restarted; sign in again';
  if (e?.status === 0) return 'no response from the server';
  return e?.error?.message || e?.message || `HTTP ${e?.status ?? 'error'}`;
}

/** Ids are only unique within a layer, so the staging key has to carry both. */
function keyOf(item: PermitMapItem): string {
  return `${item.layer}:${item.id}`;
}

/** Grey → green → amber → red on item count. Same thresholds the work-area overview uses. */
function heatColor(count: number): string {
  if (count > 5) return '#ef4444';
  if (count > 2) return '#f59e0b';
  return '#22c55e';
}
