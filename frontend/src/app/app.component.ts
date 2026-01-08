import { Component } from '@angular/core';
import { MainLayoutComponent } from './layout/refactored/main-layout.component';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { PrintLayoutComponent } from "./features/form-designer/printable-form/print-layout/print-layout.component";
import { GlobalMessageComponent } from "./shared/global-message/global-message.component";
import { GlobalContextMenuComponent } from "./shared/menu/context-menu/global-context-menu/global-context-menu.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainLayoutComponent, PrintLayoutComponent, GlobalMessageComponent, GlobalContextMenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(public route: ActivatedRoute) {}
  title = 'Jackson';
}
