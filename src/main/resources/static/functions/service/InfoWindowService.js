initResize(infoFrame,false);
let grab = infoFrame.querySelector('#grab')
let p = document.createElement('p');
p.textContent = "Info";
grab.classList.add('move');
grab.style.top = '0px';
grab.setAttribute('id','infoMover')
grab.appendChild(p);
