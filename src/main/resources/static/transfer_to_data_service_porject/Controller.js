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
    return data;
}

async function createEquipmentFromLotoPoint(data){
    const resp = await fetch(`/api/point-by-point/create-from-loto-point`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="_csrf"]').getAttribute('content')
        },
        body: JSON.stringify(data)
    });
    if (!resp.ok) throw new Error('Failed to create equipment from LOTO point');
    return resp.json();
}

async function updateEquipment(eqId, newTagNumber, newDescription){
    const resp = await fetch(`/api/point-by-point/update-equipment`,{
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="_csrf"]').getAttribute('content')
        },
        body: JSON.stringify({tagNumber: newTagNumber, description: newDescription, id:eqId})
    });
    if (!resp.ok) throw new Error('Failed to update equipment');
    return resp.json();
}

async function copyEquipmentToOtherUnit(eqId){
    const resp = await fetch(`/api/point-by-point/copy-to-other-unit/${eqId}`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="_csrf"]').getAttribute('content')
        },
        body: JSON.stringify({id:eqId})
    });
    if (!resp.ok) throw new Error('Failed to copy equipment to other unit');
    return resp.json();
}

async function updateFile(eqId, fileId){
    const resp = await fetch(`/api/point-by-point/update-file`,{
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="_csrf"]').getAttribute('content')
        },
        body: JSON.stringify({eqId:eqId, fileId: fileId})
    });
    if (!resp.ok) throw new Error('Failed to update file');
    return resp.json();
}