
 function createDropdownItem(content, container){
    let list = document.createElement('ul');
    content.forEach(e=>{
        let item = document.createElement('li');
        let button = document.createElement('a');
        
        const dropdownAction = (event)=>{
            let list2 = item.querySelector('ul');
            if(list2!==null) item.removeChild(list2);
            else e.dropdownFunc(event);
        }
        button.addEventListener('click',dropdownAction);
        button.classList.add('btn'); //style link to look like button
        button.classList.add('btn-warning'); //style link to look like button
        button.textContent = e.value; //text of the button

        item.appendChild(button);
        list.appendChild(item);
    })


    if(container!==null)container.appendChild(list);

    
 }

 