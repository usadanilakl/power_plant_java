import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { FileDto } from '../../../../../models/file/file.model';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';

export interface EquipmentConnectionDialogData {
  /** Selection mode - 'multi' allows selecting from different files */
  mode: 'single' | 'multi';
  /** Allow clicking existing equipment shapes */
  allowBrowse: boolean;
  /** Allow drawing new equipment shapes */
  allowDraw: boolean;
  /** Allow uploading new files */
  allowUpload: boolean;
  /** Pre-selected equipment IDs to highlight */
  preselectedEquipmentIds?: number[];
  /** Pre-selected file to open initially */
  preselectedFileId?: number;
  /** For zero energy mode: prompt to create LOTO point for unassociated equipment */
  requireLotoPointForUnassociated?: boolean;
  /** Fields required in quick-create form */
  lotoPointQuickCreateFields?: string[];
}

export interface EquipmentConnectionDialogResult {
  /** Selected equipment (array for multi-select, may come from different files) */
  selectedEquipment: EquipmentDto[];
  /** The last selected file (for reference) */
  selectedFile: FileDto | null;
  /** Newly created LOTO points (for zero energy mode) */
  newlyCreatedLotoPoints?: LotoPointDto[];
  /** True if user cancelled */
  cancelled: boolean;
}

export interface ExistingAssociationWarning {
  equipment: EquipmentDto;
  existingLotoPoint: LotoPointDto;
  message: string;
}

/** Warning for equipment that has no LOTO point (used in zero energy mode) */
export interface MissingAssociationWarning {
  equipment: EquipmentDto;
  message: string;
}

export const DEFAULT_DIALOG_DATA: Partial<EquipmentConnectionDialogData> = {
  mode: 'single',
  allowBrowse: true,
  allowDraw: true,
  allowUpload: false,
  requireLotoPointForUnassociated: false,
  lotoPointQuickCreateFields: ['tagNumber', 'description', 'location', 'isoPos', 'normPos'],
};
