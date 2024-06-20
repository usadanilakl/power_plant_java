


async function getVendor(vendor){
    return fileRepository.filter(e=>e.fileNumber.includes(vendor));
}





