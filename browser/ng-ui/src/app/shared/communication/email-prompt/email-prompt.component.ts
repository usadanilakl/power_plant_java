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
  buttonText = input<string>('Send Email via Device');

  sendEmail(): void {
    if (!this.to()) {
      console.error('Email recipient is not set.');
      return;
    }

    const mailtoLink = `mailto:${this.to()}?subject=${encodeURIComponent(this.subject())}&body=${encodeURIComponent(this.body())}`;
    window.location.href = mailtoLink;
  }
}
