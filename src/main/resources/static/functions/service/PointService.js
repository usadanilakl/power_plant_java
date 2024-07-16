function getExcelPointsByLabel(label){
    let result = [];
    revisedExcelPoints.forEach(e=>{
        if(formatLabel(e.label).includes(formatLabel(label)) ) result.push(e);
    })
    return result;
}

function formatLabel(label){
    // console.log("label: "+label)
    let result = label.toLowerCase();
    result = result.trim();
    result = result.replace(/-/g, "");
    if(result.startsWith("01") || result.startsWith("02") || result.startsWith("00") || result.startsWith("**")) result = result.substring(2);
    // console.log("result: "+result)
    return result;
}

function trimToLowerCaseRemoveDashes(label){
        let result = label.toLowerCase();
        result = result.trim();
        result = result.replace(/-/g, "");
        return result;
}

function showPointInfo(point){
    let form = document.createElement('form');
    for(let e in point){
        let div = document.createElement('div');
        form.appendChild(div);
        div.classList.add('form-group');
        let label = document.createElement('label');
        div.appendChild(label);
        label.setAttribute('for',e);
        label.textContent = e;
        let input = document.createElement('input');
        div.appendChild(input);
        input.setAttribute('id',e);
        input.classList.add('form-control');
        input.value = point[e];
        input.readOnly = true;
    }
    return form;
}

function excelPointDropdown(points){
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

        button.textContent = e.label;
        button.addEventListener('click', ()=>{
            if(formContainer.children.length === 0){
                formContainer.appendChild(showPointInfo(e));
            }else{
                formContainer.innerHTML = "";
            }
        });
        let addButton = document.createElement('button');
        buttons.appendChild(addButton);
        addButton.classList.add('addButtons');
        addButton.textContent = "ADD";
        // if(!modes.lotoMode.status) addButton.classList.add('hide');
        // else addButton.classList.remove('hide');
        addButton.addEventListener('click',()=>addPointToLotoWindow(e));
    });
    return list;
}

async function fillPointInfoWindow(id){
    console.log("point window is loading")
    let form = await getPointInfoForm(id);
    let infoFrame = document.getElementById('infoFramePoint');
    let infoContainer = document.getElementById('infoWindowPoint');
    if(infoContainer === null) newInfoWindow("Point");
    if(infoFrame.classList.contains('hide')) infoFrame.classList.remove('hide');
    infoContainer.innerHTML = "";
    infoContainer.innerHTML = form;
    createCategoryOptions("equipment");
    createCategoryOptions("vendor");
    createCategoryOptions("location");
    createCategoryOptions("system");
}

async function fillExcelPointInfoWindow(points){
    let form = excelPointDropdown(points);
    let infoFrame = document.getElementById('infoFrameOld-LOTO-Points');
    let infoContainer = document.getElementById('infoWindowOld-LOTO-Points');
    if(infoContainer === null) newInfoWindow("Old-LOTO-Points");
    if(infoFrame.classList.contains('hide')) infoFrame.classList.remove('hide');
    infoContainer.innerHTML = "";
    infoContainer.appendChild(form);
}

function excelPointSearch(searchValue){
    let result = [];
    revisedExcelPoints.forEach(e=>{
        if(trimToLowerCaseRemoveDashes(e.label).includes(trimToLowerCaseRemoveDashes(searchValue)) || trimToLowerCaseRemoveDashes(searchValue).includes(trimToLowerCaseRemoveDashes(e.label))) result.push(e);
    })
    return result;
}

function buildPointSearchField(){
    let div = document.createElement('div');
    div.classList.add('searchInputField');
    let input = document.createElement('input');
    div.appendChild(input);
    input.setAttribute('type','text');
    input.setAttribute('placeholder','search');
    let button = document.createElement('button');
    div.appendChild(button);
    button.textContent = "Search";
    button.addEventListener('click', ()=>{
        let points = excelPointSearch(input.value);
        fillExcelPointInfoWindow(points);
    });
    return div;
} 
