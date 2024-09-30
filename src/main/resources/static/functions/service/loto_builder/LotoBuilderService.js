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

            content.appendChild(await buildLotoPointList(selectedLotoPoints))

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

async function buildSearchTableWindow(){
    const currentWindow = document.querySelector('#loto-points-window');
    if(currentWindow) all.removeChild(currentWindow);
    let allInfoWindow = getEmptyWindow('LOTO Points');
            allInfoWindow.style.width = 'fit-content';
            allInfoWindow.style.height = 'fit-content';
            allInfoWindow.style.minWidth = '30%';
            allInfoWindow.style.maxHeight = '90%';
            allInfoWindow.style.maxWidth = '50%';
            allInfoWindow.id = 'loto-points-table-window';

            allInfoWindow.style.right = 0 + 'px';
            allInfoWindow.style.bottom = 0+ 'px';
            document.getElementById('all').appendChild(allInfoWindow);

            let content = document.createElement('div');
            allInfoWindow.appendChild(content);
            content.style.position = 'relative';
            content.style.padding = '20px';
            content.style.overflow = 'auto';

            await getAllLotoPoints();
            let items = allLotoPoints.map(e => ({
                tagNumber: e.tagNumber,
                description: e.description,
                generalLocation: e.generalLocation,
                specificLocation: e.specificLocation,
                standard:e.standard,
                id:e.id,
                eqIds : e.equipmentIdList
            }));
        
            let ignoreFields = ["id", "eqIds"];
            let table = createTableWithFunctionFromObjects(items, ignoreFields,showPointOnPid);
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

function showPointOnPid(point){
    console.log('showing point '+point.tagNumber)
}

