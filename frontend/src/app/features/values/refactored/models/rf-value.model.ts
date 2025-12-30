import { Option } from '../../../../models/option.model';

export interface RfCategoryDto {
  id: number;
  name: string;
  alias: string;
}

export interface RfValueDto {
  id: number;
  name: string;
  alias: string;
  category: RfCategoryDto;
}

export interface SpringApiResponse<T> {
  responseData: T;
  message: string;
  timestamp: string;
}

export interface ValueDependencies {
  equipment: number;
  lotoPoints: number;
  files: number;
}

// Helper function to convert ValueDto to Option
export function valueToOption(value: RfValueDto): Option {
  return {
    value: value.id,
    label: value.name
  };
}

// Helper function to convert array of ValueDto to Options
export function valuesToOptions(values: RfValueDto[]): Option[] {
  return values.map(valueToOption);
}
