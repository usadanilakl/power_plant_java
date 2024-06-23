function resizeWidth(event, element){
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

function resizeWidthOfMultipleElements(event, elements){
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

function resizeRBC(event, element){
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

function resizeLBC(event, element){
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

function resizeLUC(event, element){
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

function resizeRUC(event, element){
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

function relocate(event,element){
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

function initResize(elementContainer){
    createResizeElements(elementContainer);

    elementContainer.querySelector('#rbc').addEventListener('mousedown',()=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        resizeRBC(event,elementContainer);
    });

    elementContainer.querySelector('#lbc').addEventListener('mousedown',()=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        resizeLBC(event,elementContainer);
    });

    elementContainer.querySelector('#ruc').addEventListener('mousedown',()=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        resizeRUC(event,elementContainer);
    });

    elementContainer.querySelector('#luc').addEventListener('mousedown',()=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        resizeLUC(event,elementContainer);
    });
}

function createResizeElements(containerElement){
    let luc = document.createElement('div');
    let ruc = document.createElement('div');
    let rbc = document.createElement('div');
    let lbc = document.createElement('div');

    luc.classList.add('corners');
    ruc.classList.add('corners');
    rbc.classList.add('corners');
    lbc.classList.add('corners');

    luc.setAttribute('id','luc');
    ruc.setAttribute('id','ruc');
    rbc.setAttribute('id','rbc');
    lbc.setAttribute('id','lbc');

    containerElement.appendChild(luc)
    containerElement.appendChild(ruc)
    containerElement.appendChild(rbc)
    containerElement.appendChild(lbc)
}

function deleteResizeElements(containerElement){
   let corners = containerElement.querySelectorAll('.corners');
   for(let e of corners){
    containerElement.removeChild(e);
   }
}

function createHintWindow(){
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