import { Guide } from '../guide.model';
import { CREATE_LOTO_POINT_GUIDE } from './create-loto-point.guide';
import { CREATE_LOTO_STANDARD_GUIDE } from './create-loto-standard.guide';
import { MANAGE_FILES_GUIDE } from './manage-files.guide';
import { EQUIPMENT_MANAGEMENT_GUIDE } from './equipment-management.guide';

export const AVAILABLE_GUIDES: Guide[] = [
  CREATE_LOTO_POINT_GUIDE,
  CREATE_LOTO_STANDARD_GUIDE,
  MANAGE_FILES_GUIDE,
  EQUIPMENT_MANAGEMENT_GUIDE,
];

export {
  CREATE_LOTO_POINT_GUIDE,
  CREATE_LOTO_STANDARD_GUIDE,
  MANAGE_FILES_GUIDE,
  EQUIPMENT_MANAGEMENT_GUIDE,
};
