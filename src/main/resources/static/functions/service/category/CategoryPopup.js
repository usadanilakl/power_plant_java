import DomBuilderService from "../dom/DomBuilderService.js";
import NewWindowService from "../dom/NewWindowService.js";

class CategoryPopup{
    static async setPopup(header,object,key){
        let popup = NewWindowService.getNewWindow(header);
        popup.style.zIndex = '1000';
        popup.classList.add('centered-element');
        popup.appendChild(await DomBuilderService.buildCatInputDropdownWithControls(object,key))
        return popup;
    }
}
export default CategoryPopup;