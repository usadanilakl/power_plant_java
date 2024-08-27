import GlobalVariables from "../../global/GlobalVariables.js";
import NewWindowService from "../../service/dom/NewWindowService.js";
import ResizeRelocate from "../../service/picture/ResizeRelocate.js";

class NewWindowDom{


    static getEmptyWindow(header, add){

        let newWindow = document.createElement('div');
        newWindow.classList.add('newWindow');
        newWindow.setAttribute('id','windowNo'+ NewWindowService.windowId++);
        if(add) GlobalVariables.ALL.appendChild(newWindow);

        let move = document.createElement('div')
        move.classList.add('moveWindow');
        newWindow.appendChild(move);

        let pidText = document.createElement('p');
        move.appendChild(pidText);
        pidText.setAttribute('id','pidText'+ newWindow.getAttribute('id'));
        pidText.setAttribute('class','pidTextWindow');
        if(header) pidText.textContent = header;
        
        let close = document.createElement('button');
        close.textContent = "X";
        close.classList.add('smallBtn');
        close.classList.add('blue');
        close.classList.add('closeWindow');
        move.appendChild(close);

        let leftResizer = document.createElement('div');
        leftResizer.classList.add('leftResizerWindow');
        newWindow.appendChild(leftResizer);

        let rightResizer = document.createElement('div');
        rightResizer.classList.add('rightResizerWindow');
        newWindow.appendChild(rightResizer);

        let luc = document.createElement('div');
        luc.classList.add('lucWindow');
        leftResizer.appendChild(luc);

        let ruc = document.createElement('div');
        ruc.classList.add('rucWindow');
        rightResizer.appendChild(ruc);

        let lbc = document.createElement('div');
        lbc.classList.add('lbcWindow');
        leftResizer.appendChild(lbc);

        let rbc = document.createElement('div')
        rbc.classList.add('rbcWindow');
        rightResizer.appendChild(rbc);

        close.addEventListener('click', ()=>{
            newWindow.parentElement.removeChild(newWindow);
        })

        rightResizer.addEventListener('mousedown',()=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            ResizeRelocate.resizeWidthRight(event,newWindow);  
        });

        leftResizer.addEventListener('mousedown',()=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            ResizeRelocate.resizeWidthLeft(event,newWindow);  
        });
        
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

    static getEmptyWithdowWithCover(header,add){
        let newWind = NewWindowDom.getEmptyWindow(header);
        let closeBtn = newWind.querySelector('.closeWindow');
        const popupBackground = document.createElement('div');

        newWind.style.borderRadius = '30px';
        newWind.style.backgroundColor = 'white';

        popupBackground.classList.add('popup-background');
        popupBackground.appendChild(newWind);
        closeBtn.addEventListener('click',()=>{popupBackground.parentElement.removeChild(popupBackground);})
        popupBackground.addEventListener('click',()=>{
            if(!newWind.contains(event.target)) popupBackground.parentElement.removeChild(popupBackground);
        })
        if(add) GlobalVariables.ALL.appendChild(popupBackground);
        return popupBackground;
    }


}
export default NewWindowDom;



