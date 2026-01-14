import { WizardFlow } from '../wizard-stack.types';

export const SELECT_FILE_FLOW: WizardFlow = {
  type: 'select-file',
  name: 'Select File',
  description: 'Select an existing file or upload a new one',
  icon: 'folder_open',
  canBranch: true, // Used from file-connection steps

  steps: [
    // Step 1: Choose Action
    {
      id: 'choose-action',
      type: 'confirm',
      title: 'Select or Upload?',
      description: 'Would you like to select an existing file or upload a new one?',
      confirmConfig: {
        yesLabel: 'Select Existing',
        noLabel: 'Upload New',
        yesDescription: 'Choose from files already in the system.',
        noDescription: 'Upload a new file from your computer.',
        resultField: 'selectExisting',
        yesNextStep: 'select-existing',
        noNextStep: 'upload-redirect',
      },
      hints: [
        {
          message: 'Most LOTO points are connected to existing P&IDs.',
          icon: 'lightbulb',
          type: 'tip',
        },
      ],
    },

    // Step 2a: Select Existing File
    {
      id: 'select-existing',
      type: 'table-selector',
      title: 'Select a File',
      description: 'Choose a file from the system.',
      tableConfig: {
        fieldName: 'selectedFile',
        entityType: 'file',
        columns: ['name', 'fileType', 'fileNumber'],
        allowCreate: false,
        minSelection: 1,
        maxSelection: 1,
      },
      hints: [
        {
          message: 'Search by file name, type, or number.',
          icon: 'search',
          type: 'tip',
        },
        {
          message: 'Click a row to select the file.',
          icon: 'touch_app',
          type: 'tip',
        },
      ],
    },

    // Step 2b: Upload redirect (will branch to upload-file flow)
    {
      id: 'upload-redirect',
      type: 'welcome',
      title: 'Upload New File',
      description: 'Starting file upload...',
      hints: [
        {
          message: 'You will be guided through the file upload process.',
          icon: 'upload_file',
          type: 'info',
        },
      ],
      // Note: The step renderer will detect this and auto-branch to upload-file flow
    },
  ],
};
