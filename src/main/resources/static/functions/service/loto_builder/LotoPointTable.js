let searchValues = [];
let filteredArray = [];
let lastSortedBy = "";
let rows = [];
let filters = [];


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

function createTableWithFunctionFromObjects(objects, ignoreFields,action){
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
        search.setAttribute('data-filter',e)
        search.addEventListener('change', ()=>{
            // filteredArray = filterObjects(e,search.value,filteredArray);
            setFilters();
            filteredArray = muliFilter(objects,filters);
            tbody.innerHTML = "";
            createRowsWithFunction(tbody,ignoreFields,action);
        });
        let button = document.createElement('button');
        th.appendChild(button);
        button.textContent = e;
        button.addEventListener('click',()=>{
            sortObjects(e);
            tbody.innerHTML = "";
            createRowsWithFunction(tbody,ignoreFields,action);
        });
    }
    if(objects[0].id){ //this will create an extra column for edit buttons if id is present
        let crud = document.createElement('th');
        header.appendChild(crud);
        crud.textContent = 'Edit/Delete'; 
    }


    createRowsWithFunction(tbody,ignoreFields,action);

    return table;
}

function createRowsWithFunction(tbody,ignoreFields,action){
    let i = 1;
    rows = [];
    filteredArray.forEach(el=>{

        let row = document.createElement('tr');
        if(el.id)row.setAttribute('data-obj-id',el.id)
        if(i<100){
            tbody.appendChild(row); 
        }


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
            
            if(el.eqIds){
                // td.style.color = 'green';
            } 
            row.appendChild(td);
        }

        if(action){
            let crud = document.createElement('td');
            row.appendChild(crud);
            crud.classList.add('crud');

            let editButton = document.createElement('button')
            crud.appendChild(editButton);
            editButton.classList.add('crudButton');
            editButton.textContent = "View";

            editButton.addEventListener('click',async ()=>await action(el));

            let submitButton = document.createElement('button')
            crud.appendChild(submitButton);
            submitButton.classList.add('crudButton');
            submitButton.textContent = "Add";

            submitButton.addEventListener('click',async ()=>{
                selectedLotoPoints.push(el);
                await fillSelectedPointsWindow();
            });
        }        

        rows.push(row);
    })
    console.log("table is built " + filteredArray.length)
}

function filterObjects(key,value, objects){
    return objects.filter(e=>{
        //console.log(e[key] + ", " + value);
        return String(e[key]).trim().toLowerCase().includes(value.trim().toLowerCase());
    })
}

function muliFilter(objects,filters){
    console.log(JSON.stringify(filters))
    return objects.filter(e=>{
        let match = true;
        for(let f of filters){
            if(e[f.key] && e[f.key].name && String(e[f.key].name).trim().toLowerCase().includes(f.value.trim().toLowerCase())) match=true;
            else if(e[f.key] && String(e[f.key]).trim().toLowerCase().includes(f.value.trim().toLowerCase())) match=true;
            else {
                match = false
                break;
            }
        }
        return match;
    })
}

function setFilters(){
    filters = [];
    let inputs = document.querySelectorAll('[data-filter]');
    inputs.forEach(i=>{
        let key = i.getAttribute('data-filter');
        let value = i.value;
        let filter = {key:key,value:value};
        if(value!=null && value.trim()!=="")filters.push(filter);
    })
}

function sortObjects(key) {
    const compareValues = (a, b) => {
        const valA = a[key];
        const valB = b[key];

        // Handle null, undefined, or empty values
        if (!valA && !valB) return 0;
        if (!valA) return 1;
        if (!valB) return -1;

        // Handle nested objects with 'name' property
        if (typeof valA === 'object' && valA.name) return valA.name.localeCompare(valB.name);
        if (typeof valB === 'object' && valB.name) return valA.localeCompare(valB.name);

        // Default comparison
        return valA.toString().localeCompare(valB.toString());
    };

    if (lastSortedBy !== key) {
        filteredArray.sort(compareValues);
        lastSortedBy = key;
    } else {
        filteredArray.sort((a, b) => compareValues(b, a));
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

function scrollBottomRowToTop() {
    const table = document.querySelector('.table');
    const rows = table.querySelectorAll('tr');
    const body = table.querySelector('tbody');
    const tableRect = table.getBoundingClientRect();
    let lastVisibleRow;
    let rowsScrolled = 0;

    // Find the last visible row
    for (let i = 0; i < rows.length; i++) {
    const rowRect = rows[i].getBoundingClientRect();
    if (rowRect.bottom <= window.innerHeight-20) {
        lastVisibleRow = rows[i];
        rowsScrolled = i;
    } else {
        break;
    }
    }

    // If a visible row was found, scroll it to the top
    if (lastVisibleRow) {
    lastVisibleRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
    while(isScrollbarAt50Percent(table.parentElement)){
        deleteRowsFromTop(1,body);
        addRowsToBottom(1,body,rows)
    }

    }
}

function isScrollbarAt50Percent(element) {
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
    
    return Math.abs(scrollPercentage - 50) < 1;
}

function initDragScroll(container, control) {
    let isDragging = false;
    let startY, startTop;
    let scrollInterval;

    const containerRect = container.getBoundingClientRect();
    const controlHeight = control.offsetHeight;
    const centerPosition = (containerRect.height - controlHeight) / 2;

    // Initially position the control in the center
    control.style.top = `${centerPosition}px`;

    control.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);

    function startDragging(e) {
        isDragging = true;
        startY = e.clientY;
        startTop = parseInt(window.getComputedStyle(control).top, 10);
        e.preventDefault();
    }

    function drag(e) {
        if (!isDragging) return;

        const deltaY = e.clientY - startY;
        let newTop = startTop + deltaY;

        // Constrain the control within the container
        newTop = Math.max(0, Math.min(newTop, containerRect.height - controlHeight));

        control.style.top = `${newTop}px`;

        // Calculate scroll speed based on distance from center
        const distanceFromCenter = newTop - centerPosition;
        const maxDistance = containerRect.height / 2;
        const scrollSpeed = (distanceFromCenter / maxDistance) * 1000; // Adjust 20 for max speed

        clearInterval(scrollInterval);
        scrollInterval = setInterval(() => {
            container.scrollTop += scrollSpeed;
        }, 16); // ~60fps
    }

    function stopDragging() {
        isDragging = false;
        clearInterval(scrollInterval);

        // Animate the control back to the center
        const currentTop = parseInt(window.getComputedStyle(control).top, 10);
        const distance = centerPosition - currentTop;
        const duration = 300; // milliseconds
        const startTime = performance.now();

        function animate(currentTime) {
            const elapsedTime = currentTime - startTime;
            if (elapsedTime < duration) {
                const progress = elapsedTime / duration;
                const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2; // Ease in-out
                const newTop = currentTop + distance * easeProgress;
                control.style.top = `${newTop}px`;
                requestAnimationFrame(animate);
            } else {
                control.style.top = `${centerPosition}px`;
            }
        }

        requestAnimationFrame(animate);
    }
}








