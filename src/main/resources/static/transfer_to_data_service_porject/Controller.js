async function getNextFileToVerify() {
    try {
        const response = await fetch('/api/file-by-file/next-file-for-verification');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const processedFiles = await response.json();
        return processedFiles;
    } catch (error) {
        console.error('Error fetching processed files for verification:', error);
        throw error; // Re-throw the error for the caller to handle
    }
}

async function getFilesToVerify() {
    try {
        const response = await fetch('/api/point-by-point/files');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const processedFiles = await response.json();
        return processedFiles;
    } catch (error) {
        console.error('Error fetching processed files for verification:', error);
        throw error; // Re-throw the error for the caller to handle
    }
}

async function getFileWithConflictedPoints(fileId) {
    try {
        const response = await fetch(`/api/point-by-point/${fileId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching file with conflicted points:', error);
        throw error; // Re-throw the error for the caller to handle
    }
}

async function getConflict(pointId){
    const resp = await fetch(`/api/point-by-point/conflict/${pointId}`);
    const data = await resp.json();
}