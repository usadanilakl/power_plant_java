import { GuideFlow } from './guide-form.types';

export const UPLOAD_FILE_FLOW: GuideFlow = {
  action: 'upload-file',
  name: 'Upload File',
  description: 'Upload a new P&ID, drawing, or document to the system',
  icon: 'upload_file',
  steps: [
    {
      id: 'welcome',
      type: 'welcome',
      title: 'Upload a File',
      description:
        "Let's upload a new file to the system. This could be a P&ID, electrical drawing, or any other document you need to reference.",
      icon: 'upload_file',
      actionLabel: 'Get Started',
      hints: [
        {
          message: 'Supported formats: PDF, DWG, PNG, JPG',
          icon: 'info',
          type: 'info',
        },
        {
          message: 'You can add LOTO points to this file after uploading',
          icon: 'lightbulb',
          type: 'tip',
        },
      ],
    },
    {
      id: 'select-file',
      type: 'file-select',
      title: 'Select Your File',
      description: 'Choose the file you want to upload from your computer.',
      hints: [
        {
          message: 'Drag and drop a file or click to browse',
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
    {
      id: 'file-details',
      type: 'form',
      title: 'File Details',
      description:
        'Fill in the details for this file. Some fields are auto-filled from the filename.',
      formEntityType: 'file',
      formFields: ['name', 'fileType', 'fileNumber', 'vendor', 'isVerified'],
      hints: [
        {
          message:
            'File numbers help you find this file later. Use drawing numbers, P&ID numbers, or other identifiers.',
          icon: 'lightbulb',
          type: 'tip',
        },
        {
          message:
            'The file name was auto-filled from your uploaded file. You can change it if needed.',
          icon: 'info',
          type: 'info',
        },
      ],
    },
    {
      id: 'review',
      type: 'review',
      title: 'Review & Upload',
      description:
        "Review the details below. Click 'Upload' when you're ready to save this file.",
      hints: [
        {
          message: "You can go back to make changes if something doesn't look right",
          icon: 'undo',
          type: 'tip',
        },
      ],
    },
    {
      id: 'complete',
      type: 'complete',
      title: 'File Uploaded!',
      description: 'Your file has been successfully uploaded to the system.',
      icon: 'check_circle',
      actionLabel: 'Done',
      hints: [
        {
          message: 'Would you like to add LOTO points to this file?',
          icon: 'add_location',
          type: 'tip',
        },
      ],
    },
  ],
};
