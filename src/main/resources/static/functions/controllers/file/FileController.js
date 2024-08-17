import Controller from '../base/Conroller.js';
import EndPoints from '../base/EndPoints.js';
import ApiMetaData from '../base/ApiMetaData.js';

class FileController extends Controller{
    static BASE_URL = EndPoints.FILES_API;
    static CRUD_URL = FileController.BASE_URL+'/';
    static COMPLETED_FILES_URL = FileController.BASE_URL+'/completed';
    static INCOMPLETE_FILES_URL = FileController.BASE_URL+'/incomplete';
    static SKIPPED_URL = FileController.BASE_URL+'/skip';
    static VERIFY_URL = FileController.BASE_URL+'/verify';
    static CONVERT_URL = FileController.BASE_URL+'/convert';
    static FILE_CATEGORIES_URL = FileController.BASE_URL+"/get-categories";
    static FILE_VENDORS_URL = FileController.BASE_URL+"/get-vendors";
    static FILE_SYSTEMS_URL = FileController.BASE_URL+"/get-systems";
    static FILE_BY_NUMBER_URL = FileController.BASE_URL+'/get-by-number';

    async getAllFiles(){
        return await super.request(FileController.CRUD_URL,ApiMetaData.getOptions())
    }

    async patchFile(file){
        return await super.request(FileController.CRUD_URL,ApiMetaData.patchOptions(JSON.stringify(file)))
    }

    async getFile(id){
        return await super.request(FileController.CRUD_URL+id,ApiMetaData.getOptions())
    }
    async getFileCategories(){return await super.request(FileController.FILE_CATEGORIES_URL,ApiMetaData.getOptions);}
    async getFileVendors(){return await super.request(FileController.FILE_VENDORS_URL,ApiMetaData.getOptions);}
    async getFilesystems(){return await super.request(FileController.FILE_SYSTEMS_URL,ApiMetaData.getOptions);}
    async getFileFromDbByNumber(number){return await super.request(FileController.FILE_BY_NUMBER_URL+'/'+number, ApiMetaData.getOptions);}
    


}
export default FileController;