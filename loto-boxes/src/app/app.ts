import { Component, signal, OnInit } from '@angular/core';
import { ControlPanelComponent } from "./features/control-panel.component/control-panel.component";
import { BoxGridComponent } from "./features/box-grid/box-grid.component";
import { NetworkStatusComponent } from "./features/network-status/network-status.component";

declare global {
  interface Window {
    electronAPI?: {
      closeWindow: () => void;
      isElectron: boolean;
    };
  }
}

@Component({
  selector: 'app-root',
  imports: [ControlPanelComponent, BoxGridComponent, NetworkStatusComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Loto Boxes');
  protected isElectron = signal(false);

  ngOnInit(): void {
    // Check if running in Electron
    this.isElectron.set(!!window.electronAPI?.isElectron);
  }

  closeWindow(): void {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  }
}
