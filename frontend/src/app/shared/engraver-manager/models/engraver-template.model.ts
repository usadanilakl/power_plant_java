export interface EngraverTemplateDto {
  id: number;
  name: string;
  description: string;
  tagSize: string;
  dataStructure: string;
  batchSize: number;
  filename: string;
  isDefault: boolean;
  withQr: boolean;
}
