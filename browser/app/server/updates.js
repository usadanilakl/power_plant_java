const url = properties.serverUrl;
let isUpdatesAvailable = false;
const updateElements = document.querySelectorAll('.updates-available');
const initUpdateButton = document.getElementById('initUpdateButton');

const update = {
    updateAll: async () => {
        try {
            await Promise.all([
                update.updateFiles(),
                update.updateEquipment(),
                update.updateLotoPoints(),
                // Add more update functions as needed
            ]);
            console.log('All updates completed successfully');
        } catch (error) {
            console.error('Error during update process:', error);
        }
    },

    updateFiles: async () => {
        try {
            const response = await fetch(`${url}/backup/update/files`);
            const data = await response.json();
            // Update the file list in the UI
            // updateFilesList(data);
            updateElements.forEach(element => {
                element.classList.add('hidden');
            });
            console.log('Files updated successfully');
        } catch (error) {
            console.error('Error updating files:', error);
        }
    },

    updateEquipment: async () => {
        try {
            const response = await fetch(`${url}/backup/update/equipment`);
            const data = await response.json();
            // Update the equipment list in the UI
            // updateEquipmentList(data);
            updateElements.forEach(element => {
                element.classList.add('hidden');
            });
            console.log('Equipment updated successfully');
        } catch (error) {
            console.error('Error updating equipment:', error);
        }
    },

    updateLotoPoints: async () => {
        try {
            const response = await fetch(`${url}/backup/update/loto-points`);
            const data = await response.json();
            // Update the equipment list in the UI
            // updateEquipmentList(data);
            updateElements.forEach(element => {
                element.classList.add('hidden');
            });
            console.log('Equipment updated successfully');
        } catch (error) {
            console.error('Error updating equipment:', error);
        }
    },

    checkForUpdates : () => {
        fetch(`${url}/backup/update/check`)
           .then(response => response.json())
           .then(data => {
                isUpdatesAvailable = data.hasUpdates;
                console.log('Updates available:', isUpdatesAvailable);
                if(isUpdatesAvailable) {
                    updateElements.forEach(element => {
                        element.classList.remove('hidden');
                    });
                }
        });
        
    }
}