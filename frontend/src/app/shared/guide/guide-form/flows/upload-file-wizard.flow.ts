import { WizardFlow } from '../wizard-stack.types';

export const UPLOAD_FILE_FLOW: WizardFlow = {
  type: 'upload-file',
  name: 'Upload File',
  description: 'Upload a new P&ID, drawing, or document',
  icon: 'upload_file',
  canBranch: true, // Can be used from file-connection step

  steps: [
    // Step 1: Welcome
    {
      id: 'welcome',
      type: 'welcome',
      title: 'Upload a File',
      description: 'Upload a new P&ID, electrical drawing, or document to the system.',
      hints: [
        {
          message: 'Supported formats: PDF, DWG, PNG, JPG, TIFF',
          icon: 'info',
          type: 'info',
        },
        {
          message: 'You can add LOTO points to this file after uploading.',
          icon: 'lightbulb',
          type: 'tip',
        },
      ],
    },

    // Step 2: Select File
    {
      id: 'select-file',
      type: 'file-upload',
      title: 'Select Your File',
      description: 'Choose the file you want to upload from your computer.',
      uploadConfig: {
        accept: '.pdf,.png,.jpg,.jpeg,.tiff,.dwg',
        maxSize: 52428800, // 50MB
        fieldName: 'uploadedFile',
      },
      hints: [
        {
          message: 'Drag and drop a file or click to browse.',
          icon: 'touch_app',
          type: 'tip',
        },
        {
          message: 'Maximum file size: 50MB',
          icon: 'info',
          type: 'info',
        },
      ],
    },

    // Step 3: File Name
    {
      id: 'file-name',
      type: 'text-input',
      title: 'File Name',
      description: 'Confirm or modify the file name.',
      inputConfig: {
        fieldName: 'name',
        placeholder: 'Enter file name',
        required: true,
        maxLength: 200,
      },
      hints: [
        {
          message: 'The name was auto-filled from your file. You can change it.',
          icon: 'auto_fix_high',
          type: 'info',
        },
      ],
    },

    // Step 4: File Type
    {
      id: 'file-type',
      type: 'select-input',
      title: 'File Type',
      description: 'What type of document is this?',
      selectConfig: {
        fieldName: 'fileType',
        optionsSource: 'static',
        staticOptions: [
          { value: 'P&ID', label: 'P&ID (Piping & Instrumentation Diagram)' },
          { value: 'Electrical', label: 'Electrical Drawing' },
          { value: 'Schematic', label: 'Schematic' },
          { value: 'Layout', label: 'Layout Drawing' },
          { value: 'Document', label: 'Document' },
          { value: 'Other', label: 'Other' },
        ],
        searchable: false,
        required: true,
      },
      hints: [
        {
          message: 'File type helps categorize and filter documents.',
          icon: 'category',
          type: 'info',
        },
      ],
    },

    // Step 5: File Number (Optional)
    {
      id: 'file-number',
      type: 'text-input',
      title: 'File/Drawing Number',
      description: 'Enter the official document number (optional).',
      inputConfig: {
        fieldName: 'fileNumber',
        placeholder: 'e.g., DWG-001-P&ID-100',
        required: false,
        maxLength: 100,
      },
      isOptional: true,
      hints: [
        {
          message: 'Use drawing numbers, P&ID numbers, or document codes.',
          icon: 'numbers',
          type: 'tip',
        },
        {
          message: 'This helps you find this file later.',
          icon: 'search',
          type: 'info',
        },
      ],
    },

    // Step 6: Review
    {
      id: 'review',
      type: 'review',
      title: 'Review & Upload',
      description: 'Review the details before uploading.',
      hints: [
        {
          message: 'Click Back to make any changes.',
          icon: 'arrow_back',
          type: 'tip',
        },
      ],
    },

    // Step 7: Complete
    {
      id: 'complete',
      type: 'complete',
      title: 'File Uploaded!',
      description: 'Your file has been successfully uploaded.',
      hints: [
        {
          message: 'You can now add LOTO points to this file.',
          icon: 'add_location',
          type: 'tip',
        },
      ],
    },
  ],
};
