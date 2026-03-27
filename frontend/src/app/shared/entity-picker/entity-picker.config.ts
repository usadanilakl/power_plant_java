import {environment} from '../../../environments/environment';

export interface EntityPickerConfig {
  label: string;
  endpoint: string;
  columns: {key: string, label: string}[];
  nameKey: string;        // field used as display name after selection
  paginated: boolean;     // whether the endpoint supports ?page=&pageSize=
  responseKey?: string;   // key to extract data from response (for non-standard response shapes)
}

const base = environment.apiUrl;

export const ENTITY_PICKER_CONFIGS: Record<string, EntityPickerConfig> = {
  Equipment: {
    label: 'Equipment',
    endpoint: `${base}/equipment/paginated`,
    columns: [{key: 'name', label: 'Name'}, {key: 'equipmentType', label: 'Type'}],
    nameKey: 'name',
    paginated: true,
  },
  User: {
    label: 'User',
    endpoint: `${base}/users/paginated`,
    columns: [{key: 'name', label: 'Name'}, {key: 'username', label: 'Username'}],
    nameKey: 'name',
    paginated: true,
  },
  DailyPermitPackage: {
    label: 'Permit Package',
    endpoint: `${base}/daily-permit-packages/paginated`,
    columns: [{key: 'permitNumber', label: 'Permit #'}, {key: 'name', label: 'Name'}],
    nameKey: 'permitNumber',
    paginated: true,
  },
  SafeWork: {
    label: 'Safe Work',
    endpoint: `${base}/safe-works/paginated`,
    columns: [{key: 'name', label: 'Name'}],
    nameKey: 'name',
    paginated: true,
  },
  HotWork: {
    label: 'Hot Work',
    endpoint: `${base}/hot-works/paginated`,
    columns: [{key: 'name', label: 'Name'}],
    nameKey: 'name',
    paginated: true,
  },
  ConfinedSpace: {
    label: 'Confined Space',
    endpoint: `${base}/confined-spaces/paginated`,
    columns: [{key: 'name', label: 'Name'}],
    nameKey: 'name',
    paginated: true,
  },
  LotoPoint: {
    label: 'LOTO Point',
    endpoint: `${base}/loto-points/paginated`,
    columns: [{key: 'name', label: 'Name'}, {key: 'equipment', label: 'Equipment'}],
    nameKey: 'name',
    paginated: true,
  },
};
