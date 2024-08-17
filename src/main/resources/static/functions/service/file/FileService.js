import FileController from "../../controllers/file/FileController.js";
import FileRepo from "../../repository/FileRepo.js";
import FileMenu from "../../dom/menus/FileMenu.js";

class FileService{
    fileController = new FileController();
    fileMenu = new FileMenu();
/**************************************************************************************************************
 *Server Data Handling
 *************************************************************************************************************/

 async getFile(id){return this.fileController.getFile(id);}
 async updateFile(file){return this.fileController.patchFile(file);}

/**************************************************************************************************************
 *Set file data in memory
 *************************************************************************************************************/

    async setFiles(){
        FileRepo.ALL_FILES = await this.fileController.getAllFiles();
        return FileRepo.ALL_FILES;
    }
    async setFileCategories(){
        FileRepo.FILE_CATEGORIES = await this.fileController.getFileCategories();
        return FileRepo.FILE_CATEGORIES;
    }
    async setFileVendors(){
        FileRepo.FILE_VENDORS = await this.fileController.getFileVendors();
        return FileRepo.FILE_VENDORS;
    }
    async setFileSystems(){
        FileRepo.FILE_SYSTEMS = await this.fileController.getFilesystems();
        return FileRepo.FILE_SYSTEMS;
    }

/**************************************************************************************************************
 *Build File Dropdown menu
 *************************************************************************************************************/
    setUpCategories(){
        let result = [...FileRepo.FILE_CATEGORIES]
        result.forEach(e=>{
            e['getContent'] = function(){
                if(e.value.toLowerCase().includes("vendor"))return FileRepo.FILE_VENDORS;
                else if(e.value.toLowerCase().includes("system"))return FileRepo.FILE_SYSTEMS;
                // else if(e.value.toLowerCase().includes("heat trace"))return heatTrace;
                // else if(e.value.toLowerCase().includes("electrical"))return electircal;
            }
            e['dropdownFunc'] = function(event){FileService.fileMenu.dropdownMenu(this.getContent(e.value), event.target);}.bind(this) 
        })
        return result;
    }

    setUpVendors(){
        let vendors = [];
        FileRepo.FILE_VENDORS.forEach(e=>{
            let i = {
                'value': e,
                'getContent': function() {
                return getFilesByVendor(e);
                }
            };
            i.dropdownFunc = function(event) {
                createDropdownItem(this.getContent(), event.target.parentNode);
            }.bind(i);
            vendors.push(i);
        });
        return vendors;
    }

    setUpFilesByVendor(vendor){
        let result =  FileRepo.getFilesByVendor(vendor);
        result.forEach(e=>{
            e['dropdownFunc'] = function(){loadPictureWithLightFile(e);} 
            e.value = e.fileNumber;
        })
        return result;
    }

    setUpFilesBySystem(system){
        let result =  FileRepo.ALL_FILES.filter(e=>e.relatedSystems.includes(system));
        result.forEach(e=>{
            e['dropdownFunc'] = function(){loadPictureWithLightFile(e);} 
            e.value = e.fileNumber;
        })
        return result;
    }

    setFileDropdownMenu(){
        let files = [...FileRepo.ALL_FILES];
        files.filter(e=>e.vendor.name==="Kiewit");
        files.forEach(e=>e.itemText = e.fileNumber);

        return this.fileMenu.dropdownMenu(this.setUpCategories(),[{'data-file-id':'id'}],['custom-class'],document.body);
    }

}

export default FileService;