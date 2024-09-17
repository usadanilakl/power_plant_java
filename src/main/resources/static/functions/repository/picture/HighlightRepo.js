import FileRepo from "../FileRepo.js";

class HighlightRepo{
    static ACTIVE_HIGHLIGHTS = [];
    static ALL_HIGHLIGHTS = [];
    static SELECTED_HIGHLIGHT = {};

    static getHighlightById(id){
        return FileRepo.FILE_WITH_POINTS.highlights.find(e=>e.id+''===id);
    }
}
export default HighlightRepo;