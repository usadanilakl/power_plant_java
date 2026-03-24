import { Component } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { PrintLayoutComponent } from "./features/form-designer/printable-form/print-layout/print-layout.component";
import { GlobalMessageComponent } from "./shared/global-message/global-message.component";
import { GlobalContextMenuComponent } from "./shared/menu/context-menu/global-context-menu/global-context-menu.component";
import { QrScannerComponent } from "./shared/qr-code/qr-scanner/qr-scanner.component";
import { BradyPrinterManagerComponent } from "./shared/brady-printer-manager/brady-printer-manager.component";
import { EngraverManagerComponent } from "./shared/engraver-manager/engraver-manager.component";
import { WizardDialogComponent } from "./shared/guide/guide-form";
import { CommentsDialogComponent } from "./shared/comments-dialog/comments-dialog.component";
import { CorrespondenceDialogComponent } from "./shared/correspondence-dialog/correspondence-dialog.component";
import { ConversationDialogComponent } from "./shared/messaging/conversation-dialog.component";
import { QaDialogComponent } from "./shared/qa/qa-dialog/qa-dialog.component";
import { WrDetailDialogComponent } from "./shared/wr-detail-dialog/wr-detail-dialog.component";
import { AttachmentDialogComponent } from "./shared/attachment-dialog/attachment-dialog.component";
import { ProcessWrDialogComponent } from "./shared/process-wr-dialog/process-wr-dialog.component";

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
    CommentsDialogComponent,
    CorrespondenceDialogComponent,
    ConversationDialogComponent,
    QaDialogComponent,
    WrDetailDialogComponent,
    AttachmentDialogComponent,
    ProcessWrDialogComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(public route: ActivatedRoute) {}
  title = 'Jackson';
}
