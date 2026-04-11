import { Component, inject, signal, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LotoPointBulkCreateService, BulkCreateCard } from '../services/loto-point-bulk-create.service';
import { LotoPointCreateCardComponent } from './loto-point-create-card.component';
import { RfPopupProjectionComponent } from '../../../../shared/popup-projection/rf-popup-projection.component';
import { RfValueSelectComponent } from '../../../values/refactored/components/rf-value-select/rf-value-select.component';
import { RfValueDto } from '../../../values/refactored/models/rf-value.model';
import { CharacteristicsEditorComponent } from '../../../../shared/reactive-form/refactored/input-fields/characteristics-editor/characteristics-editor.component';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { EngraverModalService } from '../../../../shared/engraver-manager/engraver-modal.service';
import { BradyPrinterModalService } from '../../../../shared/brady-printer-manager/brady-printer-modal.service';
import { AgentChatService } from '../../../../services/agent/agent-chat.service';
import { SpeechService } from '../../../../services/agent/speech.service';

/** Groups cards into rows — counterpart pairs are in the same row */
interface CardRow {
  primary: BulkCreateCard;
  counterpart?: BulkCreateCard;
}

@Component({
  selector: 'app-loto-point-bulk-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RfPopupProjectionComponent,
    LotoPointCreateCardComponent,
    RfValueSelectComponent,
    CharacteristicsEditorComponent,
  ],
  templateUrl: './loto-point-bulk-create-dialog.component.html',
  styleUrls: ['./loto-point-bulk-create-dialog.component.css'],
})
export class LotoPointBulkCreateDialogComponent {
  bulkCreateService = inject(LotoPointBulkCreateService);
  private engraverModalService = inject(EngraverModalService);
  private bradyModalService = inject(BradyPrinterModalService);
  private chatService = inject(AgentChatService);
  speechService = inject(SpeechService);
  private destroyRef = inject(DestroyRef);

  // Bulk edit form values
  bulkTagNumber = '';
  bulkDescription = '';
  bulkSpecificLocation = '';
  bulkLocationId: number | null = null;
  bulkLocationValue: RfValueDto | null = null;
  bulkNormPosId: number | null = null;
  bulkNormPosValue: RfValueDto | null = null;
  bulkIsoPosId: number | null = null;
  bulkIsoPosValue: RfValueDto | null = null;
  bulkCharacteristicsJson = '';

  // AI prompt
  aiPrompt = signal('');
  aiGenerating = signal(false);

  constructor() {
    // Subscribe to AI bulk card generation
    this.chatService.bulkCardsGenerated$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((cards: any[]) => {
      this.bulkCreateService.importCards(cards);
      this.aiGenerating.set(false);
    });

    // Pipe speech transcript into AI prompt
    effect(() => {
      const transcript = this.speechService.transcriptBuffer();
      if (transcript) {
        this.aiPrompt.set(transcript);
      }
    });
  }

  get cardRows(): CardRow[] {
    const cards = this.bulkCreateService.cards();
    const rows: CardRow[] = [];
    const visited = new Set<string>();

    for (const card of cards) {
      if (visited.has(card.uid)) continue;
      visited.add(card.uid);

      const row: CardRow = { primary: card };
      if (card.counterpartUid) {
        const counterpart = cards.find(c => c.uid === card.counterpartUid);
        if (counterpart) {
          row.counterpart = counterpart;
          visited.add(counterpart.uid);
        }
      }
      rows.push(row);
    }
    return rows;
  }

  getCardIndex(uid: string): number {
    return this.bulkCreateService.cards().findIndex(c => c.uid === uid);
  }

  // Bulk edit
  onBulkLocationSelected(value: RfValueDto | null): void {
    this.bulkLocationId = value?.id ?? null;
    this.bulkLocationValue = value;
  }

  onBulkNormPosSelected(value: RfValueDto | null): void {
    this.bulkNormPosId = value?.id ?? null;
    this.bulkNormPosValue = value;
  }

  onBulkIsoPosSelected(value: RfValueDto | null): void {
    this.bulkIsoPosId = value?.id ?? null;
    this.bulkIsoPosValue = value;
  }

  applyBulkEdit(target: 'all' | 'selected'): void {
    const values: Partial<LotoPointDto> = {};
    if (this.bulkTagNumber) values.tagNumber = this.bulkTagNumber;
    if (this.bulkDescription) values.description = this.bulkDescription;
    if (this.bulkSpecificLocation) values.specificLocation = this.bulkSpecificLocation;
    if (this.bulkLocationValue) values.location = { id: this.bulkLocationValue.id, name: this.bulkLocationValue.name } as any;
    if (this.bulkNormPosValue) values.normPos = { id: this.bulkNormPosValue.id, name: this.bulkNormPosValue.name } as any;
    if (this.bulkIsoPosValue) values.isoPos = { id: this.bulkIsoPosValue.id, name: this.bulkIsoPosValue.name } as any;
    if (this.bulkCharacteristicsJson) values.characteristicsJson = this.bulkCharacteristicsJson;

    this.bulkCreateService.applyBulkEdit(values, target);
  }

  clearBulkEdit(): void {
    this.bulkTagNumber = '';
    this.bulkDescription = '';
    this.bulkSpecificLocation = '';
    this.bulkLocationId = null;
    this.bulkLocationValue = null;
    this.bulkNormPosId = null;
    this.bulkNormPosValue = null;
    this.bulkIsoPosId = null;
    this.bulkIsoPosValue = null;
    this.bulkCharacteristicsJson = '';
  }

  // Save & Engrave / Save & Print
  saveAndEngrave(): void {
    const sub = this.bulkCreateService.savedItems$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(savedDtos => {
      sub.unsubscribe();
      this.bulkCreateService.close();
      this.engraverModalService.openWithItems(savedDtos);
    });
    this.bulkCreateService.saveAll();
  }

  saveAndPrint(): void {
    const sub = this.bulkCreateService.savedItems$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(savedDtos => {
      sub.unsubscribe();
      this.bulkCreateService.close();
      const printQueue = savedDtos.map(item => ({
        line1: item.tagNumber || '',
        line2: item.description || '',
        withQr: true,
      }));
      this.bradyModalService.openWithQueue(printQueue);
    });
    this.bulkCreateService.saveAll();
  }

  // AI
  askAi(): void {
    if (this.speechService.isRecording()) {
      this.speechService.stopVoiceInput();
    }
    const prompt = this.aiPrompt().trim();
    if (!prompt) return;
    this.aiGenerating.set(true);
    this.chatService.sendMessage(`[BULK_CREATE] ${prompt}`);
    this.aiPrompt.set('');
  }

  toggleVoiceInput(): void {
    if (this.speechService.isRecording()) {
      this.speechService.stopVoiceInput();
    } else {
      this.speechService.startVoiceInput();
    }
  }
}
