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