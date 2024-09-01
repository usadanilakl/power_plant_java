import CategoryService from "../category/CategoryService.js";

class SortingFilteringService{
    LAST_SORTED_BY = "";
    ARRAY = [];

    constructor(array){
        this.ARRAY = array;
    }

    static sortObjects(array,lastSortedBy){
        if(lastSortedBy !== key){
            array.sort((a,b)=>{
                return a[key].toString().localeCompare(b[key].toString());
        });
        lastSortedBy = key;
        }else{
            array.sort((a,b)=>{
                return b[key].toString().localeCompare(a[key].toString());
            });
            lastSortedBy = "";
        }
    }

    static filterObjects(array,key,value){
        return array.filter(e=>{
            if(CategoryService.isCategory(key)) return String(e[key].name).trim().toLowerCase().includes(value.trim().toLowerCase());
            return String(e[key]).trim().toLowerCase().includes(value.trim().toLowerCase());
        })
    }

    filter(key,value){
        this.ARRAY = SortingFilteringService.filterObjects(this.ARRAY,key,value);
    }

    sort(){
        this.ARRAY = SortingFilteringService.sortObjects(this.ARRAY,this.LAST_SORTED_BY);
    }
}
export default SortingFilteringService;