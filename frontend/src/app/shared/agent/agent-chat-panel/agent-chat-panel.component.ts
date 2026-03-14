import { Component, inject, ViewChild, ElementRef, AfterViewChecked, OnDestroy, effect, signal } from '@angular/core';
import { CommonModule, KeyValuePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { AgentChatService, ChatMessage } from '../../../services/agent/agent-chat.service';
import { AgentCreationFlowService, ValueOption } from '../../../services/agent/agent-creation-flow.service';
import { CurrentJobLogService } from '../../../services/current-items-services/current-job-log.service';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { AgentResultsDialogComponent } from '../agent-results-dialog/agent-results-dialog.component';
import { EquipmentConnectionDialogComponent } from '../../guide/guide-form/dialogs/equipment-connection-dialog/equipment-connection-dialog.component';
import { EquipmentConnectionDialogData, EquipmentConnectionDialogResult } from '../../guide/guide-form/dialogs/equipment-connection-dialog/equipment-connection-dialog.types';

@Component({
  selector: 'app-agent-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, KeyValuePipe, DecimalPipe],
  templateUrl: './agent-chat-panel.component.html',
  styleUrl: './agent-chat-panel.component.css'
})
export class AgentChatPanelComponent implements AfterViewChecked, OnDestroy {
  chatService = inject(AgentChatService);
  creationFlow = inject(AgentCreationFlowService);
  private currentJobLogService = inject(CurrentJobLogService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  inputText = '';
  settingsOpen = signal(false);
  activeFilters = signal<Record<string, string | null>>({});
  private shouldScroll = false;

  // Mic UX: speech text types directly into textarea in real-time
  // userPrefix = text typed before recording started; speech appends after it
  private userPrefix = '';
  private wasRecording = false;

  private transcriptEffect = effect(() => {
    const speech = this.chatService.speech;
    const recording = speech.isRecording();
    const transcript = speech.transcriptBuffer();

    if (recording && !this.wasRecording) {
      this.userPrefix = this.inputText;
    }

    if (recording && transcript) {
      const separator = this.userPrefix && !this.userPrefix.endsWith(' ') ? ' ' : '';
      this.inputText = this.userPrefix + separator + transcript;
    }

    if (!recording && this.wasRecording) {
      speech.transcriptBuffer.set('');
      this.userPrefix = '';
    }

    this.wasRecording = recording;
  });

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    if (this.chatService.speech.isRecording()) {
      this.chatService.speech.stopVoiceInput();
    }
    if (this.chatService.speech.isSpeaking()) {
      this.chatService.stopSpeaking();
    }
  }

  send(): void {
    if (!this.inputText.trim() || this.chatService.isLoading()) return;
    // Stop recording if active before sending
    if (this.chatService.speech.isRecording()) {
      this.chatService.speech.stopVoiceInput();
    }
    this.chatService.sendMessage(this.inputText.trim());
    this.inputText = '';
    this.shouldScroll = true;
    // Reset textarea height after clearing
    if (this.messageInput) {
      this.messageInput.nativeElement.style.height = 'auto';
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  confirm(confirmationId: string): void {
    this.chatService.confirmAction(confirmationId);
    this.shouldScroll = true;
  }

  cancel(confirmationId: string): void {
    this.chatService.cancelAction(confirmationId);
    this.shouldScroll = true;
  }

  toggleSpeak(msg: ChatMessage): void {
    if (this.chatService.currentSpeakingMessageTimestamp()?.getTime() === msg.timestamp.getTime()) {
      this.chatService.stopSpeaking();
    } else {
      this.chatService.speakMessage(msg.content, msg.timestamp);
    }
  }

  isSpeakingMessage(msg: ChatMessage): boolean {
    return this.chatService.currentSpeakingMessageTimestamp()?.getTime() === msg.timestamp.getTime();
  }

  toggleMic(): void {
    if (this.chatService.speech.isRecording()) {
      this.chatService.speech.stopVoiceInput();
    } else {
      this.chatService.speech.startVoiceInput();
    }
  }

  toggleSettings(): void {
    this.settingsOpen.update(v => !v);
  }

  onVoiceChange(voiceURI: string): void {
    this.chatService.speech.setVoice(voiceURI);
  }

  onRateChange(rate: number): void {
    this.chatService.speech.speechRate.set(rate);
  }

  openItem(item: Record<string, any>): void {
    const search = item['tagNumber'] || item['id'];
    if (search) {
      this.chatService.closePanel();
      this.router.navigate(['/loto-points/table'], {
        queryParams: { search }
      });
    }
  }

  openResultsInDialog(msg: ChatMessage): void {
    const results = msg.data?.['results'] as Record<string, any>[];
    if (!results?.length) return;
    const items = results.map(r => LotoPointDto.fromJson(r));
    this.dialog.open(AgentResultsDialogComponent, {
      data: { items },
      panelClass: 'agent-results-dialog-panel',
      autoFocus: false,
    });
  }

  getUniqueValues(results: Record<string, any>[], field: string): string[] {
    return [...new Set(results.map(r => r[field]).filter(Boolean))].sort();
  }

  toggleFilter(msgTimestamp: Date, field: string, value: string): void {
    const key = msgTimestamp.getTime() + ':' + field;
    this.activeFilters.update(f => ({
      ...f, [key]: f[key] === value ? null : value
    }));
  }

  isFilterActive(msgTimestamp: Date, field: string, value: string): boolean {
    const key = msgTimestamp.getTime() + ':' + field;
    return this.activeFilters()[key] === value;
  }

  getFilteredResults(msg: ChatMessage): Record<string, any>[] {
    const results = msg.data?.['results'] as Record<string, any>[] || [];
    const ts = msg.timestamp.getTime();
    const sysF = this.activeFilters()[ts + ':system'];
    const eqF = this.activeFilters()[ts + ':eqType'];
    const locF = this.activeFilters()[ts + ':location'];
    return results.filter(r =>
      (!sysF || r['system'] === sysF) &&
      (!eqF || r['eqType'] === eqF) &&
      (!locF || r['location'] === locF)
    );
  }

  // ========== Creation Flow ==========

  onChipSelect(field: string, option: ValueOption): void {
    this.creationFlow.selectOption(field, option);
    this.shouldScroll = true;
  }

  onTextSubmit(field: string, value: string): void {
    this.creationFlow.submitText(field, value);
    this.shouldScroll = true;
  }

  onYesNo(field: string, value: boolean): void {
    this.creationFlow.selectYesNo(field, value);
    this.shouldScroll = true;
  }

  onPidConnectionYes(): void {
    // Set value and add user message WITHOUT auto-advancing (dialog is async)
    this.creationFlow.collectedData.update(d => ({ ...d, pidConnection: true }));
    this.chatService.messages.update(msgs => [...msgs, {
      role: 'user' as const, content: 'Yes', type: 'text' as const, timestamp: new Date()
    }]);

    const dialogData: EquipmentConnectionDialogData = {
      mode: 'single',
      allowBrowse: true,
      allowDraw: true,
      allowUpload: false,
    };

    const dialogRef = this.dialog.open(EquipmentConnectionDialogComponent, {
      data: dialogData,
      width: '95vw',
      maxWidth: '1400px',
      height: '85vh',
      panelClass: 'equipment-connection-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((result: EquipmentConnectionDialogResult | undefined) => {
      if (result && !result.cancelled && result.selectedEquipment.length > 0) {
        const equipmentIds = result.selectedEquipment.map(eq => eq.id).filter(Boolean) as number[];
        const fileId = result.selectedFile?.id ?? null;
        this.creationFlow.setEquipmentConnection(equipmentIds, fileId);

        // Add confirmation message
        const msg: ChatMessage = {
          role: 'assistant',
          content: `Connected to ${equipmentIds.length} equipment shape(s)` +
            (result.selectedFile ? ` on file "${result.selectedFile.name}"` : '') + '.',
          type: 'text',
          timestamp: new Date()
        };
        this.chatService.messages.update(msgs => [...msgs, msg]);
      } else {
        // User cancelled — set pidConnection to false and continue
        this.creationFlow.collectedData.update(d => ({ ...d, pidConnection: false }));
      }
      this.creationFlow.advanceAfterPidConnection();
      this.shouldScroll = true;
    });
  }

  onSkipStep(): void {
    this.creationFlow.skipStep();
    this.shouldScroll = true;
  }

  onCreate(): void {
    this.creationFlow.createLotoPoint();
    this.shouldScroll = true;
  }

  onOpenInWizard(): void {
    const data = this.creationFlow.getWizardData();
    this.creationFlow.cancelFlow();
    this.chatService.closePanel();
    this.router.navigate(['/loto-points/table'], {
      queryParams: { wizard: 'add-loto-point', prefill: JSON.stringify(data) }
    });
  }

  onCancelFlow(): void {
    this.creationFlow.cancelFlow();
    this.shouldScroll = true;
  }

  onStartCreateValue(categoryAlias: string): void {
    this.creationFlow.startCreatingNewValue(categoryAlias);
  }

  onCreateNewValue(categoryAlias: string, name: string): void {
    this.creationFlow.createNewValue(categoryAlias, name);
    this.shouldScroll = true;
  }

  isChipPreSelected(msg: ChatMessage, option: ValueOption): boolean {
    const preSelected = msg.data?.['preSelected'];
    return preSelected && preSelected['id'] === option.id;
  }

  // ========== Work Request Flow ==========

  onCreateWorkRequest(): void {
    this.creationFlow.createWorkRequest();
    this.shouldScroll = true;
  }

  onSubmitMultiple(fields: Record<string, string>): void {
    this.creationFlow.submitMultipleText(fields);
    this.shouldScroll = true;
  }

  onAttachToJob(jobId: number): void {
    // This is called from the matching_jobs card in the agent chat.
    // We need a workRequestId from context — check the last matching_jobs message data.
    const msgs = this.chatService.messages();
    const matchMsg = [...msgs].reverse().find(m => m.type === 'matching_jobs' && m.data);
    const wrId = matchMsg?.data?.['workRequestId'];
    if (!wrId || !jobId) return;

    this.chatService.messages.update(ms => [...ms, {
      role: 'user' as const, content: `Attach to Job #${jobId}`, type: 'text' as const, timestamp: new Date()
    }]);

    this.currentJobLogService.processWorkRequest(jobId.toString(), wrId.toString()).subscribe({
      next: () => {
        const msg: ChatMessage = {
          role: 'assistant',
          content: `Work request attached to Job #${jobId}. A new package has been created.`,
          type: 'action_completed',
          timestamp: new Date()
        };
        this.chatService.messages.update(ms => [...ms, msg]);
        this.shouldScroll = true;
      },
      error: (err) => {
        const msg: ChatMessage = {
          role: 'assistant',
          content: 'Failed to attach: ' + (err?.error?.message || err?.message || 'Unknown error'),
          type: 'error',
          timestamp: new Date()
        };
        this.chatService.messages.update(ms => [...ms, msg]);
      }
    });
  }

  onOpenWrInForm(): void {
    const data = this.creationFlow.wrData();
    this.creationFlow.cancelFlow();
    this.chatService.closePanel();
    this.router.navigate(['/permit-builder/work-requests'], {
      queryParams: { prefill: JSON.stringify(data) }
    });
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
