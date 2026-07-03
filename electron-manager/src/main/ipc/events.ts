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
export const IPC_GATE_LOG_GET_CONTRACTOR_DIRECTORY = 'gate-log:get-contractor-directory';
// Gate Log broadcasts (send/on)
export const IPC_GATE_LOG_PEOPLE_UPDATED = 'gate-log:people-updated';

// Contractors (invoke/handle)
export const IPC_CONTRACTORS_GET_LIVE = 'contractors:get-live';
export const IPC_CONTRACTORS_PUSH_TO_BACKEND = 'contractors:push-to-backend';
export const IPC_CONTRACTORS_SCAN = 'contractors:scan';
export const IPC_CONTRACTORS_LIST_REPORTS = 'contractors:list-reports';
export const IPC_CONTRACTORS_ACCEPT_REPORT = 'contractors:accept-report';
export const IPC_CONTRACTORS_REJECT_REPORT = 'contractors:reject-report';

// WebView AMS — Excel report scraper (invoke/handle)
export const IPC_WEBVIEW_AMS_GET_REPORTS = 'webview-ams:get-reports';
export const IPC_WEBVIEW_AMS_GET_STATUS = 'webview-ams:get-status';
export const IPC_WEBVIEW_AMS_REFRESH = 'webview-ams:refresh';
export const IPC_WEBVIEW_AMS_GET_CONFIG = 'webview-ams:get-config';
export const IPC_WEBVIEW_AMS_SAVE_CONFIG = 'webview-ams:save-config';
export const IPC_WEBVIEW_AMS_SET_AUTO_REFRESH = 'webview-ams:set-auto-refresh';
export const IPC_WEBVIEW_AMS_WIRED_GET = 'webview-ams:wired-get';
export const IPC_WEBVIEW_AMS_WIRED_ADD = 'webview-ams:wired-add';
export const IPC_WEBVIEW_AMS_WIRED_REMOVE = 'webview-ams:wired-remove';
export const IPC_WEBVIEW_AMS_HISTORY_LIST = 'webview-ams:history-list';
export const IPC_WEBVIEW_AMS_HISTORY_GET = 'webview-ams:history-get';
// WebView AMS broadcasts (send/on)
export const IPC_WEBVIEW_AMS_UPDATED = 'webview-ams:updated';

// SDS eBinder scraper (invoke/handle)
export const IPC_SDS_SCRAPE_RUN = 'sds-scrape:run';
export const IPC_SDS_GAP_REPORT = 'sds-scrape:gap-report';
export const IPC_SDS_SCRAPE_ABORT = 'sds-scrape:abort';
export const IPC_SDS_MATCH_CHEMICAL = 'sds-scrape:match-chemical';
export const IPC_SDS_EMAIL_GAP_REPORT = 'sds-scrape:email-gap-report';
export const IPC_SDS_GET_EMAIL_RECIPIENTS = 'sds-scrape:get-email-recipients';
export const IPC_SDS_CLEAR_PDFS = 'sds-scrape:clear-pdfs';
export const IPC_SDS_SCRAPE_GET_STATUS = 'sds-scrape:get-status';
export const IPC_SDS_SCRAPE_GET_CONFIG = 'sds-scrape:get-config';
export const IPC_SDS_SCRAPE_SAVE_CONFIG = 'sds-scrape:save-config';

// Weather (invoke/handle + send/on)
export const IPC_WEATHER_GET_STATUS = 'weather:get-status';
export const IPC_WEATHER_REFRESH = 'weather:refresh';
export const IPC_WEATHER_SET_INTERVAL = 'weather:set-interval';
export const IPC_WEATHER_STATUS = 'weather:status';
export const IPC_WEATHER_GET_FORECAST = 'weather:get-forecast';
export const IPC_WEATHER_REFRESH_FORECAST = 'weather:refresh-forecast';
export const IPC_WEATHER_FORECAST = 'weather:forecast';   // send/on broadcast

// Perry Weather (invoke/handle + send/on)
export const IPC_PERRY_GET_STATUS = 'perry:get-status';
export const IPC_PERRY_REFRESH = 'perry:refresh';
export const IPC_PERRY_SET_INTERVAL = 'perry:set-interval';
export const IPC_PERRY_STATUS = 'perry:status';             // send/on broadcast

// PJM (invoke/handle + send/on)
export const IPC_PJM_GET_STATUS = 'pjm:get-status';
export const IPC_PJM_SHOW_WINDOW = 'pjm:show-window';
export const IPC_PJM_SET_POLLING = 'pjm:set-polling';
export const IPC_PJM_REFRESH = 'pjm:refresh';
export const IPC_PJM_GET_CONFIG = 'pjm:get-config';
export const IPC_PJM_SAVE_CONFIG = 'pjm:save-config';
export const IPC_PJM_STATUS = 'pjm:status';
// PJM Day-Ahead Awards (invoke/handle — read-only, data from SharePoint)
export const IPC_PJM_DA_FETCH = 'pjm:da-fetch';
export const IPC_PJM_DA_REFRESH = 'pjm:da-refresh';

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
export const IPC_SYNC_ENTITY_UPDATED = 'sync:entity-updated';  // broadcast: entity changed via sync

// Electron self-update (invoke/handle + send/on for progress)
export const IPC_ELECTRON_UPDATE_CHECK = 'electron-update:check';
export const IPC_ELECTRON_UPDATE_DOWNLOAD = 'electron-update:download';
export const IPC_ELECTRON_UPDATE_APPLY = 'electron-update:apply';
export const IPC_ELECTRON_UPDATE_PROGRESS = 'electron-update:progress';  // send/on

// Permits (invoke/handle)
export const IPC_WORK_REQUEST_COUNT = 'permits:work-request-count';
export const IPC_PERMITS_OPEN_MONITOR = 'permits:open-monitor';

// Maximo bundles (invoke/handle)
export const IPC_MAXIMO_LEAD_OP_SUMMARY = 'maximo:lead-op-summary';
export const IPC_MAXIMO_OVERVIEW = 'maximo:overview';
export const IPC_MAXIMO_GET_OVERVIEW_CONFIG = 'maximo:get-overview-config';
export const IPC_MAXIMO_SAVE_OVERVIEW_CONFIG = 'maximo:save-overview-config';
export const IPC_MAXIMO_LABOR_PEOPLE = 'maximo:labor-people';

// Window Layout (invoke/handle)
export const IPC_LAYOUT_SAVE = 'layout:save';

// Menu (invoke/handle + send/on)
export const IPC_MENU_POPUP = 'menu:popup';
export const IPC_MENU_NAVIGATE = 'menu:navigate';   // send/on (main -> renderer)

// Print (invoke/handle)
export const IPC_PRINT_CURRENT_PAGE = 'print:current-page';
export const IPC_PRINT_HTML = 'print:html';
export const IPC_PRINT_WITH_PREVIEW = 'print:with-preview';

// Vosk STT (invoke/handle + send/on)
export const IPC_VOSK_START = 'vosk:start';
export const IPC_VOSK_STOP = 'vosk:stop';
export const IPC_VOSK_GET_STATUS = 'vosk:get-status';
export const IPC_VOSK_AUDIO_CHUNK = 'vosk:audio-chunk';    // send/on (one-way, renderer -> main)
export const IPC_VOSK_RESULT = 'vosk:result';              // send/on (main -> renderer)
export const IPC_VOSK_ERROR = 'vosk:error';                // send/on (main -> renderer)

// TOI/TMOD (invoke/handle)
export const IPC_TOI_LIST_FILES = 'toi:list-files';

// Personnel / Schedule (invoke/handle)
export const IPC_PERSONNEL_GET_STATUS = 'personnel:get-status';
export const IPC_PERSONNEL_REFRESH = 'personnel:refresh';
export const IPC_PERSONNEL_GET_CONTACTS = 'personnel:get-contacts';

// General
export const IPC_GET_APP_VERSION = 'get-app-version';
export const IPC_QUIT = 'quit';
export const IPC_RELAUNCH = 'relaunch-app';
export const IPC_OPEN_EXTERNAL = 'open-external';
export const IPC_OPEN_APP_URL = 'open-app-url';
