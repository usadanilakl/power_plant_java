import FileController from "../../controllers/file/FileController.js";
import FileMenu from "../../dom/file/FileMenu.js";
import FileRepo from "../../repository/FileRepo.js";

class FileService{
    fileController = new FileController();
    static fileMenu = new FileMenu();
/**************************************************************************************************************
 *Server Data Handling
 *************************************************************************************************************/

 static async getFile(id){return this.fileController.getFile(id);}
 static async updateFile(file){return this.fileController.patchFile(file);}

/**************************************************************************************************************
 *Set file data in memory
 *************************************************************************************************************/

    static async setFiles(){
        FileRepo.ALL_FILES = await this.fileController.getAllFiles();
        return FileRepo.ALL_FILES;
    }
    static async setFileCategories(){
        FileRepo.FILE_CATEGORIES = await this.fileController.getFileCategories();
        return FileRepo.FILE_CATEGORIES;
    }
    static async setFileVendors(){
        FileRepo.FILE_VENDORS = await this.fileController.getFileVendors();
        return FileRepo.FILE_VENDORS;
    }
    static async setFileSystems(){
        FileRepo.FILE_SYSTEMS = await this.fileController.getFileSystems();
        return FileRepo.FILE_SYSTEMS;
    }

/**************************************************************************************************************
 *Build File Dropdown menu
 *************************************************************************************************************/

    static setUpCategories(){
        
        let result = [...FileRepo.FILE_CATEGORIES]
        result.forEach(e=>{
            e['getContent'] = function(){
                if(e.value.toLowerCase().includes("vendor"))return FileService.setUpVendors();
                else if(e.value.toLowerCase().includes("system"))return FileService.setUpSystems();
                // else if(e.value.toLowerCase().includes("heat trace"))return heatTrace;
                // else if(e.value.toLowerCase().includes("electrical"))return electircal;
            }
            e['dropdownFunc'] = function(event){
                let list = event.target.querySelector('ul');
                event.stopPropagation();
                if(list!=null) event.target.removeChild(list);
                else FileService.fileMenu.dropdownMenu(e.getContent(e.value),[],[], event.target);
            }.bind(e) 
        })
        result.forEach(e=>e.itemText = e.value)
        return result;
    }

    static setUpVendors(){
        let vendors = [];
        FileRepo.FILE_VENDORS.forEach(e=>{
            let i = {
                'itemText': e,
                'getContent': function() {
                return FileService.setUpFilesByVendor(e);
                }
            };
            i.dropdownFunc = function(event) {
                let list = event.target.querySelector('ul');
                event.stopPropagation();
                if(list!=null) event.target.removeChild(list);
                else FileService.fileMenu.dropdownMenu(this.getContent(),[{'data-file-name':'name'},{'data-file-number':'fileNumber'},{'data-object-type':'objectType'}],[], event.target);
            }.bind(i);
            vendors.push(i);
        });
        return vendors;
    }

    static setUpSystems(){
        let systems = [];
        FileRepo.FILE_SYSTEMS.forEach(e=>{
            let i = {
                'itemText': e,
                'getContent': function() {
                return FileService.setUpFilesBySystem(e);
                }
            };
            i.dropdownFunc = function(event) {
                let list = event.target.querySelector('ul');
                event.stopPropagation();
                if(list!=null) event.target.removeChild(list);
                else FileService.fileMenu.dropdownMenu(this.getContent(),[{'data-file-name':'name'},{'data-file-number':'fileNumber'},{'data-object-type':'objectType'}],[], event.target);
            }.bind(i);
            systems.push(i);
        });
        return systems;
    }

    static setUpFilesByVendor(vendor){
        let result =  FileRepo.getFilesByVendor(vendor,'PID');
        result.forEach(e=>{
            e['dropdownFunc'] = function(){FileService.loadPictureWithLightFile(e);} 
            e.itemText = e.fileNumber;
        })
        return result;
    }

    static setUpFilesBySystem(system){
        let result =  FileRepo.ALL_FILES.filter(e=>e.relatedSystems.includes(system));
        result.forEach(e=>{
            e['dropdownFunc'] = function(){FileService.loadPictureWithLightFile(e);} 
            e.itemText = e.fileNumber;
        })
        return result;
    }

    setFileDropdownMenu(){
        FileService.fileMenu.dropdownMenu(FileService.setUpCategories(),[{'data-file-id':'id'}],['custom-class'],document.body);
    }

    static toggleFileButtonContent(){
        let buttons = document.querySelectorAll('[data-object-type="FileObject"]');
        buttons.forEach(e=>{
           if(e.textContent===e.getAttribute('data-file-name')) e.textContent = e.getAttribute('data-file-number');
           else e.textContent = e.getAttribute('data-file-name');
        })
    }

    /**************************************************************************************************************
     *Display File
     *************************************************************************************************************/
    
    static async loadPictureWithLightFile(file){
        FileRepo.LIGHT_FILE = {...file};
        picture.setAttribute('src','/'+file.fileLink);
        picture.onerror = async function() {
            console.log('Image not found. Running fallback function.');
            await getPdfAndConvertToJpg(file.id);
            picture.setAttribute('src','/'+file.fileLink)
        };
        picture.setAttribute('data-file-id', file.id);
        removeAllHighlights();
        FileRepo.FILE_WITH_POINTS = await getFileFromDbByLink(file.fileNumber);
        setAreas(fileWithPoints.points);
    }

}

export default FileService;