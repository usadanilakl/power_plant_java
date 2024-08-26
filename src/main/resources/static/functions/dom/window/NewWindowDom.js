import GlobalVariables from "../../global/GlobalVariables.js";
import NewWindowService from "../../service/dom/NewWindowService.js";
import ResizeRelocate from "../../service/picture/ResizeRelocate.js";

class NewWindowDom{


    static getEmptyWindow(header){

        let newWindow = document.createElement('div');
        newWindow.classList.add('newWindow');
        newWindow.setAttribute('id','windowNo'+ NewWindowService.windowId++);
        GlobalVariables.ALL.appendChild(newWindow);
        
        let close = document.createElement('button');
        close.classList.add('closeWindow');
        newWindow.appendChild(close);
        close.textContent = "X";

        let luc = document.createElement('div');
        luc.classList.add('lucWindow');
        newWindow.appendChild(luc);

        let ruc = document.createElement('div');
        ruc.classList.add('rucWindow');
        newWindow.appendChild(ruc);

        let lbc = document.createElement('div');
        lbc.classList.add('lbcWindow');
        newWindow.appendChild(lbc);

        let rbc = document.createElement('div')
        rbc.classList.add('rbcWindow');
        newWindow.appendChild(rbc);

        let move = document.createElement('div')
        move.classList.add('moveWindow');
        newWindow.appendChild(move);

        let pidText = document.createElement('p');
        move.appendChild(pidText);
        pidText.setAttribute('id','pidText'+ newWindow.getAttribute('id'));
        pidText.setAttribute('class','pidTextWindow');
        if(header) pidText.textContent = header;

        close.addEventListener('click', ()=>{
            GlobalVariables.ALL.removeChild(newWindow);
        })
        
        rbc.addEventListener('mousedown',()=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            ResizeRelocate.resizeRBC(event,newWindow);
        });
        
        lbc.addEventListener('mousedown',()=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            ResizeRelocate.resizeLBC(event,newWindow);
        });
        
        ruc.addEventListener('mousedown',()=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            ResizeRelocate.resizeRUC(event,newWindow);
        });
        
        luc.addEventListener('mousedown',()=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            ResizeRelocate.resizeLUC(event,newWindow);
        });

        move.addEventListener('mousedown',()=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            ResizeRelocate.relocate(event,newWindow);
            NewWindowService.bringOnTop(newWindow);
        });

        newWindow.addEventListener('click',()=>{NewWindowService.bringOnTop(newWindow)});
        let p = document.createElement('p');
        newWindow.appendChild(p);

        return newWindow;

    }


}
export default NewWindowDom;



