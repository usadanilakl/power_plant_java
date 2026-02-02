import { Component } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { PrintLayoutComponent } from "./features/form-designer/printable-form/print-layout/print-layout.component";
import { GlobalMessageComponent } from "./shared/global-message/global-message.component";
import { GlobalContextMenuComponent } from "./shared/menu/context-menu/global-context-menu/global-context-menu.component";
import { QrScannerComponent } from "./shared/qr-code/qr-scanner/qr-scanner.component";
import { BradyPrinterManagerComponent } from "./shared/brady-printer-manager/brady-printer-manager.component";
import { EngraverManagerComponent } from "./shared/engraver-manager/engraver-manager.component";
import { WizardDialogComponent } from "./shared/guide/guide-form";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    PrintLayoutComponent,
    GlobalMessageComponent,
    GlobalContextMenuComponent,
    QrScannerComponent,
    BradyPrinterManagerComponent,
    EngraverManagerComponent,
    WizardDialogComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(public route: ActivatedRoute) {}
  title = 'Jackson';
}
