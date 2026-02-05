import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  effect,
  Renderer2,
} from '@angular/core';
import { QaService } from '../../services/qa/qa.service';
import { QaContent } from '../../models/ui/question.model';

@Directive({
  selector: '[appQa]',
  standalone: true,
})
export class QaDirective implements OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private qaService = inject(QaService);

  appQa = input.required<QaContent>();

  private iconElement: HTMLElement | null = null;
  private unlisten: (() => void) | null = null;

  constructor() {
    effect(() => {
      const isQaMode = this.qaService.isQaMode();
      const content = this.appQa();

      if (isQaMode && content) {
        this.showIcon();
      } else {
        this.removeIcon();
      }
    });
  }

  ngOnDestroy(): void {
    this.removeIcon();
  }

  private showIcon(): void {
    if (this.iconElement) return;

    this.iconElement = this.renderer.createElement('span');
    this.renderer.addClass(this.iconElement, 'qa-icon');

    const materialIcon = this.renderer.createElement('span');
    this.renderer.addClass(materialIcon, 'material-icons');
    const text = this.renderer.createText('help');
    this.renderer.appendChild(materialIcon, text);
    this.renderer.appendChild(this.iconElement, materialIcon);

    this.unlisten = this.renderer.listen(this.iconElement, 'click', (event: Event) => {
      event.stopPropagation();
      event.preventDefault();
      this.qaService.openDialog(this.appQa());
    });

    const parent = this.el.nativeElement.parentNode;
    if (parent) {
      const nextSibling = this.el.nativeElement.nextSibling;
      if (nextSibling) {
        this.renderer.insertBefore(parent, this.iconElement, nextSibling);
      } else {
        this.renderer.appendChild(parent, this.iconElement);
      }
    }
  }

  private removeIcon(): void {
    if (this.unlisten) {
      this.unlisten();
      this.unlisten = null;
    }
    if (this.iconElement && this.iconElement.parentNode) {
      this.renderer.removeChild(this.iconElement.parentNode, this.iconElement);
    }
    this.iconElement = null;
  }
}
