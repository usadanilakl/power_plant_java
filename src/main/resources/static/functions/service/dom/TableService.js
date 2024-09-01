import Table from "../../dom/base/Table.js";
import SortingFilteringService from "../util/SortingFilteringService.js";
import DomBuilderService from "./DomBuilderService.js";

class TableService {
    LAST_SORTED_BY = "";
    ARRAY = [];
    IGNORE_FILDS = [];

    constructor(array,ignoreFields){
        this.ARRAY = array;
        this.IGNORE_FILDS = ignoreFields;
    }

    buildTableWithControls(style){
        return Table.buildTableFromObject(this.ARRAY, this.IGNORE_FILDS, style,this.LAST_SORTED_BY);
    }
    
}

export default TableService;