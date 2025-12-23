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

  hide(): void {
    this.globalMessageService.hideMessage();
  }

  onOverlayClick(event: MouseEvent): void {
    // Close only if the overlay background is clicked, not the message box
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.hide();
    }
  }
}