
let groupValue;
function getPopUp(){
    fetch('/popup/get')
        .then(response => response.text())
        .then((data) => {
            document.querySelector('#popup').innerHTML = data;
        });

}
function selectionCheck(value, group){
    if(value === '-1' || value.includes("Add New")){
        getPopUp();
        fillPopUpInfo(group);
    }
}

function createNewItem(url,redirect){

    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': csrfToken,
            'Content-Type': 'application/json'
        }
    })
        .then(()=>{
            window.location.href = redirect;
        })
        .catch((error) => {
            console.error('Error:', error);
        })
}

function fillPopUpInfo(group){
    let title = document.getElementById("exampleModalLabel");
    let modal = document.getElementById('exampleModal');
    let saveButton = document.getElementById('save');

    let myModal = new bootstrap.Modal(modal, {});
    let groupType = group.toLocaleLowerCase().replaceAll(" ","");
    myModal.show();
    title.textContent = "Create New " + group;
    saveButton.addEventListener('click', ()=>{
        createNewItem( '/group/create?group='+groupType+'&value='+groupValue,'/lotos/create');
    })

}

function updateValue(value){
    groupValue = value;
}