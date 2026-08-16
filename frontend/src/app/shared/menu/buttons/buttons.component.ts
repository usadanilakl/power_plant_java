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

/**
 * How much room the button row is allowed to take.
 * - `normal` — full labels, row may wrap (desktop default).
 * - `compact` — tighter padding/font, single non-wrapping strip.
 * - `icon`   — as compact, plus labels are dropped on buttons that carry an
 *              icon (the label moves into the tooltip so nothing is lost).
 * The host decides the tier; the row never measures anything itself.
 */
export type ButtonDensity = 'normal' | 'compact' | 'icon';

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
  density = input<ButtonDensity>('normal');

  /** Resolved label text (config allows a plain string or a signal). */
  labelOf(button: ButtonConfig): string {
    return this.isString(button.name) ? button.name : button.name();
  }

  /**
   * Tooltip actually rendered. An explicit tooltip always wins; otherwise, when
   * the label is hidden (icon density + the button has an icon) the label is
   * promoted to the tooltip so an icon-only button is still identifiable.
   */
  tooltipOf(button: ButtonConfig): string {
    if (button.tooltip) return button.tooltip;
    return this.density() === 'icon' && button.icon ? this.labelOf(button) : '';
  }

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
