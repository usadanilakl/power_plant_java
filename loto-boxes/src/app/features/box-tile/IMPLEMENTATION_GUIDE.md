# LOTO Box Control System - Implementation Guide

## ✅ What's Been Created

### Models & Interfaces
- ✅ **loto-box.model.ts** - Box data models, status enum, color mappings
- ✅ **wled-config.model.ts** - WLED API models, hardware config, controller info
- ✅ **audit-log.model.ts** - Logging models, levels, export formats

### Services
- ✅ **wled.service.ts** - WLED controller communication
- ✅ **loto-box.service.ts** - Box state management with all 72 boxes configured
- ✅ **logger.service.ts** - Audit trail with export to CSV/JSON
- ✅ **sync-queue.service.ts** - Offline support with retry logic

## 🚧 What Still Needs to Be Created

### 1. ESP Config Service
Create `src/app/services/esp-config.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { WLEDService } from './wled.service';
import { WLEDHardwareConfig } from '../models/wled-config.model';

@Injectable({
  providedIn: 'root'
})
export class EspConfigService {
  constructor(private wledService: WLEDService) {}

  /**
   * Configure Controller 1 (strips 0, 1, 2)
   * Pins: 4, 12, 16
   * Lengths: 240, 237, 237
   */
  configureController1(): Observable<any> {
    const config: WLEDHardwareConfig = {
      cfg: {
        hw: {
          led: {
            cnt: 714, // 240 + 237 + 237
            ins: [
              { pin: [4], len: 240 },
              { pin: [12], len: 237 },
              { pin: [16], len: 237 }
            ]
          }
        }
      }
    };
    return this.wledService.configureHardware(1, config);
  }

  /**
   * Configure Controller 2 (strips 3, 4, 5)
   * Pins: 4, 12, 16
   * Lengths: 245, 245, 260
   */
  configureController2(): Observable<any> {
    const config: WLEDHardwareConfig = {
      cfg: {
        hw: {
          led: {
            cnt: 750, // 245 + 245 + 260
            ins: [
              { pin: [4], len: 245 },
              { pin: [12], len: 245 },
              { pin: [16], len: 260 }
            ]
          }
        }
      }
    };
    return this.wledService.configureHardware(2, config);
  }
}
```

### 2. Controller Health Service
Create `src/app/services/controller-health.service.ts`:

```typescript
import { Injectable, signal } from '@angular/core';
import { interval } from 'rxjs';
import { WLEDService } from './wled.service';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class ControllerHealthService {
  controllerStatus = signal<Map<number, boolean>>(new Map());

  constructor(
    private wledService: WLEDService,
    private logger: LoggerService
  ) {
    this.startPolling();
  }

  startPolling(): void {
    // Poll every 30 seconds
    interval(30000).subscribe(() => {
      this.pollAllControllers();
    });

    // Initial poll
    this.pollAllControllers();
  }

  pollAllControllers(): void {
    const controllers = this.wledService.getControllers();
    controllers.forEach(controller => {
      this.wledService.ping(controller.id).subscribe(online => {
        const status = this.controllerStatus();
        const wasOnline = status.get(controller.id);

        if (wasOnline !== online) {
          if (online) {
            this.logger.success(`Controller ${controller.id} came online`);
          } else {
            this.logger.error(`Controller ${controller.id} went offline`);
          }
        }

        status.set(controller.id, online);
        this.controllerStatus.set(new Map(status));
      });
    });
  }

  isControllerOnline(controllerId: number): boolean {
    return this.controllerStatus().get(controllerId) || false;
  }
}
```

### 3. Components

#### Box Tile Component
Create `src/app/components/box-tile/box-tile.component.ts`:

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoBox, LotoBoxStatus, STATUS_COLORS } from '../../models/loto-box.model';

@Component({
  selector: 'app-box-tile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="box-tile"
         [class.offline]="!box.online"
         [class.pending]="box.pendingSync"
         [style.background-color]="getColor()"
         (click)="onBoxClick()">
      <span class="box-number">{{ box.number }}</span>
      @if (box.pendingSync) {
        <span class="sync-indicator">⏱</span>
      }
      @if (!box.online) {
        <span class="offline-indicator">⚠</span>
      }

      @if (showDropdown) {
        <div class="dropdown" (click)="$event.stopPropagation()">
          @for (status of statuses; track status) {
            <div class="dropdown-item"
                 (click)="selectStatus(status)">
              {{ getStatusLabel(status) }}
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .box-tile {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      border: 2px solid #333;
      border-radius: 4px;
      font-weight: bold;
      color: white;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      transition: transform 0.2s;
    }

    .box-tile:hover {
      transform: scale(1.05);
      border-color: #0af;
    }

    .box-tile.offline {
      opacity: 0.5;
      border-color: #f00;
    }

    .box-tile.pending {
      border-style: dashed;
    }

    .sync-indicator,
    .offline-indicator {
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 12px;
    }

    .dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      background: #222;
      border: 1px solid #333;
      border-radius: 4px;
      z-index: 1000;
      min-width: 150px;
    }

    .dropdown-item {
      padding: 8px 12px;
      cursor: pointer;
      color: white;
    }

    .dropdown-item:hover {
      background: #333;
    }
  `]
})
export class BoxTileComponent {
  @Input() box!: LotoBox;
  @Input() showDropdown = false;
  @Output() boxClick = new EventEmitter<LotoBox>();
  @Output() statusChange = new EventEmitter<LotoBoxStatus>();

  statuses = Object.values(LotoBoxStatus);

  getColor(): string {
    return `rgb(${this.box.r}, ${this.box.g}, ${this.box.b})`;
  }

  onBoxClick(): void {
    this.boxClick.emit(this.box);
  }

  selectStatus(status: LotoBoxStatus): void {
    this.statusChange.emit(status);
  }

  getStatusLabel(status: LotoBoxStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
```

#### Box Grid Component
Create `src/app/components/box-grid/box-grid.component.ts`:

```typescript
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoBoxService } from '../../services/loto-box.service';
import { BoxTileComponent } from '../box-tile/box-tile.component';
import { LotoBox, LotoBoxStatus } from '../../models/loto-box.model';

@Component({
  selector: 'app-box-grid',
  standalone: true,
  imports: [CommonModule, BoxTileComponent],
  template: `
    <div class="box-grid">
      @for (box of lotoBoxService.boxes(); track box.number) {
        <app-box-tile
          [box]="box"
          [showDropdown]="activeDropdown() === box.number"
          (boxClick)="toggleDropdown(box)"
          (statusChange)="updateBoxStatus(box, $event)">
        </app-box-tile>
      }
    </div>
  `,
  styles: [`
    .box-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      grid-template-rows: repeat(6, 1fr);
      gap: 8px;
      width: 100%;
      height: 100%;
      padding: 16px;
    }
  `]
})
export class BoxGridComponent {
  activeDropdown = signal<number | null>(null);

  constructor(public lotoBoxService: LotoBoxService) {}

  toggleDropdown(box: LotoBox): void {
    const current = this.activeDropdown();
    this.activeDropdown.set(current === box.number ? null : box.number);
  }

  updateBoxStatus(box: LotoBox, status: LotoBoxStatus): void {
    this.lotoBoxService.updateBoxStatus(box.number, status).subscribe();
    this.activeDropdown.set(null);
  }
}
```

#### Control Panel Component
Create `src/app/components/control-panel/control-panel.component.ts`:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoBoxService } from '../../services/loto-box.service';
import { LotoBoxStatus } from '../../models/loto-box.model';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="control-panel">
      <h2>Control Panel</h2>
      <div class="buttons">
        <button (click)="syncAll()" class="btn-primary">
          Update All
        </button>
        <button (click)="clearAll()" class="btn-secondary">
          Clear All
        </button>
        <button (click)="refresh()" class="btn-secondary">
          Refresh
        </button>
      </div>

      <div class="stats">
        <div class="stat">
          <span class="label">Building:</span>
          <span class="value">{{ getStatusCount('building') }}</span>
        </div>
        <div class="stat">
          <span class="label">Test:</span>
          <span class="value">{{ getStatusCount('test') }}</span>
        </div>
        <div class="stat">
          <span class="label">Active:</span>
          <span class="value">{{ getStatusCount('active') }}</span>
        </div>
        <div class="stat">
          <span class="label">Closed:</span>
          <span class="value">{{ getStatusCount('closed') }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .control-panel {
      padding: 16px;
      background: #1e1e1e;
      border-radius: 8px;
    }

    .buttons {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }

    .btn-primary {
      background: #0af;
      color: white;
    }

    .btn-secondary {
      background: #666;
      color: white;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .stat {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      background: #2a2a2a;
      border-radius: 4px;
    }
  `]
})
export class ControlPanelComponent {
  constructor(private lotoBoxService: LotoBoxService) {}

  syncAll(): void {
    this.lotoBoxService.syncAllToControllers().subscribe();
  }

  clearAll(): void {
    if (confirm('Clear all boxes?')) {
      this.lotoBoxService.clearAllBoxes().subscribe();
    }
  }

  refresh(): void {
    this.lotoBoxService.loadBoxes();
  }

  getStatusCount(status: string): number {
    return this.lotoBoxService.boxes().filter(b =>
      b.status === status
    ).length;
  }
}
```

### 4. Main App Component
Update `src/app/app.component.ts`:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoxGridComponent } from './components/box-grid/box-grid.component';
import { ControlPanelComponent } from './components/control-panel/control-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BoxGridComponent, ControlPanelComponent],
  template: `
    <div class="app-container">
      <header>
        <h1>LOTO Box Control System</h1>
      </header>

      <div class="main-content">
        <aside class="sidebar">
          <app-control-panel></app-control-panel>
        </aside>

        <main class="grid-area">
          <app-box-grid></app-box-grid>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #121212;
      color: white;
    }

    header {
      padding: 16px;
      background: #1e1e1e;
      border-bottom: 2px solid #0af;
    }

    .main-content {
      flex: 1;
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 16px;
      padding: 16px;
      overflow: hidden;
    }

    .sidebar {
      overflow-y: auto;
    }

    .grid-area {
      overflow: hidden;
    }
  `]
})
export class AppComponent {
  title = 'LOTO Box Control';
}
```

### 5. Configure HttpClient
Update `src/app/app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient()
  ]
};
```

## 🎯 Next Steps

1. **Update Controller IPs**: Edit `wled.service.ts` and update the IP addresses for your actual ESP controllers

2. **Test Hardware Configuration**:
   ```typescript
   // In component or service
   espConfigService.configureController1().subscribe();
   espConfigService.configureController2().subscribe();
   ```

3. **Add Status Feed Component** (optional):
   - Display recent log entries
   - Show real-time updates
   - Filter by severity

4. **Add Controller Status Component** (optional):
   - Show controller online/offline status
   - Display response times
   - Manual ping buttons

5. **Add Offline Support**:
   - Service Worker for PWA
   - IndexedDB for persistent storage
   - Background sync

## 📝 API Integration

When ready to connect to your Spring Boot backend:

1. Update `wled.service.ts` to call your backend API instead of calling ESPs directly
2. Update `loto-box.service.ts` to load boxes from `/ng/loto-boxes/all`
3. Use the existing backend endpoints you created earlier

## 🎨 Styling

The components use inline styles for simplicity. Consider:
- Moving to separate CSS files
- Using Angular Material or Tailwind CSS
- Creating a theme system
- Adding animations

## 🔒 Security

- Add authentication/authorization
- Validate user permissions before box updates
- Log all security events
- Implement CORS properly on backend

