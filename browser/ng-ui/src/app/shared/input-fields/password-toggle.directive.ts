import { AfterViewInit, Directive, ElementRef, OnDestroy, Renderer2, inject } from '@angular/core';

/**
 * Adds a show/hide ("eye") button to a password input.
 *
 * Attribute directive rather than a wrapper component on purpose: the auth screens use raw
 * `<input>` elements with their own per-screen CSS, and they mix template-driven (`ngModel`) and
 * reactive (`formControlName`) bindings. A directive leaves the value binding, validation and
 * styling of the host input completely untouched — it only wraps it and toggles `type`.
 *
 *   <input type="password" formControlName="password" appPasswordToggle>
 */
@Directive({
  selector: 'input[appPasswordToggle]',
  standalone: true
})
export class PasswordToggleDirective implements AfterViewInit, OnDestroy {
  private static readonly STYLE_ID = 'pw-toggle-styles';

  private el = inject(ElementRef<HTMLInputElement>);
  private renderer = inject(Renderer2);

  private wrapper: HTMLElement | null = null;
  private button: HTMLButtonElement | null = null;
  private removeClick: (() => void) | null = null;
  private visible = false;

  ngAfterViewInit(): void {
    this.injectStylesOnce();

    const input = this.el.nativeElement as HTMLInputElement;
    const parent = this.renderer.parentNode(input);
    if (!parent) return;

    // Wrap the input so the button can be positioned against it without touching the
    // surrounding .form-group (which also holds the label / strength bar / error text).
    this.wrapper = this.renderer.createElement('span');
    this.renderer.addClass(this.wrapper, 'pw-toggle-wrap');
    this.renderer.insertBefore(parent, this.wrapper, input);
    this.renderer.appendChild(this.wrapper, input);

    // Keep typed characters clear of the icon.
    this.renderer.setStyle(input, 'padding-right', '2.5rem');

    this.button = this.renderer.createElement('button');
    this.renderer.setAttribute(this.button, 'type', 'button');
    this.renderer.addClass(this.button, 'pw-toggle-btn');
    this.renderer.appendChild(this.wrapper, this.button);
    this.render();

    this.removeClick = this.renderer.listen(this.button, 'click', () => {
      this.visible = !this.visible;
      this.renderer.setAttribute(input, 'type', this.visible ? 'text' : 'password');
      this.render();
      input.focus();
    });
  }

  ngOnDestroy(): void {
    this.removeClick?.();
  }

  /** Icon + accessible state for the current visibility. */
  private render(): void {
    if (!this.button) return;
    const label = this.visible ? 'Hide password' : 'Show password';
    this.renderer.setAttribute(this.button, 'aria-label', label);
    this.renderer.setAttribute(this.button, 'title', label);
    this.renderer.setAttribute(this.button, 'aria-pressed', String(this.visible));
    this.button.innerHTML = this.visible ? EYE_OFF_SVG : EYE_SVG;
  }

  /** One shared stylesheet for every instance — hover/focus states can't be done inline. */
  private injectStylesOnce(): void {
    if (document.getElementById(PasswordToggleDirective.STYLE_ID)) return;
    const style = this.renderer.createElement('style');
    this.renderer.setAttribute(style, 'id', PasswordToggleDirective.STYLE_ID);
    style.textContent = TOGGLE_CSS;
    this.renderer.appendChild(document.head, style);
  }
}

const TOGGLE_CSS = `
.pw-toggle-wrap { position: relative; display: block; width: 100%; }
.pw-toggle-btn {
  position: absolute; top: 50%; right: 6px; transform: translateY(-50%);
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; padding: 0; margin: 0;
  background: none; border: none; border-radius: 4px;
  color: currentColor; opacity: 0.55; cursor: pointer;
}
.pw-toggle-btn:hover { opacity: 1; }
.pw-toggle-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 1px; opacity: 1; }
.pw-toggle-btn svg { width: 20px; height: 20px; display: block; }
`;

const EYE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
  <circle cx="12" cy="12" r="3"></circle>
</svg>`;

const EYE_OFF_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>
  <line x1="1" y1="1" x2="23" y2="23"></line>
</svg>`;
