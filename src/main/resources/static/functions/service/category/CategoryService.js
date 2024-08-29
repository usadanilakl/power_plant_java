import CategoryController from "../../controllers/category/CategoryController.js";
import CategoryRepo from "../../repository/CategoryRepo.js";
import CategoryPopup from "./CategoryPopup.js";

class CategoryService{
    static async setCategoryAliases(){
        CategoryRepo.ALIASES = await CategoryController.getAllCategoryAliases();
        return CategoryRepo.ALIASES;
    }

    static async setCategoryObjects(){
        CategoryRepo.OBJECTS = await CategoryController.getAllCategoryObjects();
        return CategoryRepo.OBJECTS;
    }

    static async getValuesOfCategoryAlias(alias){
        return CategoryController.getValuesOfCategoryAlias(alias);
    }

    static isCategory(key){
        if(CategoryRepo.ALIASES.includes(key))return true;
        return false;
    }

    static async editValue(popup){
        let newValue = popup.querySelector('[data-input-type="new"]');
        let editInput = popup.querySelector('[data-input-type="edit"]');
        let deleteValue = popup.querySelector('[data-input-type="delete"]');

        let response;
        let data;
        let valueObject = {};

        if(editInput.value!==null && editInput.value!=="" && newValue.value!==null && newValue.value!==""){
            valueObject.id = editInput.getAttribute('data-object-id')
            valueObject.name = newValue.value;
            response = await CategoryController.updateValue(valueObject);
        } 
        else if(deleteValue.value!==null && deleteValue.value!==""){
            response = await CategoryController.deleteValueById(deleteValue.getAttribute('data-object-id')); 
            

        } 
        else if(newValue.value!==null && newValue.value!==""){
            response = await CategoryController.createNewValue();
        } 
        
        if(response.action && response.action==='reassign'){
            CategoryPopup.setupRefractorPopup(response.categoryAlias,response.oldValue,response.list)
        }else{
            // let search = document.getElementById('select-input-editor');
            // if(document.getElementById('infoFramePoint'))fillPointInfoWindow(selectedArea);
            // else if(search){
            //     let w = search.closest('.newWindow');
            //     w.parentNode.removeChild(w);
            //     if(editModes.eqLocation.state)buildCategorySelector('location');
            //     if(editModes.lotoPointPosition.state)buildCategorySelector('isoPos');
            // }
        }
    }
}
export default CategoryService;