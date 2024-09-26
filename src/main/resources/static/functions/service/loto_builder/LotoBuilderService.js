let selectedLotoPoints = [];
let selectorIsEnabled = false;

async function fillSelectedPointsWindow(){
    const currentWindow = document.querySelector('#loto-points-window');
    if(currentWindow) all.removeChild(currentWindow);
    let allInfoWindow = getEmptyWindow('LOTO Points');
            allInfoWindow.style.width = 'fit-content';
            allInfoWindow.style.height = 'fit-content';
            allInfoWindow.id = 'loto-points-window';

            allInfoWindow.style.right = 0 + 'px';
            allInfoWindow.style.bottom = 0+ 'px';
            document.getElementById('all').appendChild(allInfoWindow);

            allInfoWindow.appendChild(await buildLotoPointList(selectedLotoPoints))

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

