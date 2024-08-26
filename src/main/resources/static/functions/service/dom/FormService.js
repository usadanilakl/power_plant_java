import Dropdown from "../../dom/base/Dropdown.js";
import CategoryRepo from "../../repository/CategoryRepo.js";
import CategoryPopup from "../category/CategoryPopup.js";
import CategoryService from "../category/CategoryService.js";
import ModeService from "../mode/ModeService.js";
import UtilService from "../util/UtilService.js";
import DomBuilderService from "./DomBuilderService.js";

/***********************************************************************************************************************************
 * Building HTML form for each field of an object with searchable dropdowns:
 *  create an input with lable for each field of source object
 *  if field contains another object then create searchable dropdown for it
 *  assign an event listener for each form field to auto update respective field in the object
 *************************************************************************************************************************************/
class FormService{
    static events = ['input', 'change', 'blur'];
    static oldFormData = {};
    static newFormData = {};
    static hiddenEquipmentFields = [
        'id',
        'objectType',
        'name',
        'coordinates',
        'originalPictureSize',
        'lotoPoints',
        'specificLocation',
        'files',
        'mainFile'
    ]
    
    static hiddenLotoPointFields = [
        'id',
        'objectType',
        'name',
        'lotos',
        'equipmentList',
        'oldId',
        'normalPosition',
        'isolatedPosition'
    ]
    
    static async buildFormFromObject(point){
        let form = document.createElement('form');
        for(let e in point){
            let isCat = CategoryService.isCategory(e);
            let div;
            let input;
            let label;
            let utilButton;

            if(isCat)div = DomBuilderService.buildCatInputDropdownWithControls(point,e); 
            else div = DomBuilderService.buildInputWithLabelAndControls(e,'Type...',e);

            input = div.querySelector('input');
            label = div.querySelector('label');
            utilButton = div.querySelector('.util-button');
            form.appendChild(div);
            input.readOnly = true;
            
            if(!point[e].name) input.value = point[e]; //assign value of given field to input field
            if(ModeService.MODES.editMode.state) input.readOnly = false;
            if(FormService.hideFormFields(point, e)) input.parentElement.classList.add('hide'); //this hides all listed fields
            
            if(isCat){
                let cat = CategoryRepo.OBJECTS.find(c=>c.alias===e);
                if(!point[e]) point[e] = {id:null,category:cat,name:"no data"};
                input.value = point[e].name
                if(ModeService.MODES.editMode.state) editButton.addEventListener('click',()=>CategoryPopup.setPopup(point,e));
            }
    
        
        if(point.objectType==="Equipment"){
    
            // let lotoPointContainer = document.createElement('div');
            // lotoPointContainer.id = 'loto-point-container';
            // form.appendChild(lotoPointContainer);
    
            // let submitButton = document.createElement('button');
            // submitButton.id = 'eq-submit-button';
            // submitButton.type = 'button';
            // submitButton.classList.add('btn');
            // submitButton.classList.add('btn-success');
            // submitButton.textContent = 'Submit';
            // submitButton.addEventListener('click',()=>{
            //     updatePoint(point);
            //     changeSubmitButtonToGreen(submitButton);
            // })
            // form.appendChild(submitButton);
            // // document.getElementById('infoWindowPoint').appendChild(submitButton);
    
            // let deleteButton = document.createElement('button');
            // deleteButton.type = 'button';
            // deleteButton.classList.add('btn');
            // deleteButton.classList.add('btn-danger');
            // deleteButton.textContent = "Delete";
            // deleteButton.addEventListener('click',()=>deletePoint(point.id))
            // form.appendChild(deleteButton);
            // // document.getElementById('infoWindowPoint').appendChild(deleteButton);
            // getDataFromForm(form,oldFormData);
            // getDataFromForm(form,newFormData);
            // form.addEventListener('click',()=>{
            //     setTimeout(()=>{if(changeDetector(form)) changeSubmitButtonToRed(submitButton)},300);
            // });
        }
    
        return form;
    }
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
    
    static buildCategoryOptions(id, items) {
        let dropdownContent = document.createElement('div');
        dropdownContent.classList.add('searchable-dropdown-content');
        dropdownContent.id = `${id}-options`;
        console.log(items)
        items.forEach(e => {
            let option = document.createElement('div');
            option.textContent = e.name;
            option.setAttribute('data-object-id',e.id);
            dropdownContent.appendChild(option);
        });
    
        return dropdownContent;
    }
    
    static isObject(element){
            if (typeof element === "object" && element !== null && !Array.isArray(element)) {
                return true;
            } else {
                return false;
            }
        
    }
    
    
    
    
    static hideFormFields(point, key){
        if(point.objectType === "Equipment" && hiddenEquipmentFields.includes(key)) return true;
        if(point.objectType === "LotoPoint" && hiddenLotoPointFields.includes(key)) return true;
        return false;
    }
    
    static changeSubmitButtonToRed(b){
        b.classList.remove('btn-success');
        b.classList.add('btn-danger');    
    }
    
    static changeSubmitButtonToGreen(b){
        b.classList.remove('btn-danger');
        b.classList.add('btn-success');    
    }
    
    
    static changeDetector(form){
        getDataFromForm(form, newFormData);
        console.log(newFormData.description);
        console.log(oldFormData.description);
        let isChanged = false;
        if(Object.keys(oldFormData).length>0){
            isChanged = !compareObjects(oldFormData, newFormData);
        }
        oldFormData = {...newFormData};
        return isChanged;
    }
    
    static getDataFromForm(form,obj){
        const inputs = form.querySelectorAll('input');
        inputs.forEach(e=>obj[e.id]=e.value)
    }
    
    static compareObjects(obj1, obj2) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
    
        if (keys1.length !== keys2.length) {
            return false;
        }
    
        return keys1.every(key => {
            const val1 = obj1[key];
            const val2 = obj2[key];
            if (typeof val1 === 'object' && typeof val2 === 'object') {
                return compareObjects(val1, val2); // Recursively compare nested objects
            }
            return val1 === val2;
        });
    }
}

export default FormService;



