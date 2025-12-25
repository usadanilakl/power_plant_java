import { Component, EventEmitter, HostListener, Input, Output, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ContextMenuItem {
  label: string;
  action: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css']
})
export class ContextMenuComponent {
  @Input() items: ContextMenuItem[] = [];
  @Input() position = { x: 0, y: 0 };
  @Output() closeMenu = new EventEmitter<void>();
  @Output() itemClick = new EventEmitter<{ action: string }>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  onItemClick(item: ContextMenuItem): void {
    if (!item.disabled) {
      this.itemClick.emit({ action: item.action });
      this.close();
    }
  }

  close(): void {
    this.closeMenu.emit();
  }
}
