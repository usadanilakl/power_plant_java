import { Guide } from '../guide.model';

export const MANAGE_FILES_GUIDE: Guide = {
  id: 'manage-files',
  name: 'Manage Files',
  description: 'Learn how to upload, organize, and manage files',
  icon: 'folder',
  category: 'files',
  steps: [
    {
      id: 'nav-card',
      message: 'Click on the Files card to access the file management system.',
      title: 'Navigate to Files',
      order: 1,
      route: '/home',
    },
    {
      id: 'upload-button',
      message: 'Click here to upload new files. You can select multiple files at once.',
      title: 'Upload Files',
      order: 2,
      route: '/files',
    },
    {
      id: 'folder-tree',
      message: 'Use the folder tree to navigate and organize your files.',
      title: 'Folder Navigation',
      order: 3,
      route: '/files',
    },
    {
      id: 'file-actions',
      message: 'Right-click on files to see available actions like download, rename, or delete.',
      title: 'File Actions',
      order: 4,
      route: '/files',
    },
  ],
};
