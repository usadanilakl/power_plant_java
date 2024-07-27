
function toggleFileButtonContent(){
   let buttons = document.querySelectorAll('[data-object-type="FileObject"]');
   buttons.forEach(e=>{
    if(e.textContent===e.getAttribute('data-file-name')) e.textContent = e.getAttribute('data-file-number');
    else e.textContent = e.getAttribute('data-file-name');
   })
}








 
