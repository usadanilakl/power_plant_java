import GlobalVariables from './global/GlobalVariables.js';
import FileService from './service/file/FileService.js';

class Main{
    
    async init(){
        console.log("Main is running")
        GlobalVariables.token = document.getElementById('token').getAttribute('content');
        let files = await FileService.setFiles();
        await FileService.setFileCategories();
        await FileService.setFileVendors();
        await FileService.setFileSystems();

        FileService.setFileDropdownMenu();

        let button = document.getElementById('toggle-name');
        button.addEventListener('click',()=>{
            FileService.toggleFileButtonContent();
        })



    }

    
}


document.addEventListener('DOMContentLoaded',async (event)=>{

await new Main().init();

 })