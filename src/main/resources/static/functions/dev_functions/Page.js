let pinMenu = false;
let pinMenuButton = document.getElementById('pin-menu');
let menu = document.getElementById('left');
let upper = document.getElementById('upper');
let lower = document.getElementById('lower');

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

function menuResize(){
    let resizer = document.getElementById('menu-resize');
    let menu = document.getElementById('left');
    resizer.addEventListener('mousedown',()=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        resizeWidth(event, menu);
    });
}

function pinMenueToggle(){
    if(pinMenu===false) {pinMenu = true; menu.classList.remove('hide')}
    else pinMenu = false;
}

function toggleEditMenu(){
    lower.classList.toggle('.hide');
}


pinMenueToggle();
menuResize();
pinMenuButton.onclick = function(){pinMenueToggle()}
pinMenuButton.addEventListener('mouseover',()=>{if(!pinMenu)menu.classList.remove('hide')});
menu.addEventListener('mouseleave',()=>{if(!pinMenu)menu.classList.add('hide')});