import GlobalVariables from './global/GlobalVariables.js';
import FileService from './service/file/FileService.js';

class Main{
    fileService = new FileService();
    
    async init(){
        console.log("Main is running")
        GlobalVariables.token = document.getElementById('token').getAttribute('content');
        let files = await this.fileService.setFiles();

        let menu = this.fileService.setFileDropdownMenu();
        // console.log(menu);
        // document.body.appendChild(menu);



    }

    
}


document.addEventListener('DOMContentLoaded',async (event)=>{

await new Main().init();

 })