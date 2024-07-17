async function setupPopup(category){
    console.log("popup running")
    let saveButton = document.getElementById('save');
    let title = document.getElementById("exampleModalLabel");
    let modal = document.getElementById('exampleModal');
    let myModal = new bootstrap.Modal(modal, {});
    myModal.show();
    title.textContent = "Create New "+category;
    let inputValue = document.getElementById('value-name');
    let newVal = function(){
        createNewValue(category,inputValue.value);
        console.log("Saved")
        myModal.hide();
        saveButton.removeEventListener('click',newVal);
    }
      saveButton.addEventListener('click',newVal);
      

}