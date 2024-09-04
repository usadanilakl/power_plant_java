import CategoryController from "../../controllers/category/CategoryController.js";
import GlobalVariables from "../../global/GlobalVariables.js";
import DomBuilderService from "../dom/DomBuilderService.js";
import NewWindowService from "../dom/NewWindowService.js";
import TableService from "../dom/TableService.js";
import CategoryService from "./CategoryService.js";

class CategoryPopup{
    static async setPopup(header,object,key){
        let popupContainer = NewWindowService.getPopupWindow(header,true);
        let popup = popupContainer.querySelector('.newWindow');
        const newValueInput = DomBuilderService.buildInputWithLabelAndControls("New Item Name:")
        const editValueInput = await DomBuilderService.buildCatInputDropdownWithControls(object,key);
        const deleteValueInput = await DomBuilderService.buildCatInputDropdownWithControls(object,key);
        const buttonWrapper = DomBuilderService.createContainer([],['full-width-container-right']);

        editValueInput.querySelector('label').textContent = "Existing Item to Edit";
        editValueInput.querySelector('input').placeholder = "Select "+object[key].category.name+" to Edit";
        editValueInput.querySelector('input').setAttribute('data-input-type','edit');

        deleteValueInput.querySelector('label').textContent = "Existing Item to Delete";
        deleteValueInput.querySelector('input').placeholder = "Select "+object[key].category.name+" to Delete";
        deleteValueInput.querySelector('input').setAttribute('data-input-type','delete');

        newValueInput.querySelector('input').placeholder = "Type New "+object[key].category.name+' Name';
        newValueInput.querySelector('input').setAttribute('data-input-type','new');



        newValueInput.classList.add('rounded-corner-container');
        editValueInput.classList.add('rounded-corner-container');
        deleteValueInput.classList.add('rounded-corner-container');

        popup.style.zIndex = '1000';
        popup.classList.add('centered-element');

        popup.appendChild(newValueInput);
        popup.appendChild(editValueInput);
        popup.appendChild(deleteValueInput);
        popup.appendChild(buttonWrapper);

        const submitAction = function(){CategoryService.editValue(popupContainer)}
        const submitButton = DomBuilderService.createElement('button',[],['smallBtn','red'],[submitAction]);
        submitButton.textContent = "Submit";
        buttonWrapper.appendChild(submitButton);

        popup.style.width = 'fit-content';
        popup.style.maxWidth = '70%';
        popup.style.height = 'fit-content';
        popup.style.maxHeight = '70%';

        popup.querySelectorAll('label').forEach(l=>l.classList.add('white-text'));

        return popupContainer;
    }

    static async setupRefractorPopup(category,oldValue,points){

        //build popup for refractor content
        const catObj = await CategoryController.getCategoryByAlias(category);
        const list = await CategoryController.getValuesOfCategoryAlias(category);
        const popupHolder = NewWindowService.getPopupWindow("Refactor " + catObj.name,true);
        const popup = popupHolder.querySelector('.newWindow');
        const newValueDropdown = await DomBuilderService.buildCatInputDropdownFromCatObj(catObj);
        const inputValue = newValueDropdown.querySelector('input');

        popup.appendChild(newValueDropdown);
        
        popup.style.maxHeight = '80vh';
        popup.style.maxWidth = '100%';

        let hide = [
            'id',
            'objectType',
            'name',
            'coordinates',
            'originalPictureSize',
            'lotoPoints',
            'specificLocation',
            'files',
            'mainFile',
            'highlight'
        ]

        const refactorTable = new TableService(points,hide);
        let table = refactorTable.buildScrollAbleTable('table-dark');
        popup.appendChild(table);
        popup.classList.add('centered-element');
        popup.style.width = 'fit-content';
        popup.style.maxWidth = '70%';
        popup.style.height = 'fit-content';
        popup.style.maxHeight = '70%';

        let operation = async function(){
            await deleteWithRefactor(oldValue,inputValue.getAttribute('data-object-id'));
        }

        DomBuilderService.createElement('button',[],['smalBtn','lime'],[operation])
        
    
        // let saveButton = popup.querySelector('#save');
        // let newVal = function(){
        //     let inputValue = document.getElementById('new-value-input');
        //     deleteWithRefactor(oldValue,inputValue.getAttribute('data-object-id')); 
        //     myModal.hide();
        //     saveButton.removeEventListener('click', newVal);
        //     let footer = saveButton.closest('.modal-footer');
        //     if (footer) {
        //         footer.removeChild(saveButton);
        //     }
        // }
        // saveButton.addEventListener('click', newVal);
        return popupHolder;
    }
    
}
export default CategoryPopup;