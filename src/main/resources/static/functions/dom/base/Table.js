import BaseDomBuilder from "./BaseDomBuilder.js";
import DomBuilderService from "../../service/dom/DomBuilderService.js"
import Input from "./Input.js";
import SortingFilteringService from "../../service/util/SortingFilteringService.js";
import LocatorService from "../../service/util/LocatorService.js";

class Table extends BaseDomBuilder{

    static buildTableFromObject(array, ignoreFields, style, lastSortedBy, filters){
        let table = super.createElement('table',[],['table',style],[]);
        let thead = super.createElement('thead',[],['sticky-top'],[]);
        let headerRow = super.createElement('tr',[],[],[]);
        let index = super.createElement('th',[],[],[]);
        let tbody = Table.createTableRows(ignoreFields,array)

        index.textContent = "#";
        headerRow.appendChild(index);

        for(let key in array[0]){
            if(ignoreFields && ignoreFields.includes(key)) continue;
            headerRow.appendChild(Table.tableHeaderCellWithControls(table,array,key,ignoreFields,lastSortedBy, filters));
        }  
        table.appendChild(thead);
        table.appendChild(tbody);
        thead.appendChild(headerRow);  

        return table;
    }

    static tableHeaderCellWithControls(table,array,key,ignoreFields,lastSortedBy,filters){
        let th = super.createElement('th',[{'id':'th-'+key}],[],[]);
        let search = Input.buildInputWithButton("Filter "+key,'search-'+key);
        let sort = super.createElement('button',[{'id':'sort-'+key}],[],[]);
        let tbody = table.querySelector('tbody');
        let clearButton = search.querySelector('button');

        sort.textContent = key;

        search.appendChild(sort);
        th.appendChild(search);

        search.addEventListener('change',()=>{
            tbody = table.querySelector('tbody');
            array = SortingFilteringService.filterObjects(array,key,search.querySelector('input').value);
            table.removeChild(tbody);
            table.appendChild(Table.createTableRows(ignoreFields,array));
            filters.push(search.querySelector('input').value);
        })

        sort.addEventListener('click',()=>{
            tbody = table.querySelector('tbody');
            array = SortingFilteringService.sortObjects(array,lastSortedBy,key)
            table.removeChild(tbody);
            table.appendChild(Table.createTableRows(ignoreFields,array))
            if(lastSortedBy===key)lastSortedBy = "";
            else lastSortedBy = key;
        })

        // clearButton.addEventListener('click',()=>)

        return th;
    }

    static tableHeaderCell(key){
        let th = super.createElement('th',[{'id':'th-'+key}],[],[]);
        th.textContent = key;
        return th;
    }

    static createTableRows(ignoreFields,array,rows){
        let tbody = super.createElement('tbody',[],[],[]);
        rows = [];
        let i = 1;
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

    static buildSimpleTable(style){
        return super.createElement('table',[],['table',style],[]);
    }

    static buildSimpleHeader(object,ignoreFields){
        let headerRow = super.createElement('tr',[],[],[]);
        let index = super.createElement('th',[],[],[]);

        index.textContent = "#";
        headerRow.appendChild(index);

        for(let key in object){
            if(ignoreFields && ignoreFields.includes(key)) continue;
            const cell = super.createElement('th',[{'data-column-key':key}],[],[]);
            headerRow.appendChild(cell);
        } 

        return headerRow;
    }

    static addControlsToHeader(header){
        for(let cell of header.cells){
            let key = cell.getAttribute('data-column-key');
            let search = Input.buildInputWithButton("Filter "+key,'search-'+key);
            let sort = super.createElement('button',[{'id':'sort-'+key}],['sort-button'],[]);

            search.querySelector('button').classList.add('revial-button');
            sort.textContent = key;
            sort.classList.add('smallBtn');
            sort.classList.add('green-inward');
            sort.style.width = '100%';

            cell.appendChild(search);
            cell.appendChild(sort);
        }
    }

    static deleteRowsFromTop(num,tbody){
        for (let i = 0; i < num; i++) {
            if (tbody.rows.length > 80) {
                tbody.deleteRow(0);
            } else {
                break;
            }
        }
    }
    
    static addRowsToBottom(num,tbody,arr){
        const lastRow = tbody.rows[tbody.rows.length - 1];
        const indexValue = lastRow.cells[0].textContent;
        const index = parseInt(indexValue);
        for(let i = 0; i<num; i++){
            let next = index+i;
            if(next<arr.length) tbody.appendChild(arr[next]);
            else break;
        }
        
    }
    
    static tableDisplayControl(table, scrollUp){
        let tbody = table.querySelector('tbody');
        let numberOfRows = 20
        
            if(scrollUp){
                Table.addRowsOnTop(numberOfRows,tbody,rows);
                Table.deleteRowsFromBottom(numberOfRows,tbody);
            }else{
                Table.addRowsToBottom(numberOfRows,tbody,rows);
                Table.deleteRowsFromTop(numberOfRows,tbody);            
            }
    
        
    }
    
    static deleteRowsFromBottom(num,tbody){
        for (let i = 0; i < num; i++) {
            if (tbody.rows.length > 80) {
                tbody.deleteRow(tbody.rows.length-1);
            } else {
                break;
            }
        }
    }
    
    static addRowsOnTop(num,tbody,arr){
        const firstRow = tbody.rows[0];
        if(firstRow){
            const indexValue = firstRow.cells[0].textContent;
            const index = parseInt(indexValue);
            for(let i = 0; i<num; i++){
                let next = index-i;
                if(next>-1) tbody.insertBefore(arr[next],tbody.rows[0]);
                else break;
            }
        }
    
        
    }




}

export default Table;