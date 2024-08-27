import GlobalVariables from "../../global/GlobalVariables.js";
import DomBuilderService from "../dom/DomBuilderService.js";
import NewWindowService from "../dom/NewWindowService.js";
import CategoryService from "./CategoryService.js";

class CategoryPopup{
    static async setPopup(header,object,key){
        let popupContainer = NewWindowService.getPopupWindow(header,true);
        let popup = popupContainer.querySelector('.newWindow');
        const newValueInput = DomBuilderService.buildInputWithLabelAndControls("New Item Name:")
        const editValueInput = await DomBuilderService.buildCatInputDropdownWithControls(object,key);
        const deleteValueInput = await DomBuilderService.buildCatInputDropdownWithControls(object,key);
        const submitButton = DomBuilderService.createElement('button',[],['smallBtn','red'],[CategoryService.editValue()])
        const buttonWrapper = DomBuilderService.createContainer([],['full-width-container-right'])

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

        submitButton.textContent = "Submit";

        popup.style.zIndex = '1000';
        popup.classList.add('centered-element');

        popup.appendChild(newValueInput);
        popup.appendChild(editValueInput);
        popup.appendChild(deleteValueInput);
        buttonWrapper.appendChild(submitButton);
        popup.appendChild(buttonWrapper);

        popup.style.width = 'fit-content';
        popup.style.maxWidth = '70%';
        popup.style.height = 'fit-content';
        popup.style.maxHeight = '70%';

        popup.querySelectorAll('label').forEach(l=>l.classList.add('white-text'));

        return popupContainer;
    }
}
export default CategoryPopup;