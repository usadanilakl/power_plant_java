import CategoryService from "../category/CategoryService.js";

class SortingFilteringService{
    LAST_SORTED_BY = "";
    ARRAY = [];
    FILTERS = [];
    FILTERED_ARRAY = [];

    constructor(array){
        this.ARRAY = array;
        this.FILTERED_ARRAY = array;
    }

    static sortObjects(array, lastSortedBy, key) {
        if (lastSortedBy !== key) {
          lastSortedBy = key;
          return array.sort((a, b) => {
            const aValue = a[key] ? a[key].toString() : "";
            const bValue = b[key] ? b[key].toString() : "";
            return aValue.localeCompare(bValue);
          });
        } else {
          lastSortedBy = "";
          return array.sort((a, b) => {
            const aValue = a[key] ? a[key].toString() : "";
            const bValue = b[key] ? b[key].toString() : "";
            return bValue.localeCompare(aValue);
          });
        }
      }

    static filterObjects(array,key,value){
        return array.filter(e=>{
            if(CategoryService.isCategory(key)) return String(e[key].name).trim().toLowerCase().includes(value.trim().toLowerCase());
            return String(e[key]).trim().toLowerCase().includes(value.trim().toLowerCase());
        })
    }

    static clearObjectFilters(array,filters){
        
    }

    filter(key,value){
        this.FILTERED_ARRAY = SortingFilteringService.filterObjects(this.ARRAY,key,value);
        this.FILTERS.push(value);
    }

    sort(){
        this.FILTERED_ARRAY = SortingFilteringService.sortObjects(this.ARRAY,this.LAST_SORTED_BY);
    }

    resetFilters(){
        this.FILTERS = [];
        this.FILTERED_ARRAY = this.ARRAY
    }
}
export default SortingFilteringService;