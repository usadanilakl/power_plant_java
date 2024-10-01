async function buildFormForEachField(object,submitFunction,deleteFunction){
    const form = await setInputs(object);
    await setDropdowns(form,object);
    form.appendChild(controlButton(submitFunction,"Submit"));
    form.appendChild(controlButton(deleteFunction,"Delete"));
    return form;
}

async function setInputs(object){
    let form = document.createElement('form');
    for(let key in object){
        let inputContainer = document.createElement('div'); //holds and formats label and input field
        let label = document.createElement('label'); //displays identifier for input field
        let input = document.createElement('input'); //input fields itself

        inputContainer.id = 'input-container-for-'+key;
        inputContainer.classList.add('form-group');
        
        label.for = 'input-'+key;
        label.textContent = key;
        label.style.color = "white";

        input.id = 'input-'+key;
        input.classList.add('form-control');
        input.name = 'fields';
        input.value = object[key];
        input.autocomplete = 'off';

        inputContainer.appendChild(label);
        inputContainer.appendChild(input);
        form.appendChild(inputContainer);
        let assignValue = ()=> object[key] = input.value;
        let pasteFromClipboard = async ()=>{
            let clipBoardText = await checkClipboardAndPasteShort(input);
            object[key]= clipBoardText ;
        }
        input.addEventListener("input",assignValue) //assing value back to object on input event
        input.addEventListener('click',pasteFromClipboard); //paste function 

        if(modes && modes.editMode.state) input.readOnly = false;
        else input.readOnly = true;

        if(hideFormFields(object, key)) input.parentElement.classList.add('hide'); //this hides all listed fields
    }
    return form;
}

async function setDropdowns(form, object){

    for (const container of form.children){

        let label = container.querySelector('label');
        let input = container.querySelector('input');
        let key = input.id.replace('input-','');

        if(allAliases.includes(key)){
            container.classList.add('searchable-dropdown');
            let cat = categoryObjects.find(c=>c.alias===key)
            if(!object[key]) object[key] = {id:null,category:key,name:"no data"};
            label.textContent = object[key].name;
            
            input.value = object[key].name
            input.setAttribute('data-object-field', key); //this is the field name of main object, ex: point.vendor/point.eqType
            input.setAttribute('data-object-category', key); //this is category name for display, ex: Vendor/Equipment Type
            input.setAttribute('data-object-id', object[key].id); //this is category object id from DB for proper mapping
            input.autocomplete = 'off';
            input.addEventListener('focus', () => input.classList.add("show")); //to show dropdown items when input is selected
            input.addEventListener('keyup', () => filterOptions(input,options)); //to filter options as user types into input field
            

            let items = await getValuesOfCategoryAlias(key); //get all values of given category
            let options = buildCategoryOptions(key, items); //build options for given category
            container.appendChild(options);

            document.addEventListener('click', function(event) { //this hides options if clicked away
                if(input){
                    var isClickInside = input.contains(event.target) || options.contains(event.target);
                    if (!isClickInside) {
                        options.classList.remove("show");
                    } 
                }
        
            });
        
            options.addEventListener('click', function(event) { //this assignes value of the option to input field 
                let opt = event.target;
                if (opt.tagName.toLowerCase() === 'div') {
                    input.value = opt.textContent;
                    input.setAttribute('data-object-id',event.target.getAttribute('data-object-id'));
                    options.classList.remove("show");
                    object[key].id = opt.getAttribute('data-object-id');
                    object[key].name= opt.textContent ;//assign value from input field back to object;
                }
            });

            // input.removeEventListener("input",assignValue);
            // input.removeEventListener('click',pasteFromClipboard);
            input.addEventListener('click',async()=>await checkClipboardAndPasteShort(input))
            input.addEventListener("input",(event)=>{//assign value from input field back to object;
                let opt = event.target;
                object[key].id = opt.getAttribute('data-object-id');
                object[key].name= opt.textContent ;
            })

            if(modes.editMode.state){

                let inputWrapper = document.createElement('div');
                inputWrapper.classList.add('input-group');
                input.parentNode.insertBefore(inputWrapper, input);
                inputWrapper.appendChild(input);

                let buttonWrapper = document.createElement('div');
                buttonWrapper.classList.add('input-group-append');
                inputWrapper.appendChild(buttonWrapper);

                let editButton = document.createElement('button');
                editButton.classList.add('btn')
                editButton.classList.add('btn-outline-secondary')
                editButton.type = 'button';
                editButton.innerText = '+';
                buttonWrapper.appendChild(editButton);
                editButton.addEventListener('click',()=>{
                    setCatPopup(key,items);
                });
            }
        }
    }
}

function controlButton(buttonFunction,buttonText){
    let submitButton = document.createElement('button');
    submitButton.type = 'button';
    submitButton.textContent = buttonText;
    submitButton.addEventListener('click',buttonFunction)
    return submitButton;
}