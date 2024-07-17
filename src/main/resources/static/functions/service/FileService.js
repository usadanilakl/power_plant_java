


function getVendor(vendor){
    return fileRepository.filter(e=>e.fileNumber.includes(vendor));
}
function getFilesByVendor(vendor){
    let result =  fileRepository.filter(e=>e!==null && e.vendor!==null && e.vendor.name.toLowerCase().includes(vendor.toLowerCase()));
    result.forEach(e=>{
        e['dropdownFunc'] = function(){loadPictureWithFile(e);} 
        e.value = e.fileNumber;
    })
    return result;
}
function getFilesBySystem(system){
    let result =  fileRepository.filter(e=>e.systems.includes(system));
    result.forEach(e=>{
        e['dropdownFunc'] = loadPictureWithFile(e);
    })
}








