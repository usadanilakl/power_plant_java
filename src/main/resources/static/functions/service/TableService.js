let searchValues = [];
let filteredArray = [];
let lastSortedBy = "";
let rows = [];

/*************
 * <table class="table table-dark">
                <thead class="sticky-top">
 */

function createTableFromObjects(objects, ignoreFields){
    console.log(JSON.stringify(ignoreFields))
    filteredArray = objects;
    console.log(filteredArray.length);
    let table = document.createElement('table');
    table.classList.add('table');
    table.classList.add('table-dark');
    let thead = document.createElement('thead');
    thead.classList.add('sticky-top');
    table.appendChild(thead);
    let header = document.createElement('tr');
    thead.appendChild(header);

    let index = document.createElement('th');
    header.appendChild(index);
    index.textContent = 'Index';

    let tbody = document.createElement('tbody');
    table.appendChild(tbody);

    for(let e in objects[0]){
        if(ignoreFields && ignoreFields.includes(e)) continue;
        let th = document.createElement('th');
        header.appendChild(th);
        let search = document.createElement('input');
        th.appendChild(search);
        search.setAttribute('type','text');
        search.setAttribute('placeholder','filter');
        search.addEventListener('change', ()=>{
            filteredArray = filterObjects(e,search.value,objects);
            tbody.innerHTML = "";
            createRows(tbody);
    });
        let button = document.createElement('button');
        th.appendChild(button);
        button.textContent = e;
        button.addEventListener('click',()=>{
            sortObjects(e);
            tbody.innerHTML = "";
            createRows(tbody);
        });
    }
    if(objects[0].id){ //this will create an extra column for edit buttons if id is present
        let crud = document.createElement('th');
        header.appendChild(crud);
        crud.textContent = 'Edit/Delete'; 
    }


    createRows(tbody,ignoreFields);

    return table;
}

function createRows(tbody,ignoreFields){
    let i = 1;
    rows = [];
    filteredArray.forEach(el=>{
        let row = document.createElement('tr');
        if(el.id)row.setAttribute('data-obj-id',el.id)
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

        if(el.id){
            let crud = document.createElement('td');
            row.appendChild(crud);
            crud.classList.add('crud');

            let editButton = document.createElement('button')
            crud.appendChild(editButton);
            editButton.classList.add('crudButton');
            editButton.textContent = "Edit";

            // let editItem = function(){console.log(JSON.stringify(el) )}
            let editItem = function(){editFile(el.id)}
            editButton.addEventListener('click',editItem);  
        }
    })
}

function filterObjects(key,value, objects){
    return objects.filter(e=>{
        //console.log(e[key] + ", " + value);
        return String(e[key]).trim().toLowerCase().includes(value.trim().toLowerCase());
    })
}

function sortObjects(key){
    if(lastSortedBy !== key){
            filteredArray.sort((a,b)=>{
                return a[key].toString().localeCompare(b[key].toString());
        });
        lastSortedBy = key;
    }else{
        filteredArray.sort((a,b)=>{
            return b[key].toString().localeCompare(a[key].toString());
        });
        lastSortedBy = "";
    }

}

function searchFieldAndButtonInLine(){
    let div = document.createElement('div');
    div.style.display = "inline-block";
    let search = document.createElement('input');
    div.appendChild(search);
    search.setAttribute('type','text');
    search.setAttribute('placeholder','search');
    let button = document.createElement('button');
    button.textContent = "GO";
    let action = function(){
        searchValues.push(search.value);
    }
    button.addEventListener('click',action);
    div.appendChild(button);
    return div;
}

function deleteRowsFromTop(num,tbody){
    for (let i = 0; i < num; i++) {
        if (tbody.rows.length > 80) {
            tbody.deleteRow(0);
        } else {
            break;
        }
    }
}

function addRowsToBottom(num,tbody,arr){
    const lastRow = tbody.rows[tbody.rows.length - 1];
    const indexValue = lastRow.cells[0].textContent;
    const index = parseInt(indexValue);
    for(let i = 0; i<num; i++){
        let next = index+i;
        if(next<arr.length) tbody.appendChild(arr[next]);
        else break;
    }
    
}

function tableDisplayControl(table, scrollUp){
    let tbody = table.querySelector('tbody');
    let numberOfRows = 20
    
        if(scrollUp){
            addRowsOnTop(numberOfRows,tbody,rows);
            deleteRowsFromBottom(numberOfRows,tbody);
        }else{
            addRowsToBottom(numberOfRows,tbody,rows);
            deleteRowsFromTop(numberOfRows,tbody);
        }

    
}

function deleteRowsFromBottom(num,tbody){
    for (let i = 0; i < num; i++) {
        if (tbody.rows.length > 80) {
            tbody.deleteRow(tbody.rows.length-1);
        } else {
            break;
        }
    }
}

function addRowsOnTop(num,tbody,arr){
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







