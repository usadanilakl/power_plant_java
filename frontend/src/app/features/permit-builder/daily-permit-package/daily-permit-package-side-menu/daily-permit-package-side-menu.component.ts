import { Component, DestroyRef, effect, inject } from '@angular/core';
import { CurrentDailyPermitPackageService } from '../../../../services/current-items-services/current-daily-permit-package.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { DailyPermitPackageDto } from '../../../../models/permits/dailt-permit-package.model';

@Component({
  selector: 'app-daily-permit-package-side-menu',
  imports: [],
  standalone: true,
  templateUrl: './daily-permit-package-side-menu.component.html',
  styleUrl: './daily-permit-package-side-menu.component.css'
})
export class DailyPermitPackageSideMenuComponent {

  private currendDailyPermitPackageService = inject(CurrentDailyPermitPackageService);
  private destroyRef = inject(DestroyRef)
  constructor() { 

  }

  allPackages = this.currendDailyPermitPackageService.allPackages


  packageSelected = (packageItem: DailyPermitPackageDto) => {
    this.currendDailyPermitPackageService.setSelectedPackage(packageItem);
  }

  createNewPackage(){
    this.currendDailyPermitPackageService.setCurrentDailyPermitPackage();
  }



}
