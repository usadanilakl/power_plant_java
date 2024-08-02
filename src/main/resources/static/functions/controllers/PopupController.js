async function getPopup(){
    const response = await fetch("/popup/get-html");
    const data = await response.text();
    let popup = document.createElement('div');
    popup.innerHTML = data;
    document.body.appendChild(popup);
    return data;
}

async function getFormPopUp(){
    const response = await fetch("/popup/form");
    const data = await response.text();
    let popup = document.createElement('div');
    popup.innerHTML = data;
    return popup;
}

async function getMessagePopUp(){
    const response = await fetch("/popup/message");
    const data = await response.text();
    let popup = document.createElement('div');
    popup.innerHTML = data;
    return popup;
}