import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { PageGuide, ActionGroup, AppContext } from '../contextual-guide.model';

/**
 * Context-aware guide for the Home page
 */
export function createHomePageGuide(): PageGuide {
  const router = inject(Router);

  const navigationGroup: ActionGroup = {
    id: 'navigation',
    title: 'Quick Navigation',
    icon: 'navigation',
    isRelevant: () => true,
    actions: [
      {
        id: 'go-to-loto-builder',
        label: 'Open LOTO Builder',
        description: 'Build and configure LOTO procedures with visual P&ID files',
        icon: 'build',
        priority: 100,
        isAvailable: () => true,
        highlightTargets: ['contextual:loto-builder-card'],
        hint: 'Click this card to open the LOTO Builder',
        execute: () => router.navigate(['/loto-builder']),
      },
      {
        id: 'go-to-loto-standards',
        label: 'View LOTO Standards',
        description: 'View and manage existing LOTO standard procedures',
        icon: 'description',
        priority: 90,
        isAvailable: () => true,
        highlightTargets: ['contextual:loto-standards-card'],
        hint: 'Click to view all LOTO standards',
        execute: () => router.navigate(['/loto-standard']),
      },
      {
        id: 'go-to-files',
        label: 'Manage Files',
        description: 'View and edit equipment files and documentation',
        icon: 'folder',
        priority: 80,
        isAvailable: () => true,
        highlightTargets: ['contextual:files-card'],
        hint: 'Click to access the file management system',
        execute: () => router.navigate(['/file']),
      },
      {
        id: 'go-to-loto-points',
        label: 'Manage LOTO Points',
        description: 'View and edit all LOTO isolation points',
        icon: 'location_on',
        priority: 70,
        isAvailable: () => true,
        highlightTargets: ['contextual:loto-points-card'],
        hint: 'Click to manage all LOTO points',
        execute: () => router.navigate(['/loto-points']),
      },
    ],
  };

  const commonTasksGroup: ActionGroup = {
    id: 'common-tasks',
    title: 'Common Tasks',
    icon: 'task_alt',
    isRelevant: () => true,
    actions: [
      {
        id: 'create-loto-standard',
        label: 'Create LOTO Standard',
        description: 'Start creating a new LOTO standard procedure',
        icon: 'add_circle',
        priority: 100,
        isAvailable: () => true,
        hint: 'Navigate to LOTO Builder and use Build LOTO mode',
        execute: () => router.navigate(['/loto-builder']),
      },
      {
        id: 'upload-pid-file',
        label: 'Upload P&ID File',
        description: 'Upload a new process and instrumentation diagram',
        icon: 'upload_file',
        priority: 90,
        isAvailable: () => true,
        hint: 'Navigate to Files or LOTO Builder to upload',
        execute: () => router.navigate(['/file']),
      },
      {
        id: 'print-documents',
        label: 'Print Documents',
        description: 'Print LOTO procedures and reports',
        icon: 'print',
        priority: 60,
        isAvailable: () => true,
        highlightTargets: ['contextual:print-card'],
        execute: () => router.navigate(['/print']),
      },
    ],
  };

  return {
    routePattern: /^\/(home)?$/,
    pageName: 'Home',
    icon: 'home',
    actionGroups: [navigationGroup, commonTasksGroup],
  };
}
