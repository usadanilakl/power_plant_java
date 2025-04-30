const angularApi = {
    navigateToFiles: () => {
        navigateTo(properties.serverUrl+'/app/pid');
    },
    navigateToEquipment: () => {
        navigateTo(properties.serverUrl+'/app/eq');
    },
};

function navigateTo(path) {
    // Check if the server is available before navigating
    if (isServerRunning) {
        window.location.href = path;
    } else {
        alert('Server is not available. This action cannot be performed at the moment.');
    }
}