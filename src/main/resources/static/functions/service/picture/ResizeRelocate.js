import EqRepo from "../../repository/EqRepo.js";
import HighlightRepo from "../../repository/picture/HighlightRepo.js";
import CoordinateCalculator from "./CoordinateCalculator.js";

class ResizeRelocate{

    static zoomPicture(){

        let size = picture.getBoundingClientRect();
        let startW = picture.offsetWidth; // get current width of picture
        let startH = picture.offsetHeight;
        let correction = window.innerWidth*0.028
        correction = 0 //to turn off correction (it was caused by menu, now they overlap and no need for correction)
        
        //finding the original spot where mosue is pointed before zooming
        let areaX = event.clientX - size.left;
        let areaY = event.clientY - size.top;
        
        // get new spot on the picture where mouse is currently pointing at
        let newAreaX = event.clientX - size.left; 
        let newAreaY = event.clientY - size.top;
        
        //find original picture position
        let startPictureX = picture.offsetLeft;
        let startPictureY = picture.offsetTop;
        
        let width = picture.offsetWidth;
        let scale = width;
        
        let zoomIn = 1.2;
        let zoomOut = 0.8;
        
        //scroll in
        if (event.deltaY < 0 && startW/window.innerWidth < 25) {
            scale *= zoomIn;
            areaX = areaX*zoomIn-correction; //this is X of where mosue was pointed before zooming
            areaY *= zoomIn; //this is Y of where mosue was pointed before zooming
            
                
        //scroll out   
        }else if(event.deltaY>0 && startW/window.innerWidth>0.2){
            scale *=zoomOut;
            areaX = areaX*zoomOut+correction; //this is X of where mosue was pointed before zooming
            areaY *= zoomOut; //this is Y of where mosue was pointed before zooming
            
        }
            // Apply the new scale to the picture
            picture.style.width = scale + 'px';
            event.preventDefault();
            let newPictureX = newAreaX - areaX + startPictureX;
            let newPictureY = newAreaY - areaY + startPictureY;
        
            picture.style.left = `${newPictureX}px`;
            picture.style.top = `${newPictureY}px`;
            ResizeRelocate.resizeAreas(); 
            ResizeRelocate.resizeHighlights(); 
            //resizeManualHighlites(); 
        
    }

    static resizeAreas(){
        const rect = picture.getBoundingClientRect();
        const width = rect.width;
        const coefficient = width/EqRepo.OLD_WIDTH;
        let allAreas = document.querySelectorAll(".ar");
    
        allAreas.forEach(e=>{
            let coord = e.getAttribute('coords').split(",");
            for(let i = 0; i<coord.length; i++){
                coord[i] = coord[i]*coefficient;
            }
            e.setAttribute('coords', ""+coord.join(","));
        });
    
        EqRepo.OLD_WIDTH = width;
    }

    static resizeHighlights(){
        let allHighlites = document.querySelectorAll('.areaHighlights');
        allHighlites.forEach(e=>{
            let area = document.getElementById(e.getAttribute('id').slice(0,-1));
           e.style.top = CoordinateCalculator.areaStringToXywhObject(area).y; 
           e.style.left = CoordinateCalculator.areaStringToXywhObject(area).x;
           e.style.width = CoordinateCalculator.areaStringToXywhObject(area).w;
           e.style.height = CoordinateCalculator.areaStringToXywhObject(area).h;
        })
    }

    static relocateHighlightsWithPicture(event){
        //let allHighlights = [...activeHighlights];
    
        let highlightPosition = [];
        HighlightRepo.ACTIVE_HIGHLIGHTS.forEach(e=>{
            highlightPosition.push({top:e.offsetTop, left:e.offsetLeft}); // get current position of each highlight
        });
        
        let picPosition = {top:picture.offsetTop, left:picture.offsetLeft} // get current position of picture
    
        let startX = event.clientX; // get current position of mouse
        let startY = event.clientY;
    
        const handleMouseMove = (event) =>{
            let changeX = startX-event.clientX;
            let changeY = startY-event.clientY;
    
            let i = 0;
            HighlightRepo.ACTIVE_HIGHLIGHTS.forEach(e=>{
                e.style.top = highlightPosition[i].top - changeY + 'px';
                e.style.left = highlightPosition[i].left - changeX + 'px';
                i++;
            });
    
            picture.style.top = picPosition.top - changeY + "px";
            picture.style.left = picPosition.left - changeX + "px";
    
        }
    
        const handleMouseUp = ()=>{
            document.removeEventListener('mousemove', handleMouseMove);
        }
    
        document.addEventListener('mousemove',handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    
    
    }

    static resizeWidth(event, element){
        let size ={
        startX : 0,
        startY : 0,
        oldWitdth:0,
        } 
    
        size.startX = event.clientX;
        size.startY = event.clientY;
        size.oldWitdth = element.offsetWidth;
        //console.log(size.startX);
    
    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        }
    
    const handleMouseMove = (event)=>{
        event.preventDefault();
        let change = event.clientX-size.startX;
        element.style.width = size.oldWitdth+change + 'px';
        //console.log(element.offsetWidth)
    }
        document.addEventListener('mousemove',handleMouseMove);
        document.addEventListener('mouseup',handleMouseUp);
    
    }
    
    static resizeWidthOfMultipleElements(event, elements){
        let size ={
        startX : 0,
        startY : 0,
        oldWitdth:0,
        left : 0
        } 
        let change = 0;
    
        size.startX = event.clientX;
        size.startY = event.clientY;
        size.oldWitdth = elements[0].offsetWidth;
        size.left = elements[0].offsetLeft;
        //console.log(size.startX);
    
    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        for(let i = 1; i<elements.length; i++) {
            elements[i].style.width = size.oldWitdth+change + 'px'
            elements[i].style.left = size.left + 'px'
        }
        }
    
    const handleMouseMove = (event)=>{
        event.preventDefault();
        change = event.clientX-size.startX;
        elements[0].style.width = size.oldWitdth+change + 'px'
        elements[0].style.left = size.left + 'px'
        
        //console.log(element.offsetWidth)
    }
        document.addEventListener('mousemove',handleMouseMove);
        document.addEventListener('mouseup',handleMouseUp);
    
    }
    
    static resizeRBC(event, element){
        let size ={
        startX : event.clientX,
        startY : event.clientY,
        oldWitdth:element.offsetWidth,
        oldHeight:element.offsetHeight,
        elX : element.offsetLeft,
        elY : element.offsetTop,
        } 
    
    
    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        }
    
    const handleMouseMove = (event)=>{
        event.preventDefault();
        let changeX = event.clientX-size.startX;
        let changeY = event.clientY-size.startY;
        element.style.top = size.elY + 'px';
        element.style.left = size.elX + 'px';
        element.style.width = size.oldWitdth+changeX + 'px';
        element.style.height = size.oldHeight+changeY + 'px';
        //console.log(element.offsetWidth)
    }
        document.addEventListener('mousemove',handleMouseMove);
        document.addEventListener('mouseup',handleMouseUp);
    
    }
    
    static resizeLBC(event, element){
        let screen = document.getElementById('all');
        let size ={
        startX : event.clientX,
        startY : event.clientY,
        oldWitdth:element.offsetWidth,
        oldHeight:element.offsetHeight,
        elLeft : element.offsetLeft,
        elTop : element.offsetTop,
        elRight : screen.offsetWidth - element.offsetWidth - element.offsetLeft,
        elBottom : screen.offsetHeight - element.offsetHeight - element.offsetTop,
        } 
    
        //console.log(size.elRight);
    
    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        }
    
    const handleMouseMove = (event)=>{
        event.preventDefault();
        let changeX = event.clientX-size.startX;
        let changeY = event.clientY-size.startY;
        element.style.left = '';
        element.style.top = size.elTop + 'px';
        element.style.right = size.elRight + 'px';
        element.style.width = size.oldWitdth-changeX + 'px';
        element.style.height = size.oldHeight+changeY + 'px';
    
        //console.log(element.offsetWidth)
    }
        document.addEventListener('mousemove',handleMouseMove);
        document.addEventListener('mouseup',handleMouseUp);
    
    }
    
    static resizeLUC(event, element){
        let screen = document.getElementById('all');
        let size ={
        startX : event.clientX,
        startY : event.clientY,
        oldWitdth:element.offsetWidth,
        oldHeight:element.offsetHeight,
        elLeft : element.offsetLeft,
        elTop : element.offsetTop,
        elRight : screen.offsetWidth - element.offsetWidth - element.offsetLeft,
        elBottom : screen.offsetHeight - element.offsetHeight - element.offsetTop,
        } 
    
        console.log(size.elRight);
    
    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        }
    
    const handleMouseMove = (event)=>{
        //event.preventDefault();
        let changeX = event.clientX-size.startX;
        let changeY = event.clientY-size.startY;
        element.style.left = size.elLeft+changeX + 'px';
        element.style.top = size.elTop + changeY + 'px';
        element.style.width = size.oldWitdth-changeX + 'px';
        element.style.height = size.oldHeight-changeY + 'px';
    
        
    
        //console.log(element.offsetWidth)
    }
        document.addEventListener('mousemove',handleMouseMove);
        document.addEventListener('mouseup',handleMouseUp);
    
    }
    
    static resizeRUC(event, element){
        let screen = document.getElementById('all');
        let size ={
        startX : event.clientX,
        startY : event.clientY,
        oldWitdth: element.offsetWidth,
        oldHeight: element.offsetHeight,
        elLeft : element.offsetLeft,
        elTop : element.offsetTop,
        elRight : screen.offsetWidth - element.offsetWidth - element.offsetLeft,
        elBottom : screen.offsetHeight - element.offsetHeight - element.offsetTop,
        } 
    
        //console.log(size.elBottom);
    
        const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        }
    
        const handleMouseMove = (event)=>{
        //event.preventDefault();
        let changeX = event.clientX-size.startX;
        let changeY = event.clientY-size.startY;
        
        element.style.top = size.elTop + changeY + 'px';
        element.style.left = size.elLeft + 'px';
        element.style.width = size.oldWitdth+changeX + 'px';
        element.style.height = size.oldHeight-changeY + 'px';
    
        //console.log(element.offsetWidth)
    }
        document.addEventListener('mousemove',handleMouseMove);
        document.addEventListener('mouseup',handleMouseUp);
    
    }
    
    static relocate(event,element){
        let w = element.offsetWidth;
        let position = {
            startX : event.clientX,
            startY : event.clientY,
            elX : element.offsetLeft,
            elY : element.offsetTop,
        }
    
    
        const handleMouseMove = (event) =>{
            let changeX = position.startX-event.clientX;
            let changeY = position.startY-event.clientY;
            element.style.top = position.elY-changeY + 'px';
            element.style.left = position.elX-changeX + 'px';
            element.style.width = w+'px';
        }
    
        const handleMouseUp = ()=>{
            document.removeEventListener('mousemove', handleMouseMove);
        }
    
        document.addEventListener('mousemove',handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
    
    static initResize(elementContainer, hide){
        createResizeElements(elementContainer, hide);
    
        elementContainer.querySelector('.rbc').addEventListener('mousedown',()=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            resizeRBC(event,elementContainer);
        });
    
        elementContainer.querySelector('.lbc').addEventListener('mousedown',()=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            resizeLBC(event,elementContainer);
        });
    
        elementContainer.querySelector('.ruc').addEventListener('mousedown',()=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            resizeRUC(event,elementContainer);
        });
    
        elementContainer.querySelector('.luc').addEventListener('mousedown',()=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            resizeLUC(event,elementContainer);
        });
    
        elementContainer.querySelector('.grab').addEventListener('mousedown',()=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            relocate(event,elementContainer);
        });
    }
    
    static createResizeElements(containerElement, hide){
        let luc = document.createElement('div');
        let ruc = document.createElement('div');
        let rbc = document.createElement('div');
        let lbc = document.createElement('div');
        let grab = document.createElement('div');
    
        luc.classList.add('corners');
        ruc.classList.add('corners');
        rbc.classList.add('corners');
        lbc.classList.add('corners');
        grab.classList.add('corners');
    
        // luc.setAttribute('id','luc');
        // ruc.setAttribute('id','ruc');
        // rbc.setAttribute('id','rbc');
        // lbc.setAttribute('id','lbc');
        // grab.setAttribute('id','grab');
    
        luc.classList.add('luc');
        ruc.classList.add('ruc');
        rbc.classList.add('rbc');
        lbc.classList.add('lbc');
        grab.classList.add('grab');
    
        containerElement.appendChild(luc)
        containerElement.appendChild(ruc)
        containerElement.appendChild(rbc)
        containerElement.appendChild(lbc)
        containerElement.appendChild(grab)
    
        if(hide){
            luc.classList.add('hide');
            ruc.classList.add('hide');
            rbc.classList.add('hide');
            lbc.classList.add('hide');
            grab.classList.add('hide');
        }
    }
    
    static deleteResizeElements(containerElement){
       let corners = containerElement.querySelectorAll('.corners');
       for(let e of corners){
        containerElement.removeChild(e);
       }
    }
    
    static createHintWindow(){
        //info window
        let div = document.createElement('div');
        div.setAttribute('id','hintDiv');
        let text = document.createElement('p');
        div.style.display = 'none';
        div.style.position = 'absolute';
        div.style.backgroundColor = 'blue';
    
        let positionChanger = (event)=>{
            div.style.top = event.clientY+50 + 'px';
            div.style.left = event.clientX + 'px';
        }
        let info = document.getElementById('infoFrame');
        let infoMover = document.getElementById('infoMover');
    
        info.addEventListener('mouseenter',()=>{
            div.style.display = 'block';
            text.innerHTML = "";
            text.textContent = 'Left-click to copy text';
            text.setAttribute('id','hint');
            div.appendChild(text);
            document.getElementById('all').appendChild(div);
            div.style.zIndex = '23';
            document.addEventListener('mousemove', positionChanger);
        });
    
        info.addEventListener('mouseleave',()=>{
            div.style.display = 'none';
            document.removeEventListener('mousemobe', positionChanger)
        })
    
        infoMover.addEventListener('mousedown',()=>{
            event.preventDefault();
            relocate(event,info);
        });
    }
    
    static hideAllResizeElements(){
        let allControls = document.querySelectorAll('.corners');
        allControls.forEach(e=>{
            e.classList.add('hide');
        })
    }
    
    static showAllResizeElements(){
        let allControls = document.querySelectorAll('.corners');
        allControls.forEach(e=>{
            e.classList.remove('hide');
        })
    }
}
export default ResizeRelocate;