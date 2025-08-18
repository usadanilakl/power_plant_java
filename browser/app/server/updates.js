const url = properties.serverUrl;
let isUpdatesAvailable = false;
const updateElements = document.querySelectorAll('.updates-available');
const initUpdateButton = document.getElementById('initUpdateButton');
let popup;

const update = {
    updateAll: async () => {
        try {
            // Show initial update message
            popup = new Popup('Update in progress...', { duration: 0, type: 'info' });
            
            await Promise.all([
                update.updateFiles(),
                update.updateEquipment(),
                update.updateLotoPoints(),
                update.updateHeatTrace(),
                update.updateReferenceData(),
                update.updatePropertiesData(),
                // Add more update functions as needed
            ]);
            
            // Update success message
            popup.updateContent('All updates completed successfully. The page will reload now.');
            console.log('All updates completed successfully');
            
            // Wait for 3 seconds before reloading
            await new Promise(resolve => setTimeout(resolve, 3000));
            window.location.reload();
        } catch (error) {
            // Update failure message
            if (popup) {
                popup.updateContent(`Error during update process: ${error.message}`);
                popup.options.type = 'error';
                // Re-apply styles for error type
                popup.element.style.backgroundColor = '#ffcccc';
                popup.element.style.color = '#cc0000';
            } else {
                new Popup(`Error during update process: ${error.message}`, { duration: 5000, type: 'error' });
            }
            console.error('Error during update process:', error);
        }
    },

    updateFiles: async () => {
        try {
            const response = await fetch(`${url}/backup/update/files`);
            const data = await response.text();
            // Update the file list in the UI
            // updateFilesList(data);
            updateElements.forEach(element => {
                element.classList.add('hidden');
            });
            console.log('Files updated successfully');
            popup.updateContent('Files updated successfully');
            return "Files updated successfully. Updating Equipment data...";
        } catch (error) {
            console.error('Error updating files:', error);
            popup.updateContent(`Error updating files: ${error.message}`);
            return "Error updating files";
        }
    },

    updateEquipment: async () => {
        try {
            const response = await fetch(`${url}/backup/update/equipment`);
            const data = await response.text();
            // Update the equipment list in the UI
            // updateEquipmentList(data);
            updateElements.forEach(element => {
                element.classList.add('hidden');
            });
            console.log('Equipment updated successfully');
            popup.updateContent('Equipment updated successfully');
            return "Equipment updated successfully. Updating Loto Point data...";
        } catch (error) {
            console.error('Error updating equipment:', error);
            popup.updateContent(`Error updating equipment: ${error.message}`);
            return "Error updating equipment";
        }
    },

    updateLotoPoints: async () => {
        try {
            const response = await fetch(`${url}/backup/update/loto-points`);
            const data = await response.text();
            // Update the equipment list in the UI
            // updateEquipmentList(data);
            updateElements.forEach(element => {
                element.classList.add('hidden');
            });
            console.log('Loto Points updated successfully');
            popup.updateContent('Loto Points updated successfully');
            return "Loto Points updated successfully. Updating Heat Trace data...";
        } catch (error) {
            console.error('Error updating equipment:', error);
            popup.updateContent(`Error updating loto points: ${error.message}`);
            return "Error updating equipment";
        }
    },

    updateHeatTrace: async () => {
        try {
            const response = await fetch(`${url}/backup/update/heat-trace`);
            const data = await response.text();
            // Update the equipment list in the UI
            // updateEquipmentList(data);
            updateElements.forEach(element => {
                element.classList.add('hidden');
            });
            console.log('Heat Trace updated successfully');
            popup.updateContent('Heat Trace updated successfully. Updating Reference data...');
            return "Heat Trace updated successfully";
        } catch (error) {
            console.error('Error updating equipment:', error);
            popup.updateContent(`Error updating heat trace: ${error.message}`);
            return "Error updating equipment";
        }
    },

    updateReferenceData: async () => {
        try {
            const response = await fetch(`${url}/backup/update/reference-data`);
            const data = await response.text();
            // Update the equipment list in the UI
            // updateEquipmentList(data);
            updateElements.forEach(element => {
                element.classList.add('hidden');
            });
            console.log('Heat Trace updated successfully');
            popup.updateContent('Reference Data Updated Successfully. Updating Properties data...');
            return "Heat Trace updated successfully";
        } catch (error) {
            console.error('Error updating equipment:', error);
            popup.updateContent(`Error updating heat trace: ${error.message}`);
            return "Error updating equipment";
        }
    },

    updatePropertiesData: async () => {
        try {
            const response = await fetch(`${url}/backup/update/properties-data`);
            const data = await response.text();
            
            popup.updateContent('roperties updated successfully.');
            return "Heat Trace updated successfully";
        } catch (error) {
            console.error('Error updating equipment:', error);
            popup.updateContent(`Error updating heat trace: ${error.message}`);
            return "Error updating equipment";
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