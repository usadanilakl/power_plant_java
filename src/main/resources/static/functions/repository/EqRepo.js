import FileRepo from "./FileRepo.js";

class EqRepo{
    static OLD_WIDTH;
    static SELECTED_EQ = {};
    static EQ_LIST;

    static getEqById(id){
        FileRepo.FILE_WITH_POINTS.find(e=>e.id===id);
    }


}
export default EqRepo;