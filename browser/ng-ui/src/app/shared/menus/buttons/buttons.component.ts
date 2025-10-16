import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ButtonConfig {
  name: string;
  action: () => void;
  color?: 'primary' | 'accent' | 'warn';
  disabled?: boolean;
}

@Component({
  selector: 'app-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './buttons.component.html',
  styleUrl: './buttons.component.css'
})
export class ButtonsComponent {
  buttons = input.required<ButtonConfig[]>();
  layout = input<'row' | 'column'>('row');

  onButtonClick(button: ButtonConfig): void {
    if (!button.disabled) {
      button.action();
    }
  }
}
