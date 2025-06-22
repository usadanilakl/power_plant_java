import { Component, input, OnInit, signal } from '@angular/core';
import { NestedItem } from '../../../models/ui/nested-item.model';
import { ToggleListComponent } from "../../list/toggle-list/toggle-list.component";
import { FileService } from '../../../services/file.service';

@Component({
  selector: 'app-toggle-menu',
  imports: [ToggleListComponent],
  templateUrl: './toggle-menu.component.html',
  styleUrl: './toggle-menu.component.css'
})
export class ToggleMenuComponent{

  menuItems = input<NestedItem[]>([]);


  onItemDoubleClicked (item: NestedItem) {
    console.log(`Double clicked on item: ${item.name}`);
  }
  onItemRightClicked(event:{event: MouseEvent, item: NestedItem}) {
    console.log(`Right clicked on item: ${event.item.name}`);
  }

  onItemMiddleClicked(item: NestedItem) {
    console.log(`Middle clicked on item: ${item.name}`);
  }
}
