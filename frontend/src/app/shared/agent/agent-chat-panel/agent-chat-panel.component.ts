import { Component, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AgentChatService, ChatMessage } from '../../../services/agent/agent-chat.service';

@Component({
  selector: 'app-agent-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, KeyValuePipe],
  templateUrl: './agent-chat-panel.component.html',
  styleUrl: './agent-chat-panel.component.css'
})
export class AgentChatPanelComponent implements AfterViewChecked {
  chatService = inject(AgentChatService);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  inputText = '';
  private shouldScroll = false;

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  send(): void {
    if (!this.inputText.trim() || this.chatService.isLoading()) return;
    this.chatService.sendMessage(this.inputText.trim());
    this.inputText = '';
    this.shouldScroll = true;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  confirm(confirmationId: string): void {
    this.chatService.confirmAction(confirmationId);
    this.shouldScroll = true;
  }

  cancel(confirmationId: string): void {
    this.chatService.cancelAction(confirmationId);
    this.shouldScroll = true;
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
