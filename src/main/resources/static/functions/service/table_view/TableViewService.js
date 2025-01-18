function getTable(){

}

 /************************************************************************************************** *
  * EQUIPMENT
 ************************************************************************************************** */

async function buildEqTable(tableContainer){
    tableContainer.innerHTML="";
    let ignoreFields = ["id"];
    let table = await createTableWithFunctionFromObjects(equipmentLightPoints, ignoreFields,showEquipmentOnPid2);
    
    tableContainer.appendChild(table);

    let lastScrollTop = 0;
    tableContainer.addEventListener('scroll', function() {
        const scrollPosition = this.scrollTop + this.clientHeight;
        const tableHeight = this.scrollHeight;
        let currentScrollTop = this.scrollTop;

        if (tableHeight - scrollPosition < 500 && currentScrollTop > lastScrollTop) {
            tableDisplayControl(table, false);
        } else if (this.scrollTop < 500 && currentScrollTop < lastScrollTop) {
            tableDisplayControl(table, true);
        }

        lastScrollTop = currentScrollTop;
    });
}

async function buildEqConflictTable(tableContainer, objects){
    tableContainer.innerHTML="";
    let ignoreFields = ["id"];
    let table = await createTableWithFunctionFromObjects(objects, ignoreFields,showEquipmentOnPid2);
    
    tableContainer.appendChild(table);

    let lastScrollTop = 0;
    tableContainer.addEventListener('scroll', function() {
        const scrollPosition = this.scrollTop + this.clientHeight;
        const tableHeight = this.scrollHeight;
        let currentScrollTop = this.scrollTop;

        if (tableHeight - scrollPosition < 500 && currentScrollTop > lastScrollTop) {
            tableDisplayControl(table, false);
        } else if (this.scrollTop < 500 && currentScrollTop < lastScrollTop) {
            tableDisplayControl(table, true);
        }

        lastScrollTop = currentScrollTop;
    });
}

async function showEquipmentOnPid2(eq){
    await openEqFile(eq.id);
}


 /************************************************************************************************** *
  * FILES
 ************************************************************************************************** */

async function buildFileTable(tableContainer){
    tableContainer.style.zIndex='2'
    tableContainer.innerHTML="";
    let ignoreFields = ["id","fileLink","value","objectType"];
    let table = await createTableWithFunctionFromObjects(fileRepository, ignoreFields,loadPictureInNewWindow);
    
    tableContainer.appendChild(table);
 
    let lastScrollTop = 0;
    tableContainer.addEventListener('scroll', function() {
       const scrollPosition = this.scrollTop + this.clientHeight;
       const tableHeight = this.scrollHeight;
       let currentScrollTop = this.scrollTop;
 
       if (tableHeight - scrollPosition < 500 && currentScrollTop > lastScrollTop) {
          tableDisplayControl(table, false);
       } else if (this.scrollTop < 500 && currentScrollTop < lastScrollTop) {
          tableDisplayControl(table, true);
       }
 
       lastScrollTop = currentScrollTop;
    });
 }

 /************************************************************************************************** *
  * LOTO POINT
 ************************************************************************************************** */

 async function buildLotoPointConflictTable(tableContainer,objects){
    if (!tableContainer) {
        console.error('Table container not found');
        return;
    }
    
    try {
        let data = objects;
        let items = data.map(e => ({
            tagNumber: e.tagNumber,
            description: e.description,
            generalLocation: e.generalLocation,
            specificLocation: e.specificLocation,
            id:e.id,
            eqIds : e.equipmentIdList,
            fileIds:e.fileIds
        }));
    
        let ignoreFields = ["id", "eqIds","fileIds"];
        let table = await createTableWithFunctionFromObjects(items, ignoreFields,showPointOnPid);
        
        tableContainer.appendChild(table);
    
        let lastScrollTop = 0;
        tableContainer.addEventListener('scroll', function() {
            const scrollPosition = this.scrollTop + this.clientHeight;
            const tableHeight = this.scrollHeight;
            let currentScrollTop = this.scrollTop;
    
            if (tableHeight - scrollPosition < 500 && currentScrollTop > lastScrollTop) {
                tableDisplayControl(table, false);
            } else if (this.scrollTop < 500 && currentScrollTop < lastScrollTop) {
                tableDisplayControl(table, true);
            }
    
            lastScrollTop = currentScrollTop;
        });
        
        initDragScroll(tableContainer, control);
        console.log('Scroll event listener added');
    } catch (error) {
        console.error('Error loading table data:', error);
    }
 }


async function buildLotoPointTable(tableContainer){
    if (!tableContainer) {
        console.error('Table container not found');
        return;
    }
    
    try {
        let data = activeLotoPoints;
        let items = data.map(e => ({
            tagNumber: e.tagNumber,
            description: e.description,
            generalLocation: e.generalLocation,
            specificLocation: e.specificLocation,
            id:e.id,
            eqIds : e.equipmentIdList,
            fileIds:e.fileIds
        }));
    
        let ignoreFields = ["id", "eqIds","fileIds"];
        let table = await createTableWithFunctionFromObjects(items, ignoreFields,showPointOnPid);
        
        tableContainer.appendChild(table);
    
        let lastScrollTop = 0;
        tableContainer.addEventListener('scroll', function() {
            const scrollPosition = this.scrollTop + this.clientHeight;
            const tableHeight = this.scrollHeight;
            let currentScrollTop = this.scrollTop;
    
            if (tableHeight - scrollPosition < 500 && currentScrollTop > lastScrollTop) {
                tableDisplayControl(table, false);
            } else if (this.scrollTop < 500 && currentScrollTop < lastScrollTop) {
                tableDisplayControl(table, true);
            }
    
            lastScrollTop = currentScrollTop;
        });
        
        initDragScroll(tableContainer, control);
        console.log('Scroll event listener added');
    } catch (error) {
        console.error('Error loading table data:', error);
    }
 }

 async function showPointOnPid(point,element){
    let eqId = point.eqIds[0];
    console.log(eqId)
    if(!eqId){
        getPanelSchedules(point,element);
        return;
    }
    showEquipmentOnPid(point);
    // let eq = await getPoint(eqId);
    // let file = await getFileByLink (eq.mainFile);
    // if(!fileWithPoints || fileWithPoints.id!==file.id) await loadPictureWithLightFile(file);
    // requestAnimationFrame(async () => {
    //     selectedArea = eq;
    //     highlightEq(eqId);
    //     // await fillPointInfoWindow(eq);
    // }); 

}

function getPanelSchedules(lp,element){
    let ids = lp.fileIds.replace(/ /g,"").split(",");
    ids.forEach(i=>console.log(i))
    let files = fileRepository.filter(f=>{
        // console.log(f.id);
        return ids.includes(f.id.toString());
        
    });
    if(files.length===1)loadPictureInNewWindow(files[0].id);
    else if(files.length>1)showFileDropdown(files,element);
    // files.forEach(f=>console.log(f.id));
    // showMultipleImages(files);
}

function showFileDropdown(files,element){
    const options = document.createElement('div');
    const elemRect = element.getBoundingClientRect();
    all.appendChild(options);

    // options.style.width = `${elemRect.width}px`;

    function removeOptions(event){
        if (!options.contains(event.target) && event.target !== element) {
            // options.style.display = 'none';
            all.removeChild(options);
            document.removeEventListener('click',removeOptions)
        }
    }

    document.addEventListener('click',removeOptions)

    files.forEach(f=>{
        let item = document.createElement('button');
        item.textContent = f.name;
        options.appendChild(item);
        item.addEventListener('click',()=>loadPictureInNewWindow(f.id))
    })

    options.style.position = 'fixed';
    options.style.display = 'flex';
    options.style.flexDirection = 'column';
    // options.style.top = `${elemRect.bottom}px`;
    // options.style.right = `${elemRect.left}px`;
    options.style.top = '50%';
    options.style.left = '50%';
    options.style.transform = 'translate(-50%, -50%)';
    options.style.zIndex = '3000';
    options.style.maxHeight = '40hv';
    options.style.width = '40%';
    options.style.scroll = 'auto'
    
    if(isBeyondRightEdge(options)) options.style.right = 0;

    


}

function isBeyondRightEdge(element) {
    const viewportWidth = window.innerWidth;
    const elementRect = element.getBoundingClientRect();
    const elementRightEdge = elementRect.right;

    return elementRightEdge > viewportWidth;
}


async function loadPictureInNewWindow(file){
    let id;
    if(file && file.id) id = file.id
    else id = file;
    try {
        const url = `/file/show-file-in-new-wind/${id}`;
        window.open(url, '_blank', 'width=800,height=600');
    } catch (error) {
        console.error('Error:', error);
    }
}



async function createEditableTableFromObjects(objects) {
    const table = document.createElement('table');
    table.className = 'table table-striped table-bordered';

    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Field', 'Value', 'Actions'];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    objects.forEach((obj, index) => {
        Object.entries(obj).forEach(([key, value]) => {
            const row = document.createElement('tr');
            
            // Field name
            const fieldCell = document.createElement('td');
            fieldCell.textContent = key;
            row.appendChild(fieldCell);

            // Value (as form input)
            const valueCell = document.createElement('td');
            const form = document.createElement('form');
            form.className = 'edit-form';
            form.dataset.objectIndex = index;
            form.dataset.field = key;

            let input;
            if (typeof value === 'object' && value !== null) {
                input = document.createElement('textarea');
                input.value = JSON.stringify(value, null, 2);
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.value = value !== null ? value : '';
            }
            input.name = key;
            input.className = 'form-control';
            form.appendChild(input);
            valueCell.appendChild(form);
            row.appendChild(valueCell);

            // Actions
            const actionsCell = document.createElement('td');
            const saveButton = document.createElement('button');
            saveButton.textContent = 'Save';
            saveButton.className = 'btn btn-primary btn-sm';
            saveButton.onclick = (e) => {
                e.preventDefault();
                saveChanges(form, objects);
            };
            actionsCell.appendChild(saveButton);
            row.appendChild(actionsCell);

            tbody.appendChild(row);
        });
    });
    table.appendChild(tbody);

    return table;
}

function saveChanges(form, objects) {
    const objectIndex = parseInt(form.dataset.objectIndex);
    const field = form.dataset.field;
    const newValue = form.elements[0].value;

    try {
        // Try to parse as JSON if it's an object or array
        objects[objectIndex][field] = JSON.parse(newValue);
    } catch (e) {
        // If parsing fails, treat it as a simple string
        objects[objectIndex][field] = newValue;
    }

    console.log(`Updated object ${objectIndex}, field ${field} to:`, objects[objectIndex][field]);
    // Here you would typically send this update to your backend
}

// Usage example:
// const tableContainer = document.getElementById('table');
// const objects = [/* your array of objects */];
// const editableTable = await createEditableTableFromObjects(objects);
// tableContainer.appendChild(editableTable);