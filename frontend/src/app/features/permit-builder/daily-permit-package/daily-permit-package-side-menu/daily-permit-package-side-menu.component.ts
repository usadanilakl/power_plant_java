

import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { CurrentDailyPermitPackageService } from '../../../../services/current-items-services/current-daily-permit-package.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { DailyPermitPackageDto } from '../../../../models/permits/dailt-permit-package.model';
import { CommonModule } from '@angular/common';

type GroupBy = 'company' | 'person' | 'date';

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

  // constructor() { 
  //   // Expand all groups by default when grouping changes
  //   effect(() => {
  //     const groups = this.packagesGrouped().map(g => g.groupName);
  //     this.expandedGroups.set(new Set(groups));
  //   });
  // }

  constructor() { 
    // When grouping changes, collapse all groups.
    effect(() => {
      this.packagesGrouped(); // Rerun effect when grouping changes
      this.expandedGroups.set(new Set());
    });
  }

  allPackages = this.currendDailyPermitPackageService.allPackages
  
  packagesByCompany = computed(() => {
    return this.groupPackages('company');
  });

  packagesByPerson = computed(() => {
    return this.groupPackages('person');
  });

  packagesByDate = computed(() => {
    return this.groupPackages('date');
  });

  packagesGrouped = computed(() => {
    switch (this.groupBy()) {
      case 'company':
        return this.packagesByCompany();
      case 'person':
        return this.packagesByPerson();
      case 'date':
        return this.packagesByDate();
      default:
        return [];
    }
  });

  private groupPackages(groupBy: GroupBy): PackageGroup[] {
    const packages = this.allPackages();
    const grouped = new Map<string, DailyPermitPackageDto[]>();
    
    packages.forEach(pkg => {
      let groupName: string;
      switch (groupBy) {
        case 'company':
          groupName = this.companyNameFilter(pkg.companyName || 'Unassigned'  );
          break;
        case 'person':
          groupName = this.formatGroupName(pkg.personName);
          break;
        case 'date':
          groupName = pkg.date ? new Date(pkg.date).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'Unassigned';
          break;
        default:
          groupName = 'Unassigned';
      }
      
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
    })).sort((a, b) => {
      if (groupBy === 'date') {
        if (a.groupName === 'Unassigned') return 1;
        if (b.groupName === 'Unassigned') return -1;
        return new Date(b.groupName).getTime() - new Date(a.groupName).getTime(); // Sort dates descending
      }
      return a.groupName.localeCompare(b.groupName);
    });
  }

  private formatGroupName(name: string | null | undefined): string {
    if (!name) {
      return 'Unassigned';
    }
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return 'Unassigned';
    }
    return trimmedName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private companyNameFilter(companyName: string): string {
    const name = companyName.replace(/\s/g, '').toLowerCase();
    if(name.includes('depue')) return 'Depue';
    else if(name.includes('kiewit')) return 'Kiewit';
    else if(name.includes('mitsu') || name==='mhi') return 'Mitsubishi';
    else if(name.includes('brand')) return 'Brand';
    else if(name.includes('synergy')) return 'Synergy';
    else if(name.includes('blockelec')) return 'Block Electric';
    else if(name==='gts') return 'GTS';
    return this.formatGroupName(companyName);
  }


  // private groupPackages(groupBy: GroupBy): PackageGroup[] {
  //   const packages = this.allPackages();
  //   const grouped = new Map<string, DailyPermitPackageDto[]>();
    
  //   packages.forEach(pkg => {
  //     const groupName = groupBy === 'company' 
  //       ? (pkg.companyName || 'Unassigned')
  //       : (pkg.personName || 'Unassigned');
      
  //     if (!grouped.has(groupName)) {
  //       grouped.set(groupName, []);
  //     }
  //     grouped.get(groupName)!.push(pkg);
  //   });
    
  //   // Convert Map to array of objects for easier template iteration
  //   return Array.from(grouped.entries()).map(([groupName, packages]) => ({
  //     groupName,
  //     packages: packages.sort((a, b) => {
  //       // Sort by date, then by time
  //       if (a.date && b.date) {
  //         const dateCompare = a.date.localeCompare(b.date);
  //         if (dateCompare !== 0) return dateCompare;
  //         if (a.time && b.time) {
  //           return a.time.localeCompare(b.time);
  //         }
  //       }
  //       return 0;
  //     })
  //   })).sort((a, b) => a.groupName.localeCompare(b.groupName));
  // }

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
