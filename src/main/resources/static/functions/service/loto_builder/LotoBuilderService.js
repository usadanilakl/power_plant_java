let selectedLotoPoints = [];
let selectorIsEnabled = false;

async function fillSelectedPointsWindow(){
    const currentWindow = document.querySelector('#loto-points-window');
    if(currentWindow) all.removeChild(currentWindow);
    let allInfoWindow = getEmptyWindow('LOTO Points');
            allInfoWindow.style.width = 'fit-content';
            allInfoWindow.style.height = 'fit-content';
            allInfoWindow.style.minWidth = '30%';
            allInfoWindow.style.maxHeight = '90%';
            allInfoWindow.style.maxWidth = '50%';
            allInfoWindow.id = 'loto-points-window';

            allInfoWindow.style.right = 0 + 'px';
            allInfoWindow.style.bottom = 0+ 'px';
            document.getElementById('all').appendChild(allInfoWindow);

            let content = document.createElement('div');
            allInfoWindow.appendChild(content);
            content.style.position = 'relative';
            // content.style.top = '20px';
            content.style.padding = '20px';

            content.appendChild(clearListButton());
            content.appendChild(switchToOtherUnitButton());
            content.appendChild(await buildLotoPointList(selectedLotoPoints))

}

function switchToOtherUnitButton(){
    let button1 = document.createElement('button');
    button1.textContent = "Switch to U1";
    let button2 = document.createElement('button');
    button2.textContent = "Switch to U2";

    button1.style.color = 'blue';
    button2.style.color = 'blue';

    button1.addEventListener('click',async ()=>{
        let tags = selectedLotoPoints.map(e=>e.tagNumber);
        selectedLotoPoints = await getPointsByTagForUnit('01',tags);
        await fillSelectedPointsWindow();
    });

    button2.addEventListener('click',async ()=>{
        let tags = selectedLotoPoints.map(e=>e.tagNumber);
        selectedLotoPoints = await getPointsByTagForUnit('02',tags);
        await fillSelectedPointsWindow();
    });

    let container = document.createElement('div');
    container.appendChild(button1);
    container.appendChild(button2);
    container.style.display = 'flex';
    container.style.flexDirection = 'row';

    return container;
}

function clearListButton(){
    let button = document.createElement('button');
    button.textContent = "Clear All";
    button.addEventListener('click',async ()=>{
        selectedLotoPoints = [];
        await fillSelectedPointsWindow();
    })
    button.style.color = 'red';
    return button;
}
        
async function buildLotoPointList(points){
    let list = document.createElement('ul');

    points.forEach(e=>{
        let item = document.createElement('li');
        list.appendChild(item);
        let buttons = document.createElement('div');
        item.appendChild(buttons);
        buttons.classList.add('flex-inline');
        let button = document.createElement('button');
        buttons.appendChild(button);
        let formContainer = document.createElement('div');
        item.appendChild(formContainer);

        button.textContent = e.tagNumber;
        button.type = 'button';
        button.addEventListener('click', async ()=>{
            if(formContainer.children.length === 0){
                // formContainer.appendChild(showPointInfo(e));//old version
                const form = await buildFormFromObject(e);
                formContainer.appendChild(form);
            }else{
                formContainer.innerHTML = "";
            }
        });
        let removeButton = document.createElement('button');
        removeButton.type = "button";
        buttons.appendChild(removeButton);
        removeButton.classList.add('addButtons');
        removeButton.textContent = "X";

            const lotoModeAction = function(){
                selectedLotoPoints = selectedLotoPoints.filter(lp=>lp.id!==e.id);
                list.removeChild(item);
            }

            removeButton.addEventListener('click',lotoModeAction);
        

    });
    return list;
}


/**************************************************************
Build Table
**************************************************************/

async function buildSearchTableWindow(){
    const currentWindow = document.querySelector('#loto-points-table-window');
    if(currentWindow) all.removeChild(currentWindow);
    let allInfoWindow = getEmptyWindow('LOTO Points');
    document.getElementById('all').appendChild(allInfoWindow);
            allInfoWindow.style.width = 'fit-content';
            allInfoWindow.style.height = '20vh';
            allInfoWindow.style.minWidth = '20%';
            allInfoWindow.style.maxHeight = '90%';
            allInfoWindow.style.maxWidth = '90%';
            allInfoWindow.id = 'loto-points-table-window';

            
            allInfoWindow.style.position = 'absolute';
            allInfoWindow.style.right = 0 + 'px';
            allInfoWindow.style.top = 0+ 'px';


            let content = document.createElement('div');
            allInfoWindow.appendChild(content);
            content.style.position = 'relative';
            content.style.padding = '20px';
            content.style.overflow = 'auto';

            // await getAllLotoPoints();
            await getActiveLotoPoints();
            let items = activeLotoPoints.map(e => ({
                tagNumber: e.tagNumber,
                description: e.description,
                generalLocation: e.generalLocation,
                specificLocation: e.specificLocation,
                standard:e.standard,
                id:e.id,
                eqIds : e.equipmentIdList,
                fileIds:e.fileIds
            }));
        
            let ignoreFields = ["id", "eqIds","fileIds"];
            let table = await createTableWithFunctionFromObjects(items, ignoreFields,showPointOnPid);
            content.appendChild(table)
            let lastScrollTop = 0;
            content.addEventListener('scroll', function() {
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

async function showPointOnPid(point,element){
    let eqId = point.eqIds[0];
    if(!eqId){
        getPanelSchedules(point,element);
        return;
    }
    let eq = await getPoint(eqId);
    let file = await getFileByLink (eq.mainFile);
    if(!fileWithPoints || fileWithPoints.id!==file.id) await loadPictureWithLightFile(file);
    requestAnimationFrame(async () => {
        selectedArea = eq;
        highlightEq(eqId);
        // await fillPointInfoWindow(eq);
    }); 

}

function getPanelSchedules(lp,element){
    let ids = lp.fileIds.replace(/ /g,"").split(",");
    ids.forEach(i=>console.log(i))
    let files = fileRepository.filter(f=>{
        // console.log(f.id);
        return ids.includes(f.id.toString());
        
    });
    if(files.length===1)loadPictureWithLightFile(files[0]);
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
        item.addEventListener('click',()=>loadPictureWithLightFile(f))
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

