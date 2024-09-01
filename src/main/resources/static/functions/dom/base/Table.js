import BaseDomBuilder from "./BaseDomBuilder.js";
import DomBuilderService from "../../service/dom/DomBuilderService.js"
import Input from "./Input.js";
import SortingFilteringService from "../../service/util/SortingFilteringService.js";
import LocatorService from "../../service/util/LocatorService.js";

class Table extends BaseDomBuilder{

    static buildTableFromObject(array, ignoreFields, style,lastSortedBy){
        let table = super.createElement('table',[],['table',style],[]);
        let thead = super.createElement('thead',[],['sticky-top'],[]);
        let headerRow = super.createElement('tr',[],[],[]);
        let index = super.createElement('th',[],[],[]);
        let tbody = Table.createTableRows(ignoreFields,array)

        index.textContent = "#";
        headerRow.appendChild(index);

        for(let key in array[0]){
            if(ignoreFields && ignoreFields.includes(key)) continue;
            headerRow.appendChild(Table.tableHeaderCellWithControls(table,array,key,ignoreFields,lastSortedBy));
        }  
        table.appendChild(thead);
        table.appendChild(tbody);
        thead.appendChild(headerRow);  

        return table;
    }

    static tableHeaderCellWithControls(table,array,key,ignoreFields,lastSortedBy){
        let th = super.createElement('th',[{'id':'th-'+key}],[],[]);
        let search = Input.buildInputWithButton("Filter "+key,'search-'+key);
        let sort = super.createElement('button',[{'id':'sort-'+key}],[],[]);
        let tbody = table.querySelector('tbody');

        sort.textContent = key;

        search.appendChild(sort);
        th.appendChild(search);

        search.addEventListener('change',()=>{
            array = SortingFilteringService.filterObjects(array,key,search.querySelector('input').value);
            table.removeChild(tbody);
            table.appendChild(Table.createTableRows(ignoreFields,array))
        })

        sort.addEventListener('change',()=>{
            array = SortingFilteringService.sortObjects(array,lastSortedBy)
            table.removeChild(tbody);
            table.appendChild(Table.createTableRows(ignoreFields,array))
        })

        return th;
    }

    static tableHeaderCell(key){
        let th = super.createElement('th',[{'id':'th-'+key}],[],[]);
        th.textContent = key;
        return th;
    }

    static createTableRows(ignoreFields,array){
        let tbody = super.createElement('tbody',[],[],[]);
        let i = 1;
        let rows = [];
        array.forEach(el=>{
            let row = document.createElement('tr');
            if(i<100){
            tbody.appendChild(row); 
            }
            
            rows.push(row);

            let indexData = document.createElement('td');
            indexData.textContent = i++;
            row.appendChild(indexData);
            indexData.classList.add('idexData');

            for(let key in el){
                if(ignoreFields && ignoreFields.includes(key)) continue;
                let td = document.createElement('td');
                if(el[key] && el[key].name){
                    td.textContent = el[key].name
                } 
                else td.textContent = el[key];
                row.appendChild(td);
            }
        })
        return tbody;
    }


}

export default Table;