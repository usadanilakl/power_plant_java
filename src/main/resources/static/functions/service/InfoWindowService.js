async function fillInfoWindow(id){
    let form = await getPointInfoForm(id);
    let infoContainer = document.getElementById('infoWindow');
    infoContainer.innerHTML = "";
    infoContainer.innerHTML = form;
}

function newInfoWindow(){
    
}


initResize(infoFrame,false);
let grab = infoFrame.querySelector('#grab')
let p = document.createElement('p');
p.textContent = "Info";
grab.setAttribute('class','move');
grab.style.top = '0px';
grab.setAttribute('id','infoMover')
grab.appendChild(p);
infoFrame.querySelectorAll('.corners').forEach(e=>{
    e.setAttribute('class', 'infoWindowCorners')
})
