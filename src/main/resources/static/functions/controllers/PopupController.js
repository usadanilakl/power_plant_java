async function getPopup(){
    const response = await fetch("/popup/get-html");
    const data = await response.text();
    let popup = document.createElement('div');
    popup.innerHTML = data;
    document.body.appendChild(popup);
    return data;
}