
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarItem } from '../toolbar.model';
@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent {
  @Input() items: ToolbarItem[] = [];
  @Output() itemClick = new EventEmitter<string>();

  onItemClick(item: ToolbarItem): void {
    if (item.action) {
      item.action();
    }
    // We can still emit the ID for logging or other purposes if needed
    this.itemClick.emit(item.id);
  }
}