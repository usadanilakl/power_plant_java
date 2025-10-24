

import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { CurrentDailyPermitPackageService } from '../../../../services/current-items-services/current-daily-permit-package.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { DailyPermitPackageDto } from '../../../../models/permits/dailt-permit-package.model';
import { CommonModule } from '@angular/common';

type GroupBy = 'company' | 'person';

interface PackageGroup {
  groupName: string;
  packages: DailyPermitPackageDto[];
}

@Component({
  selector: 'app-daily-permit-package-side-menu',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './daily-permit-package-side-menu.component.html',
  styleUrl: './daily-permit-package-side-menu.component.css'
})
export class DailyPermitPackageSideMenuComponent {

  private currendDailyPermitPackageService = inject(CurrentDailyPermitPackageService);
  private destroyRef = inject(DestroyRef)
  
  // Track which groups are expanded
  private expandedGroups = signal<Set<string>>(new Set());
  
  // Track current grouping mode
  groupBy = signal<GroupBy>('company');

  constructor() { 
    // Expand all groups by default when grouping changes
    effect(() => {
      const groups = this.packagesGrouped().map(g => g.groupName);
      this.expandedGroups.set(new Set(groups));
    });
  }

  allPackages = this.currendDailyPermitPackageService.allPackages
  
  packagesByCompany = computed(() => {
    return this.groupPackages('company');
  });

  packagesByPerson = computed(() => {
    return this.groupPackages('person');
  });

  packagesGrouped = computed(() => {
    return this.groupBy() === 'company' ? this.packagesByCompany() : this.packagesByPerson();
  });

  private groupPackages(groupBy: GroupBy): PackageGroup[] {
    const packages = this.allPackages();
    const grouped = new Map<string, DailyPermitPackageDto[]>();
    
    packages.forEach(pkg => {
      const groupName = groupBy === 'company' 
        ? (pkg.companyName || 'Unassigned')
        : (pkg.personName || 'Unassigned');
      
      if (!grouped.has(groupName)) {
        grouped.set(groupName, []);
      }
      grouped.get(groupName)!.push(pkg);
    });
    
    // Convert Map to array of objects for easier template iteration
    return Array.from(grouped.entries()).map(([groupName, packages]) => ({
      groupName,
      packages: packages.sort((a, b) => {
        // Sort by date, then by time
        if (a.date && b.date) {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          if (a.time && b.time) {
            return a.time.localeCompare(b.time);
          }
        }
        return 0;
      })
    })).sort((a, b) => a.groupName.localeCompare(b.groupName));
  }

  setGroupBy(groupBy: GroupBy) {
    this.groupBy.set(groupBy);
  }

  toggleGroup(groupName: string) {
    const expanded = new Set(this.expandedGroups());
    if (expanded.has(groupName)) {
      expanded.delete(groupName);
    } else {
      expanded.add(groupName);
    }
    this.expandedGroups.set(expanded);
  }

  isGroupExpanded(groupName: string): boolean {
    return this.expandedGroups().has(groupName);
  }

  packageSelected = (packageItem: DailyPermitPackageDto) => {
    this.currendDailyPermitPackageService.setSelectedPackage(packageItem);
  }

  createNewPackage(){
    this.currendDailyPermitPackageService.setCurrentDailyPermitPackage();
  }
}

// import { Component, computed, DestroyRef, effect, inject } from '@angular/core';
// import { CurrentDailyPermitPackageService } from '../../../../services/current-items-services/current-daily-permit-package.service';
// import { toSignal } from '@angular/core/rxjs-interop';
// import { DailyPermitPackageDto } from '../../../../models/permits/dailt-permit-package.model';

// @Component({
//   selector: 'app-daily-permit-package-side-menu',
//   imports: [],
//   standalone: true,
//   templateUrl: './daily-permit-package-side-menu.component.html',
//   styleUrl: './daily-permit-package-side-menu.component.css'
// })
// export class DailyPermitPackageSideMenuComponent {

//   private currendDailyPermitPackageService = inject(CurrentDailyPermitPackageService);
//   private destroyRef = inject(DestroyRef)
//   constructor() { 

//   }

//   allPackages = this.currendDailyPermitPackageService.allPackages
  


//   packageSelected = (packageItem: DailyPermitPackageDto) => {
//     this.currendDailyPermitPackageService.setSelectedPackage(packageItem);
//   }

//   createNewPackage(){
//     this.currendDailyPermitPackageService.setCurrentDailyPermitPackage();
//   }

// }
