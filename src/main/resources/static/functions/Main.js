import GlobalVariables from './global/GlobalVariables.js';
import EqRepo from './repository/EqRepo.js';
import FileService from './service/file/FileService.js';
import AreaService from './service/picture/AreaService.js';

class Main{
    
    async init(){
        console.log("Main is running")
        GlobalVariables.token = document.getElementById('token').getAttribute('content');
        GlobalVariables.PICTURE_CONTAINER = document.getElementById('picture-container');
        GlobalVariables.PICTURE = document.getElementById('picture');
        GlobalVariables.MAP = document.getElementById('map');
        GlobalVariables.LEFT =document.getElementById('left');
        

        await FileService.setFiles();
        await FileService.setFileCategories();
        await FileService.setFileVendors();
        await FileService.setFileSystems();

        FileService.setFileDropdownMenu();

        let button = document.getElementById('toggle-name');
        button.addEventListener('click',()=>{
            FileService.toggleFileButtonContent();
        });

        AreaService.setAreas(EqRepo.getEqList());



    }

    
}


document.addEventListener('DOMContentLoaded',async (event)=>{

await new Main().init();

 })