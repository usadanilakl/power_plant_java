import { Component, input, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GuideDirective } from '../../guide/guide.directive';

export interface ButtonConfig {
  name: string | Signal<string>;
  action: () => void;
  color?: ButtonColor | Signal<ButtonColor>;
  disabled?: boolean;
  icon?: string | Signal<string>;
  tooltip?: string;
  class?: string;
  /** Guide identifier in format "guideId:stepId" for the guide system */
  guideId?: string;
  /** Message to show when this button is highlighted by a guide */
  guideMessage?: string;
}

export type ButtonColor = 'primary' | 'accent' | 'warn' | 'success' | 'info' | 'secondary' | 'danger';

@Component({
  selector: 'app-buttons',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, GuideDirective],
  templateUrl: './buttons.component.html',
  styleUrl: './buttons.component.css',
})
export class ButtonsComponent {
  buttons = input.required<ButtonConfig[]>();
  layout = input<'row' | 'column'>('row');

  onButtonClick(button: ButtonConfig): void {
    if (!button.disabled) {
      console.log('Button clicked:', button.name);
      button.action();
    }
  }

  isString(value: any): value is string {
    return typeof value === 'string';
  }

  getColorValue(color: ButtonColor | Signal<ButtonColor> | undefined): ButtonColor {
    if (!color) return 'primary';
    return this.isString(color) ? color : color();
  }
}
