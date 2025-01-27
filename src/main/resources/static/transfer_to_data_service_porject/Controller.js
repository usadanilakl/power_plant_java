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