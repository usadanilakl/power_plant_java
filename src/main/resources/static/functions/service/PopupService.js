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
        let editValue = document.getElementById('edit-existing-input');
        let deleteValue = document.getElementById('delete-existing-input');

        if(editValue.value!==null && editValue.value!==""){
            crudValue("PUT",category, editValue.value, inputValue.value);
        } 
        else if(deleteValue.value!==null && deleteValue.value!==""){
           crudValue("DELETE",category, deleteValue.getAttribute('data-object-id'), null); 
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
async function setupRefractorPopup(category,oldValue,points){

    //build popup for refractor content
    let popupHolder = document.getElementById('popup');
    let popup = await getRefractorPopup(category);
    popupHolder.innerHTML = "";
    popupHolder.appendChild(popup);
    let modal = popup.querySelector('#popupModal-'+category);
    if (!modal) {
        console.error('Modal element not found.');
        return;
    }
    let myModal = new bootstrap.Modal(modal, {});
    myModal.show();

    //build searchable dropdown and add to popup
    let list = await getValuesOfCategoryAlias(category);
    let dropdown = await buildDropdown("new-value",list,null);
    let modalBody = popupHolder.querySelector('.modal-body');
    //modalBody.appendChild(dropdown);

    //build table with points
    let table = createTableFromObjects(points);
    let tableContainer = document.createElement('div');
    tableContainer.appendChild(table);
    modalBody.appendChild(tableContainer);
    tableContainer.classList.add('table-container');
    

    let saveButton = popup.querySelector('#save');
    let newVal = function(){
        let inputValue = document.getElementById('new-value-input');
        deleteWithRefactor(oldValue,inputValue.getAttribute('data-object-id')); 
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
