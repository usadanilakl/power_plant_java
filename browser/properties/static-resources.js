// Get the URL of the current script
const currentScriptUrl = document.currentScript && document.currentScript.src;

// Extract the path (without the filename) from the URL
const currentPath = currentScriptUrl ? new URL(currentScriptUrl).pathname.replace(/\/[^\/]+$/, '') : '';

// Go up two levels from the current path
const twoLevelsUp = currentPath.split('/').slice(0, -2).join('/') || '/';

const properties = {
    directories : {
        'propertiesPath': currentPath,
        'mainProjectRoot': twoLevelsUp,
        'filesPath': `${twoLevelsUp}/uploads`,
    },

    serverUrl : 'http://localhost:8082'
}
