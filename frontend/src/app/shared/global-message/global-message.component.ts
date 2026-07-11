import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NgClass } from '@angular/common';
import { GlobalMessageService, Message } from './global-message.service';

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

  hide(): void {
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
      this.hide();
    }
  }
}