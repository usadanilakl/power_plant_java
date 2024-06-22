


function getVendor(vendor){
    return fileRepository.filter(e=>e.fileNumber.includes(vendor));
}
function getFilesByVendor(vendor){
    let result =  fileRepository.filter(e=>e.fileNumber.includes(vendor));
    result.forEach(e=>{
        e['dropdownFunc'] = function(){loadPictureWithAreas("uploads/jpg/P&IDs/"+e.vendor.name+"/"+e.fileNumber+".jpg", e.filePoints);} 
    })
}
function getFilesBySystem(system){
    let result =  fileRepository.filter(e=>e.systems.includes(system));
    result.forEach(e=>{
        e['dropdownFunc'] = loadPictureWithAreas("uploads/jpg/P&IDs/"+e.vendor.name+"/"+e.fileNumber+".jpg", e.filePoints);
    })
}








