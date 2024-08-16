import GlobalVariables from './global/GlobalVariables.js';
import FileService from './service/file/FileService.js';

class Main{
    fileService = new FileService();
    
    async init(){
        console.log("Main is running")
        GlobalVariables.token = document.getElementById('token').getAttribute('content');
        let files = await this.fileService.setFiles();
        console.log(files.length);
        console.log(JSON.stringify(files[0]))
    }

    
}


document.addEventListener('DOMContentLoaded',async (event)=>{

await new Main().init();

 })