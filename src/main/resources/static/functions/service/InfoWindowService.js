let infoWindows = [];

function newInfoWindow(type){
    let frame = document.createElement('div');
    infoWindowsContainer.appendChild(frame);
    frame.setAttribute('id','infoFrame'+type);
    frame.classList.add('infoFrame');
    let button = document.createElement('button');
    frame.appendChild(button);
    button.setAttribute('id', 'close'+type);
    button.classList.add('close');
    button.textContent = "X";
    button.addEventListener('click',()=>hide(frame));
    let infoWindow = document.createElement('div');
    frame.appendChild(infoWindow);
    infoWindow.setAttribute('id','infoWindow'+type);
    infoWindow.classList.add('infoWindow');
    infoWindow.classList.add('scroll');
    infoWindowResizer(frame,type);
    infoWindows.push(frame);
}

function infoWindowResizer(frame, type){
    initResize(frame,false);
    let grab = frame.querySelector('.grab')
    let p = document.createElement('p');
    p.textContent = type;
    grab.setAttribute('class','move');
    grab.style.top = '0px';
    grab.setAttribute('id','infoMover'+type)
    grab.appendChild(p);
    frame.querySelectorAll('.corners').forEach(e=>{
        e.classList.add(type+'infoWindowCorners');
        e.classList.remove('corners');
})
}

function positionInfoWindowsInline(){
    let lastWindowLeft = 0;
    for(let i = 0; i<infoWindows.length-1; i++){
        lastWindowLeft = infoWindows[i].offsetLeft;
        infoWindows[i+1].style.left = (lastWindowLeft-infoWindows[i+1].offsetWidth)+'px';
        infoWindows[i+1].style.width = (infoWindows[i+1].offsetWidth)+'px';
    }
}

newInfoWindow("Point");
newInfoWindow("Old-LOTO-Points");
document.getElementById('infoWindowOld-LOTO-Points').appendChild(buildPointSearchField());
