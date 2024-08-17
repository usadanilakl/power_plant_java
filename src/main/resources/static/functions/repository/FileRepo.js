class FileRepo{
    static ALL_FILES = [];
    static FILE_CATEGORIES = [];
    static FILE_VENDORS = [];
    static FILE_SYSTEMS = [];
    static LIGHT_FILE = {};
    static FILE_WITH_POINTS = {};

    static getFilesByVendor(vendor, fileType){
        if(fileType)return FileRepo.ALL_FILES.filter(e=>e!==null && e.vendor!==null && e.vendor.name.toLowerCase().includes(vendor.toLowerCase()) && e.fileType.name==='PID');
        return FileRepo.ALL_FILES.filter(e=>e!==null && e.vendor!==null && e.vendor.name.toLowerCase().includes(vendor.toLowerCase()));
    }
    
    static getFilesBySystem(system){
        let result =  FileRepo.ALL_FILES.filter(e=>e.relatedSystems.includes(system));
        return result;
    }



}
export default FileRepo;