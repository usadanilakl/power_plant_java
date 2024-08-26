import ApiMetaData from '../base/ApiMetaData.js';
import Controller from '../base/Controller.js'
import EndPoints from '../base/EndPoints.js';

class CategoryController extends Controller{
    static BASE_URL = EndPoints.CATEGORY_API;
    static CRUD_URL= CategoryController.BASE_URL+'/';
    static GET_OBJECTS_URL = CategoryController.CRUD_URL+'all';
    static GET_OBJ_BY_ALIAS_URL = CategoryController.CRUD_URL+'by-alias/';
    static GET_VALUES_OF_CAT_URL = CategoryController.CRUD_URL+'get-';
    static DELETE_WITH_REFACTOR_URL = CategoryController.CRUD_URL+'refactor/';

    static async getAllCategoryAliases(){
        return super.request(CategoryController.CRUD_URL, ApiMetaData.getOptions());
    }
    
    static async getAllCategoryObjects(){
        return super.request(CategoryController.GET_OBJECTS_URL,ApiMetaData.getOptions())
    }
    
    static async getCategoryByAlias(e){
        return super.request(CategoryController.GET_OBJ_BY_ALIAS_URL+e, ApiMetaData.getOptions());
    }

    static async getValuesOfCategoryAlias(alias){
        return super.request(CategoryController.GET_VALUES_OF_CAT_URL+alias, ApiMetaData.getOptions());
    }
    
    static async createNewValue(category,value){
        return super.request(CategoryController.CRUD_URL+category+"/"+value,postNoBody, ApiMetaData.postOptions());
    }

    static async deleteWithRefactor(oldValue,newValue){
        return super.request(CategoryController.DELETE_WITH_REFACTOR_URL+oldValue+'/'+newValue, ApiMetaData.deleteOptions());
    }

    static async deleteValueById(id){
        return super.request(CategoryController.CRUD_URL+id, ApiMetaData.deleteOptions());
    }

    static async getValueById(id){
        return super.request(CategoryController.CRUD_URL+id, ApiMetaData.getOptions());
    }

    static async updateValue(value){
        return super.request(CategoryController.CRUD_URL, ApiMetaData.patchOptions(JSON.stringify(value)));
    }

}

export default CategoryController;