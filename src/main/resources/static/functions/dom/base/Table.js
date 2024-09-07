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
        let container = tbody.parentElement.parentElement;
        for (let i = 0; i < num; i++) {
            let rowHight = tbody.rows[1].offsetHeight;
            if (tbody.rows.length > 80) {
                if(tbody.rows[0].cells[0].textContent!=='1') tbody.deleteRow(0);
                else{
                   let firstRow = tbody.rows[0]; 
                   let oldHight = firstRow.offsetHeight;
                   firstRow.style.height = oldHight+rowHight+'px';
                } 
                

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
    
    static tableDisplayControl(table, scrollUp, rows){
        let tbody = table.querySelector('tbody');
        let numberOfRows = 20;
        
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
        const secondRow = tbody.rows[1];
        if(firstRow){
            const indexValue = secondRow.cells[0].textContent;
            const index = parseInt(indexValue);
            for(let i = 0; i<num; i++){
                let next = index-i;
                if(next>0){
                  tbody.insertBefore(arr[next],tbody.rows[1]);  
                  firstRow.style.height = firstRow.offsetHeight-arr[next].offsetHeight+'px';
                } 

                else break;
            }
        }
    
        
    }

    static isAlmostInViewFromBottom(tableBody,container,bufferDistance) {
        const tableRect = tableBody.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const lastRow = tableBody.lastElementChild;
        
        if (!lastRow) return false;
        
        const lastRowRect = lastRow.getBoundingClientRect();
        const distanceToBottom = lastRowRect.bottom-containerRect.bottom;
        // const distanceToBottom = containerRect.bottom - lastRowRect.bottom;

        // console.log(containerRect.bottom);
        // console.log(lastRowRect.bottom);
        // console.log(distanceToBottom);
        // console.log("==============================")
        
        return distanceToBottom < bufferDistance;
    }

    static isAlmostInViewFromTop(tableBody,container,bufferDistance) {
        const tableRect = tableBody.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const firstRow = tableBody.rows[0];
        
        if (!firstRow) return false;
        
        const firstRowRect = firstRow.getBoundingClientRect();
        const distanceAboveTop = containerRect.top - firstRowRect.bottom;
        // const distanceToBottom = containerRect.bottom - lastRowRect.bottom;

        console.log(firstRowRect.bottom);
        console.log(containerRect.top);
        console.log(distanceAboveTop);
        console.log("==============================")
        
        return distanceAboveTop < bufferDistance;
    }




}

export default Table;