import { Component, signal } from '@angular/core';
import { MainLayoutComponent } from "../../layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menu/router-menu/router-menu.component";
import { RouterModule } from '@angular/router';
import { RouterMenuItems } from '../../models/ui/router-menu.model';
import { FILE_NAV_MENU_ITEMS } from '../../models/ui/router-menu.model';

@Component({
  selector: 'app-file-page',
  imports: [MainLayoutComponent, RouterMenuComponent, RouterModule],
  templateUrl: './file-page.component.html',
  styleUrl: './file-page.component.css'
})
export class FilePageComponent {
  fileNavMenuItems: RouterMenuItems = FILE_NAV_MENU_ITEMS;

}
