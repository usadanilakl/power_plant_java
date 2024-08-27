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

    static editValue(){
        // let inputValue = document.getElementById('value-name');
        // let editValue = document.getElementById('edit-existing-input');
        // let deleteValue = document.getElementById('delete-existing-input');

        // if(editValue.value!==null && editValue.value!==""){
        //     crudValue("PUT",category, editValue.value, inputValue.value);
        // } 
        // else if(deleteValue.value!==null && deleteValue.value!==""){
        //    crudValue("DELETE",category, deleteValue.getAttribute('data-object-id'), null); 
        // } 
        // else{
        //     crudValue("POST",category, inputValue.value, null); 
        // } 
    }
}
export default CategoryService;