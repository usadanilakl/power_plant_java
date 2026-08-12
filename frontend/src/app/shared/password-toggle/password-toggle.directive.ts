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
 *
 * EVERY property on the injected button is set as an INLINE style, deliberately. Renderer2-created
 * elements inherit the host component's `_ngcontent-*` attribute, so a component stylesheet's bare
 * element selector (e.g. `button { width: 100%; height: 45px; background: var(--accent-color) }` in
 * auth.component.css) matches this button and out-specifies any class we could give it — it rendered
 * as a full-size accent-coloured block covering the field. Inline styles beat any non-`!important`
 * rule regardless of specificity, so the button is immune to whatever screen it lands on.
 */
@Directive({
  selector: 'input[appPasswordToggle]',
  standalone: true
})
export class PasswordToggleDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLInputElement>);
  private renderer = inject(Renderer2);

  private button: HTMLButtonElement | null = null;
  private listeners: Array<() => void> = [];
  private visible = false;

  ngAfterViewInit(): void {
    const input = this.el.nativeElement as HTMLInputElement;
    const parent = this.renderer.parentNode(input);
    if (!parent) return;

    // Wrap the input so the button positions against the FIELD, not the surrounding .form-group
    // (which also holds the label, strength bar and error text).
    const wrapper: HTMLElement = this.renderer.createElement('span');
    this.setStyles(wrapper, {
      position: 'relative',
      display: 'block',
      width: '100%',
      margin: '0',
      padding: '0',
      border: 'none',
      background: 'none',
    });
    this.renderer.insertBefore(parent, wrapper, input);
    this.renderer.appendChild(wrapper, input);

    // Keep typed characters clear of the icon. `vertical-align: top` removes the descender gap an
    // inline-level input leaves under itself, so the wrapper's height is exactly the field's height —
    // which is what the button's `height: 100%` resolves against.
    this.renderer.setStyle(input, 'padding-right', '2.75rem');
    this.renderer.setStyle(input, 'vertical-align', 'top');

    this.button = this.renderer.createElement('button');
    this.renderer.setAttribute(this.button, 'type', 'button');
    // Opts out of the global coarse-pointer `button:not(.tap-exempt) { min-height: 44px }` rule,
    // which would otherwise make the icon taller than the field it sits in.
    this.renderer.setAttribute(this.button, 'class', 'tap-exempt');
    this.setStyles(this.button!, {
      position: 'absolute',
      top: '0',
      right: '2px',
      // Matching the field's own height keeps it centred on any screen without measuring.
      height: '100%',
      width: '2.25rem',
      'min-width': '0',
      'min-height': '0',
      'max-width': 'none',
      'max-height': 'none',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      flex: '0 0 auto',
      margin: '0',
      padding: '0',
      border: 'none',
      'border-radius': '4px',
      background: 'none',
      'box-shadow': 'none',
      appearance: 'none',
      '-webkit-appearance': 'none',
      // NOT `currentColor`: these auth cards are dark panels that never declare a `color`, so the
      // button would inherit the UA default black and paint a near-invisible icon on a dark field
      // (~1.4:1). The field's own text colour is legible on the field's own background by
      // definition. `outline` is deliberately left unset so the focus ring below can own it.
      color: this.fieldColor(input),
      font: 'inherit',
      'line-height': '1',
      cursor: 'pointer',
      opacity: '0.55',
      transition: 'opacity 0.15s ease',
      'z-index': '2',
    });
    this.renderer.appendChild(wrapper, this.button);
    this.render();

    // Hover/focus feedback lives here rather than in a stylesheet: inline styles would win over any
    // :hover / :focus-visible rule anyway, so the ring has to be applied the same way.
    this.listeners.push(
      this.renderer.listen(this.button, 'click', () => {
        this.visible = !this.visible;
        this.renderer.setAttribute(input, 'type', this.visible ? 'text' : 'password');
        this.render();
        input.focus();
      }),
      this.renderer.listen(this.button, 'mouseenter', () => this.setOpacity('1')),
      // Guarded: leaving with the pointer must not strip the look off a keyboard-focused button.
      this.renderer.listen(this.button, 'mouseleave', () => {
        if (!this.isFocused()) this.setOpacity('0.55');
      }),
      this.renderer.listen(this.button, 'focus', () => {
        this.setOpacity('1');
        // Opacity alone is the same cue as hover, so keyboard users would get no distinct focus
        // indicator (WCAG 2.4.7). Draw a real ring, but only for keyboard focus.
        if (this.matches(':focus-visible')) {
          this.setStyles(this.button!, { outline: '2px solid currentColor', 'outline-offset': '1px' });
        }
      }),
      this.renderer.listen(this.button, 'blur', () => {
        this.renderer.removeStyle(this.button, 'outline');
        this.renderer.removeStyle(this.button, 'outline-offset');
        this.setOpacity('0.55');
      }),
    );
  }

  ngOnDestroy(): void {
    this.listeners.forEach(off => off());
    this.listeners = [];
  }

  private setOpacity(value: string): void {
    if (this.button) this.renderer.setStyle(this.button, 'opacity', value);
  }

  /** `matches` throws on a selector the browser doesn't know — treat that as "not matching". */
  private matches(selector: string): boolean {
    try {
      return !!this.button?.matches(selector);
    } catch {
      return false;
    }
  }

  private isFocused(): boolean {
    return !!this.button && document.activeElement === this.button;
  }

  /** The input's own text colour — legible on the input's own background, whatever the theme. */
  private fieldColor(input: HTMLInputElement): string {
    const colour = getComputedStyle(input).color;
    return colour && colour !== 'transparent' ? colour : 'currentColor';
  }

  private setStyles(el: HTMLElement, styles: Record<string, string>): void {
    for (const [prop, value] of Object.entries(styles)) {
      this.renderer.setStyle(el, prop, value);
    }
  }

  /** Icon + accessible state for the current visibility. */
  private render(): void {
    if (!this.button) return;
    const label = this.visible ? 'Hide password' : 'Show password';
    this.renderer.setAttribute(this.button, 'aria-label', label);
    this.renderer.setAttribute(this.button, 'title', label);
    this.renderer.setAttribute(this.button, 'aria-pressed', String(this.visible));
    this.button.innerHTML = this.visible ? EYE_OFF_SVG : EYE_SVG;
    const svg = this.button.firstElementChild as HTMLElement | null;
    if (svg) {
      // Inline here too — a stray `svg { width: 100% }` in a component sheet would blow it up.
      this.setStyles(svg, { width: '1.25rem', height: '1.25rem', display: 'block', flex: '0 0 auto' });
    }
  }
}

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
