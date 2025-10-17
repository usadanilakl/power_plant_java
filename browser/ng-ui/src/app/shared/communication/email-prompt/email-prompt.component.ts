import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-email-prompt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-prompt.component.html',
  styleUrl: './email-prompt.component.css'
})
export class EmailPromptComponent {
  to = input<string>('');
  subject = input<string>('');
  body = input<string>('');

  private checkRecipient(): boolean {
    if (!this.to()) {
      console.error('Email recipient is not set.');
      return false;
    }
    return true;
  }

  sendWithDefault(): void {
    if (!this.checkRecipient()) return;

    const mailtoLink = `mailto:${this.to()}?subject=${encodeURIComponent(this.subject())}&body=${encodeURIComponent(this.body())}`;
    window.location.href = mailtoLink;
  }

  sendWithGmail(): void {
    if (!this.checkRecipient()) return;

    const to = encodeURIComponent(this.to());
    const subject = encodeURIComponent(this.subject());
    const body = encodeURIComponent(this.body());
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;

    window.open(gmailUrl, '_blank');
  }
}