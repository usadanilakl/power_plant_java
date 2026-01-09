import { DriveStep, Side, Alignment } from 'driver.js';

export interface TourStep extends Partial<DriveStep> {
  element?: string;
  popover: {
    title: string;
    description: string;
    side?: Side;
    align?: Alignment;
  };
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
  route?: string; // Optional route where this tour applies
}

export interface TourProgress {
  tourId: string;
  completed: boolean;
  lastStepIndex: number;
  completedAt?: Date;
}

export type TourId =
  | 'welcome'
  | 'table'
  | 'file'
  | 'loto-points'
  | 'loto-standard'
  | 'loto-builder';
