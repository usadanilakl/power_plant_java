function buildList(array){
    let list = document.createElement('ul');

    Array.from(array).forEach(e=>{
        let item = document.createElement('li');
        list.appendChild(item);
        item.textContent = e;
    })

    itemsObjects.appendChild(list);
    let item = document.createElement('li');
    item.textContent = '+';
    item.addEventListener('click',()=>createNewFolder());
    list.appendChild(item);


}