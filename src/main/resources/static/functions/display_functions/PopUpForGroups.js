
let groupValue;
let csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');

function getPopUp(group){
    fetch('/popup/get')
        .then(response => response.text())
        .then((data) => {
            document.querySelector('#popup').innerHTML = data;
        })
        .then(()=>fillPopUpInfo(group))
        .then(()=>setBackDropStyle);

}
function selectionCheck(value, group){
    if(value === '-1' || value.includes("Add New")){
        getPopUp(group);
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
    });

}

function setBackDropStyle(){
    let backDrop = document.querySelector(".modal-backdrop");
    backDrop.style.zIndex = "20";
    //backDrop.style.display = "none";
}

function updateValue(value){
    groupValue = value;
}