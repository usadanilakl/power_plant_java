
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

        if(e.objectType){
            button.setAttribute('data-object-type',e.objectType);
            if(e.objectType === "FileObject"){
                button.setAttribute('data-file-name',e.name);
                button.setAttribute('data-file-number',e.fileNumber);
            }
        }

        item.appendChild(button);
        list.appendChild(item);
    })


    if(container!==null)container.appendChild(list);

    
 }

 function toggleButtonContent(button, options){
    let index;
    options.forEach(e=>{
        if(e===button.textContent)return
        index++;
    })
    button.textContent = options[index]
 }
 
 