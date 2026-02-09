/**
 * IPC Event channel names for communication between main and renderer processes.
 */

// Spring Boot lifecycle (invoke/handle)
export const IPC_APP_START = 'app:start';
export const IPC_APP_STOP = 'app:stop';
export const IPC_APP_RESTART = 'app:restart';
export const IPC_APP_GET_STATUS = 'app:get-status';
export const IPC_APP_GET_LOGS = 'app:get-logs';

// Spring Boot status broadcasts (send/on)
export const IPC_APP_STATUS_CHANGED = 'app:status-changed';
export const IPC_APP_LOG = 'app:log';

// WebView control (invoke/handle)
export const IPC_WEBVIEW_OPEN = 'webview:open';
export const IPC_WEBVIEW_CLOSE = 'webview:close';
export const IPC_WEBVIEW_INJECT = 'webview:inject';

// Fire Impairment (invoke/handle)
export const IPC_FIRE_IMP_LIST = 'fire-imp:list';
export const IPC_FIRE_IMP_CREATE = 'fire-imp:create';
export const IPC_FIRE_IMP_OPEN_FORM = 'fire-imp:open-form';
export const IPC_FIRE_IMP_CLOSE = 'fire-imp:close';
export const IPC_FIRE_IMP_UPDATE = 'fire-imp:update';
export const IPC_FIRE_IMP_GET_ENUMS = 'fire-imp:get-enums';
export const IPC_FIRE_IMP_LIST_CLOSED = 'fire-imp:list-closed';
export const IPC_FIRE_IMP_COUNT = 'fire-imp:count';
export const IPC_FIRE_IMP_CANCEL = 'fire-imp:cancel';
// Fire Impairment broadcasts (send/on)
export const IPC_FIRE_IMP_FORM_SUBMITTED = 'fire-imp:form-submitted';

// Gate Log (invoke/handle)
export const IPC_GATE_LOG_GET_PEOPLE = 'gate-log:get-people';
export const IPC_GATE_LOG_GET_STATUS = 'gate-log:get-status';
export const IPC_GATE_LOG_REFRESH = 'gate-log:refresh';
export const IPC_GATE_LOG_SET_AUTO_REFRESH = 'gate-log:set-auto-refresh';
export const IPC_GATE_LOG_GET_CONFIG = 'gate-log:get-config';
export const IPC_GATE_LOG_SAVE_CONFIG = 'gate-log:save-config';
export const IPC_GATE_LOG_PRINT = 'gate-log:print';
// Gate Log broadcasts (send/on)
export const IPC_GATE_LOG_PEOPLE_UPDATED = 'gate-log:people-updated';

// Weather (invoke/handle + send/on)
export const IPC_WEATHER_GET_STATUS = 'weather:get-status';
export const IPC_WEATHER_STATUS = 'weather:status';

// PJM (invoke/handle + send/on)
export const IPC_PJM_GET_STATUS = 'pjm:get-status';
export const IPC_PJM_SHOW_WINDOW = 'pjm:show-window';
export const IPC_PJM_STATUS = 'pjm:status';

// Window control
export const IPC_WINDOW_CLOSE = 'window:close';
export const IPC_WINDOW_MINIMIZE = 'window:minimize';
export const IPC_WINDOW_MAXIMIZE = 'window:maximize';

// Device Identity (invoke/handle)
export const IPC_DEVICE_CONFIG_GET = 'device:get-config';
export const IPC_DEVICE_CONFIG_SAVE = 'device:save-config';
export const IPC_DEVICE_REGISTRY_FETCH = 'device:fetch-registry';
export const IPC_DEVICE_REGISTRY_REGISTER = 'device:register';
export const IPC_DEVICE_NEEDS_SETUP = 'device:needs-setup';

// Update management (invoke/handle)
export const IPC_UPDATE_CHECK = 'update:check';
export const IPC_UPDATE_DOWNLOAD = 'update:download';
export const IPC_UPDATE_PROGRESS = 'update:progress';     // send/on

// Sync management (invoke/handle)
export const IPC_SYNC_GET_STATUS = 'sync:get-status';
export const IPC_SYNC_TRIGGER_RESYNC = 'sync:trigger-resync';
export const IPC_SYNC_GET_RESYNC_STATUS = 'sync:get-resync-status';
export const IPC_SYNC_STALE = 'sync:stale';               // send/on
export const IPC_DEVICE_CONFLICT = 'device:conflict';       // send/on

// Cold Resync (invoke/handle + send/on)
export const IPC_COLD_RESYNC = 'cold-resync:start';
export const IPC_COLD_RESYNC_PROGRESS = 'cold-resync:progress';  // send/on
export const IPC_COLD_RESYNC_NEEDED = 'cold-resync:needed';      // send/on

// Startup assessment (send/on from main, invoke/handle for on-demand refresh)
export const IPC_STARTUP_ASSESSMENT = 'startup:assessment';
export const IPC_STARTUP_SERVER_STATUS = 'startup:server-status';
export const IPC_STARTUP_GET_ASSESSMENT = 'startup:get-assessment';

// Selective sync (invoke/handle + progress via send/on)
export const IPC_SYNC_EXECUTE = 'sync:execute';
export const IPC_SYNC_EXECUTE_PROGRESS = 'sync:execute-progress';

// Electron self-update (invoke/handle + send/on for progress)
export const IPC_ELECTRON_UPDATE_CHECK = 'electron-update:check';
export const IPC_ELECTRON_UPDATE_DOWNLOAD = 'electron-update:download';
export const IPC_ELECTRON_UPDATE_APPLY = 'electron-update:apply';
export const IPC_ELECTRON_UPDATE_PROGRESS = 'electron-update:progress';  // send/on

// General
export const IPC_GET_APP_VERSION = 'get-app-version';
export const IPC_QUIT = 'quit';
export const IPC_RELAUNCH = 'relaunch-app';
export const IPC_OPEN_EXTERNAL = 'open-external';
export const IPC_OPEN_APP_URL = 'open-app-url';
