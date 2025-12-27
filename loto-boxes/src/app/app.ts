import { Component, signal } from '@angular/core';
import { ControlPanelComponent } from "./features/control-panel.component/control-panel.component";
import { BoxGridComponent } from "./features/box-grid/box-grid.component";

@Component({
  selector: 'app-root',
  imports: [ControlPanelComponent, BoxGridComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Loto Boxes');
}
