
function toggleFileButtonContent(){
   let buttons = document.querySelectorAll('[data-object-type="FileObject"]');
   buttons.forEach(e=>{
      if(e.textContent===e.getAttribute('data-file-name')) e.textContent = e.getAttribute('data-file-number');
      else e.textContent = e.getAttribute('data-file-name');
   })
}

async function fileFormSetup(){
   const popup = await getFormPopUp();
   const fileForm = await buildFormForEachField(lightFile,async()=>submitFile(file),null);
   document.body.appendChild(popup);
   popup.querySelector('#insert-html').appendChild(fileForm);
   let myModal = new bootstrap.Modal(document.getElementById('formModal'), {});
   myModal.show();
   popups.push(fileFormSetup)
}