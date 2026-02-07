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

// Gate Log (invoke/handle)
export const IPC_GATE_LOG_STATUS = 'gate-log:status';
export const IPC_GATE_LOG_PEOPLE = 'gate-log:people';

// Weather (send/on)
export const IPC_WEATHER_STATUS = 'weather:status';

// PJM (send/on)
export const IPC_PJM_STATUS = 'pjm:status';

// Window control
export const IPC_WINDOW_CLOSE = 'window:close';
export const IPC_WINDOW_MINIMIZE = 'window:minimize';
export const IPC_WINDOW_MAXIMIZE = 'window:maximize';

// General
export const IPC_GET_APP_VERSION = 'get-app-version';
export const IPC_QUIT = 'quit';
export const IPC_RELAUNCH = 'relaunch-app';
export const IPC_OPEN_EXTERNAL = 'open-external';
export const IPC_OPEN_APP_URL = 'open-app-url';
