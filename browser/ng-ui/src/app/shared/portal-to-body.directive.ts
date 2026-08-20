import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

/**
 * Portal an element to {@code document.body} so `position: fixed` on it isn't trapped by an
 * ancestor with `transform`, `filter`, `perspective`, or `will-change` (all of which create a
 * new containing block that breaks fixed-positioning). Also locks body scroll while the portal
 * is mounted so a full-screen modal doesn't leak background scroll through the backdrop.
 *
 * <p>Usage: apply to the backdrop element of a modal that's inside an Angular @if / @for and
 * relies on {@code position: fixed}. When the outer condition falses out and Angular destroys
 * the view, the directive's onDestroy removes the element from its current parent (body).
 *
 * <p>Fix pattern matches sibling {@code maximo-wo-detail.component.ts} which does this at the
 * component-host level; this directive lets you do it at the element level from any template.
 */
@Directive({ selector: '[appPortalToBody]', standalone: true })
export class PortalToBodyDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private prevOverflow = '';

  ngOnInit(): void {
    if (typeof document === 'undefined') return;
    document.body.appendChild(this.el.nativeElement);
    this.prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = this.prevOverflow;
    // Angular's view-tear-down may already have detached the element from wherever we moved it;
    // .remove() on an orphan node is a safe no-op. Guard belt-and-suspenders anyway.
    try { this.el.nativeElement.remove(); } catch { /* already detached */ }
  }
}
