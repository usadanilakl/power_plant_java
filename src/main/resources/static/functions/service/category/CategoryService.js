import CategoryController from "../../controllers/category/CategoryController.js";
import CategoryRepo from "../../repository/CategoryRepo.js";

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
        let editValue = popup.querySelector('[data-input-type="edit"]');
        let deleteValue = popup.querySelector('[data-input-type="delete"]');

        let response;

        if(editValue.value!==null && editValue.value!==""){
            response = CategoryController.updateValue();
        } 
        else if(deleteValue.value!==null && deleteValue.value!==""){
            response = CategoryController.deleteValueById(deleteValue.getAttribute('data-object-id')); 
        } 
        else{
            response = CategoryController.createNewValue()
        } 
    }
}
export default CategoryService;