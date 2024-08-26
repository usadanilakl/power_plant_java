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
}
export default CategoryService;