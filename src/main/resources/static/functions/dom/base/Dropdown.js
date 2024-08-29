import CategoryRepo from "../../repository/CategoryRepo.js";
import CategoryService from "../../service/category/CategoryService.js";
import BaseDomBuilder from "./BaseDomBuilder.js";
import Input from "./Input.js";

class Dropdown extends BaseDomBuilder{
    static async buildInputDropdown(header,items,id){
        let container = Input.buildInputWithLabelAndControls(header,"Type->Select");
        const input = container.querySelector('input');
        const options = Dropdown.buildDropdownOptionsFromObject(id,items);

        container.appendChild(options);

        input.autocomplete = 'off';
        input.classList.add('searchable-dropdown');
        input.addEventListener('focus', () => options.classList.add("show")); //to show dropdown items when input is selected
        input.addEventListener('keyup', () => Dropdown.filterOptions(input,options)); //to filter options as user types into input field


        document.addEventListener('click', function(event) { //this hides options if clicked away
            var isClickInside = input.contains(event.target) || options.contains(event.target);
            if (!isClickInside) {
                options.classList.remove("show");
            }
        });
    
        options.addEventListener('click', function(event) { //this assignes value of the option to input field 
            let opt = event.target;
            if (opt.tagName.toLowerCase() === 'div') {
                input.value = opt.textContent;
                input.setAttribute('data-object-id',event.target.getAttribute('data-object-id'));
                options.classList.remove("show");
            }
        });
        return container;
    }

    static async buildCatInputDropdown(object, key){
        let container = Input.buildInputWithLabelAndControls(object.name,"Type/Select");
        const input = container.querySelector('input');
        const items = await CategoryService.getValuesOfCategoryAlias(key);
        const options = Dropdown.buildDropdownOptionsFromObject(key,items);
        let cat = CategoryRepo.OBJECTS.find(c=>c.alias===key);
        if(!object[key]) object[key] = {id:null,category:cat};

        container.appendChild(options);

        input.classList.add('searchable-dropdown');
        input.setAttribute('data-object-field', key); //this is the field name of main object, ex: point.vendor/point.eqType
        input.setAttribute('data-object-category', cat.name); //this is category name for display, ex: Vendor/Equipment Type
        input.setAttribute('data-object-id', object[key].id); //this is category object id from DB for proper mapping
        
        input.autocomplete = 'off';
        input.addEventListener('focus', () => options.classList.add("show")); //to show dropdown items when input is selected
        input.addEventListener('keyup', () => Dropdown.filterOptions(input,options)); //to filter options as user types into input field


        document.addEventListener('click', function(event) { //this hides options if clicked away
            var isClickInside = input.contains(event.target) || options.contains(event.target);
            if (!isClickInside) {
                options.classList.remove("show");
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
    

        input.addEventListener("input",(event)=>{
            let opt = event.target;
            let isCat = true;
            if(isCat){
                object[key].id = opt.getAttribute('data-object-id');
                object[key].name= opt.textContent ;//assign value from input field back to object;
            }else{
                object[key] = input.value;
            }
        })

        

        return container;
    }

    static async buildCatInputDropdownFromCatObj(object){
        let container = Input.buildInputWithLabelAndControls(object.name,"Type/Select");
        const input = container.querySelector('input');
        const items = await CategoryService.getValuesOfCategoryAlias(object.alias);
        const options = Dropdown.buildDropdownOptionsFromObject(object.alias,items);

        container.appendChild(options);

        input.classList.add('searchable-dropdown');
        input.setAttribute('data-object-id', object.id);
        
        input.autocomplete = 'off';
        input.addEventListener('focus', () => options.classList.add("show")); //to show dropdown items when input is selected
        input.addEventListener('keyup', () => Dropdown.filterOptions(input,options)); //to filter options as user types into input field


        document.addEventListener('click', function(event) { //this hides options if clicked away
            var isClickInside = input.contains(event.target) || options.contains(event.target);
            if (!isClickInside) {
                options.classList.remove("show");
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
    

        input.addEventListener("input",(event)=>{
            let opt = event.target;
            let isCat = true;
            if(isCat){
                object[key].id = opt.getAttribute('data-object-id');
                object[key].name= opt.textContent ;//assign value from input field back to object;
            }else{
                object[key] = input.value;
            }
        })

        

        return container;
    }

    static buildDropdownOptionsFromObject(id, items) {
        let dropdownContent = document.createElement('div');
        dropdownContent.classList.add('searchable-dropdown-content');
        dropdownContent.id = `${id}-options`;
        items.forEach(e => {
            let option = document.createElement('div');
            if(e.name)option.textContent = e.name;
            else option.textContent = e;
            if(e.id)option.setAttribute('data-object-id',e.id);
            dropdownContent.appendChild(option);
        });
    
        return dropdownContent;
    }
    
    static filterOptions(input, div) {
        let filter = input.value.toUpperCase();
        div.classList.add("show");
        var options = div.getElementsByTagName("div");
        let hidden = 0;
        for (let i = 0; i < options.length; i++) {
            var txtValue = options[i].textContent || options[i].innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                options[i].style.display = "";
            } else {
                options[i].style.display = "none";
                hidden++;
            }
        }
        if(input.value!==null && input.value!=="" && hidden === options.length){
            input.style.backgroundColor = "red";
        }else{
            input.style.backgroundColor = "white"; 
        }
        
    }
}
export default Dropdown;