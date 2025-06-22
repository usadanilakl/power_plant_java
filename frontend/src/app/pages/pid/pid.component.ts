import { Component } from '@angular/core';
import { FileTableComponent } from "../../features/files/file-table/file-table.component";
import { MainLayoutComponent } from "../../layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menu/router-menu/router-menu.component";

@Component({
  selector: 'app-pid',
  imports: [FileTableComponent, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './pid.component.html',
  styleUrl: './pid.component.css'
})
export class PidComponent {

}
