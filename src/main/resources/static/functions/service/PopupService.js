// async function setupPopup(category){
//     let popupHolder = document.getElementById('popup')
//     let popup = await getCatPopup(category);
//     popupHolder.innerHTML = "";
//     popupHolder.appendChild(popup);
//     let newVal = function(){
//         createNewValue(category,inputValue.value);
//         console.log("Saved")
//         myModal.hide();
//         saveButton.removeEventListener('click',newVal);
//         footer.removeChild(saveButton);
//     }
//     let saveButton = popup.querySelector('#save');
//     saveButton.addEventListener('click',newVal);
//     let title = popup.querySelector("#popupModalLabel");
//     let modal = popup.querySelector('#popupModal'+category);
//     let myModal = new bootstrap.Modal(modal, {});
//     myModal.show();
//     title.textContent = "Create New "+category;
//     let inputValue = document.getElementById('value-name');

      
      

// }

async function setupPopup(category){
    let popupHolder = document.getElementById('popup');
    let popup = await getCatPopup(category);
    popupHolder.innerHTML = "";
    popupHolder.appendChild(popup);
    let modal = popup.querySelector('#popupModal-'+category);
    if (!modal) {
        console.error('Modal element not found.');
        return;
    }
    let myModal = new bootstrap.Modal(modal, {});
    myModal.show();
    let title = popup.querySelector("#popupModalLabel");
    title.textContent = "Create New " + category;
    // let inputValue = document.getElementById('value-name');

    let saveButton = popup.querySelector('#save');
    let newVal = function(){
        let inputValue = document.getElementById('value-name');
        let editValue = document.getElementById('edit-existing').querySelector('input');
        let deleteValue = document.getElementById('delete-existing').querySelector('input');

        if(editValue.value!==null && editValue.value!==""){
            crudValue("PUT",category, editValue.value, inputValue.value);
        } 
        else if(deleteValue.value!==null && deleteValue.value!==""){
           crudValue("DELETE",category, deleteValue.value, null); 
        } 
        else{
            crudValue("POST",category, inputValue.value, null); 
        } 

        myModal.hide();
        saveButton.removeEventListener('click', newVal);
        let footer = saveButton.closest('.modal-footer');
        if (footer) {
            footer.removeChild(saveButton);
        }
    }
    saveButton.addEventListener('click', newVal);
    return popupHolder;
}