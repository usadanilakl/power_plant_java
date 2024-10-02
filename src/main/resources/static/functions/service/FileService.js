
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

async function fileFormSetup2(file){
   const popup = await getFormPopUp();
   const fileForm = await buildFormForEachField(file,async()=>submitFile(file),null);
   document.body.appendChild(popup);
   popup.querySelector('#insert-html').appendChild(fileForm);
   let myModal = new bootstrap.Modal(document.getElementById('formModal'), {});
   myModal.show();
   // popups.push(fileFormSetup)
}

function buildFileTable(tableContainer){
   tableContainer.style.zIndex='2'
   tableContainer.innerHTML="";
   let ignoreFields = ["id"];
   let table = createTableWithFunctionFromObjects(fileRepository, ignoreFields,fileFormSetup2);
   
   tableContainer.appendChild(table);

   let lastScrollTop = 0;
   tableContainer.addEventListener('scroll', function() {
      const scrollPosition = this.scrollTop + this.clientHeight;
      const tableHeight = this.scrollHeight;
      let currentScrollTop = this.scrollTop;

      if (tableHeight - scrollPosition < 500 && currentScrollTop > lastScrollTop) {
         tableDisplayControl(table, false);
      } else if (this.scrollTop < 500 && currentScrollTop < lastScrollTop) {
         tableDisplayControl(table, true);
      }

      lastScrollTop = currentScrollTop;
   });
}

async function buildFileEditForm(file){
   const fileForm = await buildFormForEachField(file,async()=>submitFile(file),null);
   const popup = document.querySelector('#popup');
   const currentWindow = document.querySelector('#popup-insert');
   // if(currentWindow) all.removeChild(currentWindow);
   // let allInfoWindow = getEmptyWindow('Edit File');
   // document.getElementById('all').appendChild(allInfoWindow);
   // allInfoWindow.style.position = 'fixed';
   // allInfoWindow.style.zIndex = '2000';
   //       allInfoWindow.style.width = 'fit-content';
   //       allInfoWindow.style.height = 'fit-content';
   //       allInfoWindow.style.minWidth = '30%';
   //       allInfoWindow.style.maxHeight = '90%';
   //       allInfoWindow.style.maxWidth = '50%';
   //       allInfoWindow.id = 'file-edit-window';

   //       allInfoWindow.style.right = 0 + 'px';
   //       // allInfoWindow.style.bottom = 0+ 'px';

         let content = document.createElement('div');
         currentWindow.appendChild(content);
         content.style.position = 'relative';
         content.style.padding = '20px';
         content.style.overflow = 'auto';
         content.appendChild(fileForm);

         showPopup();
}

function showPopup() {
   document.getElementById('popup').style.display = 'block';
}

function closePopup() {
   document.getElementById('popup').style.display = 'none';
}

function editFile(file){

}