import FileController from "../../controllers/file/FileController.js";
import FileRepo from "../../repository/FileRepo.js";

class FileService{
    fileController = new FileController();
    async setFiles(){
        FileRepo.ALL_FILES = await this.fileController.getAllFiles();
        return FileRepo.ALL_FILES;
    }
}

export default FileService;