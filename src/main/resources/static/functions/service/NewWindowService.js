let windowId = 1;
let zIndexOfWindows = 100;

function openNewWindow(getData){
    new Promise((res,rej)=>{

    console.log('creating a new window')
    let all = document.getElementById('all');
    let newWindow = document.createElement('div');
    newWindow.classList.add('newWindow');
    newWindow.setAttribute('id','windowNo'+ windowId++);
    all.appendChild(newWindow);
    // let newContainer = document.createElement('div');
    // newContainer.setAttribute('id','container#'+windowId);


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

    pidText.addEventListener('mouseover',(event)=>{event.preventDefault()})

    close.addEventListener('click', ()=>{
        all.removeChild(newWindow);
    })
    
    rbc.addEventListener('mousedown',()=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        resizeRBC(event,newWindow);
    });
    
    lbc.addEventListener('mousedown',()=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        resizeLBC(event,newWindow);
    });
    
    ruc.addEventListener('mousedown',()=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        resizeRUC(event,newWindow);
    });
    
    luc.addEventListener('mousedown',()=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        resizeLUC(event,newWindow);
    });

    move.addEventListener('mousedown',()=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        relocate(event,newWindow);
        bringOnTop(newWindow);
        //console.log("HEllo")
    });

    newWindow.addEventListener('click',()=>{bringOnTop(newWindow)});
    let p = document.createElement('p');
    newWindow.appendChild(p);
    res(p);
    // res(newWindow.getAttribute('id'));

}).then(id=>{loadDataIntoContainer(id,getData);})
    

    // return newWindow;
}

function bringOnTop(element){
    zIndexOfWindows++;
    element.style.zIndex=zIndexOfWindows+'';
    // let allWindows = document.querySelectorAll('.newWindow');
    // allWindows.forEach(e=>{e.classList.remove('bringOnTop')});
    // element.classList.add('bringOnTop');
}

async function getData(){
    const response = await fetch('/test/get-hello');
    const data = await response.text();
    console.log(data);
    return data;
}



