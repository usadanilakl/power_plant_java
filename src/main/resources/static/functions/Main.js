import GlobalVariables from './global/GlobalVariables.js';
import EqRepo from './repository/EqRepo.js';
import FileService from './service/file/FileService.js';
import AreaService from './service/picture/AreaService.js';
import HighlightService from './service/picture/HighlightService.js';
import ResizeRelocate from './service/picture/ResizeRelocate.js';

class Main{
    
    async init(){
        console.log("Main is running")
        GlobalVariables.token = document.getElementById('token').getAttribute('content');
        GlobalVariables.ALL = document.getElementById('all');
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

        

        console.log("Main is done")



    }

    
}


document.addEventListener('DOMContentLoaded',async (event)=>{

await new Main().init();
    console.log('then')
    // AreaService.setAreas(EqRepo.EQ_LIST);
    GlobalVariables.PICTURE_CONTAINER.addEventListener('mousedown',(event)=>{
        if(event.button===0){
            event.preventDefault();
            console.log('mouse down')
            ResizeRelocate.relocateHighlightsWithPicture(event);
        }
    });

    const zoom = ResizeRelocate.zoomPicture.bind(null,picture);
    GlobalVariables.PICTURE_CONTAINER.addEventListener('wheel',zoom);
    document.addEventListener('mousedown',HighlightService.handleMouseDown);
});
