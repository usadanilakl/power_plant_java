import Table from "../../dom/base/Table.js";
import NewWindowDom from "../../dom/window/NewWindowDom.js";
import SortingFilteringService from "../util/SortingFilteringService.js";
import DomBuilderService from "./DomBuilderService.js";

class TableService {
    LAST_SORTED_BY = "";
    ARRAY = [];
    FILTERED_ARRAY = [];
    IGNORE_FILDS = [];
    FILTERS = [];

    constructor(array,ignoreFields){
        this.ARRAY = array;
        this.IGNORE_FILDS = ignoreFields;
        this.LAST_SORTED_BY = "";
        this.FILTERED_ARRAY = array;
    }

    buildTableWithControls(style){
        return Table.buildTableFromObject(this.FILTERED_ARRAY, this.IGNORE_FILDS, style, this.LAST_SORTED_BY, this.FILTERS);
    }

    buildSearchableTable(style){
        const table = Table.buildSimpleTable(style);
        const header = Table.buildSimpleHeader(this.ARRAY[0],this.IGNORE_FILDS);
        const controls = Table.addControlsToHeader(header)
        let tbody = Table.createTableRows(this.IGNORE_FILDS, this.FILTERED_ARRAY)

        table.appendChild(header);
        table.appendChild(tbody);

        for(let cell of header.cells){
            const input = cell.querySelector('input');
            const sort = cell.querySelector('.sort-button');
            const clearFilter = cell.querySelector('.util-button');
            const key = cell.getAttribute('data-column-key');

            input.addEventListener('change',()=>{
                tbody = table.querySelector('tbody');
                this.FILTERED_ARRAY = SortingFilteringService.filterObjects(this.FILTERED_ARRAY, key, input.value);
                table.removeChild(tbody);
                table.appendChild(Table.createTableRows(this.IGNORE_FILDS,this.FILTERED_ARRAY));
                this.FILTERS.push(input.value);
            });

            sort.addEventListener('click',()=>{
                tbody = table.querySelector('tbody');
                this.FILTERED_ARRAY = SortingFilteringService.sortObjects(this.FILTERED_ARRAY,this.LAST_SORTED_BY,key)
                table.removeChild(tbody);
                table.appendChild(Table.createTableRows(this.IGNORE_FILDS,this.FILTERED_ARRAY))
                if(this.LAST_SORTED_BY===key)this.LAST_SORTED_BY = "";
                else this.LAST_SORTED_BY = key;
            })

            clearFilter.addEventListener('click',()=>{
                tbody = table.querySelector('tbody');
                this.FILTERED_ARRAY = this.ARRAY;
                table.removeChild(tbody);
                table.appendChild(Table.createTableRows(this.IGNORE_FILDS,this.FILTERED_ARRAY));
                this.FILTERS  = [];
            });

            const w = NewWindowDom.getEmptyWindow("Filters",true);
            w.classList.add('hidden-container');
        }

        return table;
    }

    
    
}

export default TableService;