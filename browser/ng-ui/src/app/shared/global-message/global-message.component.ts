import { Component, OnDestroy, OnInit } from '@angular/core';
import { GlobalMessageService, Message } from '../../services/global-message.service';
import { Subscription } from 'rxjs';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-global-message',
  standalone: true,
  imports: [NgClass],
  templateUrl: './global-message.component.html',
  styleUrl: './global-message.component.css'
})
export class GlobalMessageComponent implements OnInit, OnDestroy {
  message: Message | null = null;
  private subscription: Subscription | undefined;

  constructor(private globalMessageService: GlobalMessageService) {}

  ngOnInit(): void {
    this.subscription = this.globalMessageService.message$.subscribe(message => {
      // Seed the prompt field when a new prompt opens, so each one starts from its own initialValue
      // rather than whatever the previous prompt was left holding.
      if (message?.type === 'prompt' && this.message?.type !== 'prompt') {
        this.promptValue = message.initialValue ?? '';
      }
      this.message = message;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /** Glyph shown above the message text. Loading renders a spinner instead. */
  get icon(): string {
    switch (this.message?.color) {
      case 'green': return '✓';
      case 'red': return '✗';
      case 'yellow':
      case 'orange': return '!';
      default: return 'i';
    }
  }

  /** Bound to the prompt's text field; reset each time a new prompt opens. */
  promptValue = '';

  hide(): void {
    this.globalMessageService.hideMessage();
  }

  /**
   * Settle a confirm/prompt with the user's choice, then close. hideMessage() will also try to
   * settle it as cancelled, but a promise only honours its first settlement so this value wins.
   */
  answer(value: boolean | string | null): void {
    this.message?.resolve?.(value);
    this.globalMessageService.hideMessage();
  }

  onCardClick(): void {
    // Blocking messages are dismissed via the OK button, loading not at all.
    if (this.message?.type === 'informational') {
      this.hide();
    }
  }

  onOverlayClick(event: MouseEvent): void {
    // Never dismiss an operation that is still in flight
    if (this.message?.type === 'loading') return;

    // Close only if the overlay background is clicked, not the message card
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      // A backdrop tap on confirm/prompt means "cancel" — hideMessage settles it that way.
      this.hide();
    }
  }
}