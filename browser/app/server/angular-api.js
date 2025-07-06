const angularApi = {
    navigateToFiles: () => {
        navigateTo(properties.serverUrl+'/app');
    },
    navigateToLotoPoints: () => {
        navigateTo(properties.serverUrl+'/app/loto-points');
    },
    navigateToTags: () => {
        navigateTo(properties.serverUrl+'/app/tag-number');}
};

function navigateTo(path) {
    // Check if the server is available before navigating
    if (isServerRunning) {
        window.location.href = path;
    } else {
        alert('Server is not available. This action cannot be performed at the moment.');
    }
}