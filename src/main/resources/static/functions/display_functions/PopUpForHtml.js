
//let csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');

function getHtmlPopUp(getHtml){
    fetch('/popup/get-html')
        .then(response => response.text())
        .then((data) => {
            document.querySelector('#popup').innerHTML = data;
        })
        .then(()=>fillPopUpHtmlInfo(getHtml));

}


function fillPopUpHtmlInfo(getHtml, header){
    let title = document.getElementById("exampleModalLabel");
    let modal = document.getElementById('exampleModal');

    let myModal = new bootstrap.Modal(modal, {});
    myModal.show();
    fetch(getHtml)
        .then(response => response.text())
        .then((data) => {
            document.querySelector('#insert-html').innerHTML = data;
        })
    title.textContent = header;

}

