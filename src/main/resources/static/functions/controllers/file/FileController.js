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

    async getAllFiles(){
        console.log("This is the url: " +FileController.CRUD_URL)
        return await super.request(FileController.CRUD_URL,ApiMetaData.getOptions)
    }

}
export default FileController;