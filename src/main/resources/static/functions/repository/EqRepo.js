import FileRepo from "./FileRepo.js";

class EqRepo{
    static ORIGINAL_WIDTH;S
    static OLD_WIDTH;
    static SELECTED_EQ = {};
    static EQ_LIST;

    static getEqById(id){
        return FileRepo.FILE_WITH_POINTS.points.find(e=>e.id+''===id);
    }


}
export default EqRepo;