import FileRepo from "./FileRepo.js";

class EqRepo{
    static OLD_WIDTH;

    static getEqById(id){
        FileRepo.FILE_WITH_POINTS.find(e=>e.id===id);
    }

    static getEqList(){
        return FileRepo.FILE_WITH_POINTS.points;
    }

}
export default EqRepo;