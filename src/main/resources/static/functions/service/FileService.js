


function getVendor(vendor){
    return fileRepository.filter(e=>e.fileNumber.includes(vendor));
}
function getFilesByVendor(vendor){
    console.log(JSON.stringify(fileRepository[0]) + " this is from file repository")
    let result =  fileRepository.filter(e=>e!==null && e.vendor!==null && e.vendor.name.toLowerCase().includes(vendor.toLowerCase()));
    console.log(result.length)
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








