let lotoWindow = null;
let lotoPoints = [];

function lotoModeControl(){
    if(modes.lotoMode.state){
        if(lotoWindow === null) setUpLotoWindow();
        document.querySelectorAll('.addButtons').forEach(e=>{
            e.classList.remove('hide');
        })
    }else{
        document.querySelectorAll('.addButtons').forEach(e=>{
            e.classList.add('hide');
        })
        
    }
}

function setUpLotoWindow(){
    let obj = revisedExcelPoints[0];
    let ob = {label:obj.label,description:obj.description}
    lotoWindow = newInfoWindow("Loto");
    lotoWindow.appendChild(createTable(ob));
    lotoWindow.appendChild(updateLotoPointsButton());
}

function addPointToLotoWindow(point){
    if(modes.lotoMode.state){
        let tbody = lotoWindow.querySelector('tbody');
        let index = tbody.rows.length+1;
        tbody.appendChild(createRow(index,point)); 
    }
}

function createTable(object){
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

    for(let e in object){
        let th = document.createElement('th');
        header.appendChild(th);
        let search = document.createElement('input');
        th.textContent = e;
    }

    return table;
}

function createRow(rowNum, obj){
    let object = {label:obj.label,description:obj.description}
    let row = document.createElement('tr');
    let indexData = document.createElement('td');
    indexData.textContent = rowNum;
    row.appendChild(indexData);
    indexData.classList.add('idexData');
    let label = obj.label;

    for(let key in object){
        let td = document.createElement('td');
        td.textContent = object[key];
        row.appendChild(td);
    }

    row.appendChild(createRemoveButton(label))
    addObjectToArr(lotoPoints,obj);
    return row;
}

function addObjectToArr(arr,obj){
    if(!arr.find(e=>e.label===obj.label)) arr.push(obj);
}

function createRemoveButtons(){
    if(lotoWindow!==null){
        let tbody = lotoWindow.querySelector('.tbody');
        tbody.rows.forEach(r=>{
        let td = document.createElement('td');
        r.appendChild(td);
        let button = document.createElement('button');
        td.appendChild(button);
        button.textContent("Remove");
        let label = r.cells[1].value;
        button.addEventListener('click',()=>{
            lotoPoints.filter(e=>!e.label.includes(label));
            tbody.innerHTML = "";
            lotoPoints.forEach(e=>addPointToLotoWindow(e))
        });
        
    });
    }
    
}

function createRemoveButton(label){
    let tbody = lotoWindow.querySelector('tbody');
    let td = document.createElement('td');
    let button = document.createElement('button');
    td.appendChild(button);
    button.textContent = "Remove";
    button.addEventListener('click',()=>{
        for (let i = lotoPoints.length - 1; i >= 0; i--) {
            if (lotoPoints[i].label.includes(label)) {
                lotoPoints.splice(i, 1);
            }
        }
        tbody.innerHTML = "";
        lotoPoints.forEach(e=>addPointToLotoWindow(e))
    });
    
    return td;
    
    
}

async function submitLotoPoints(){
    //get temp loto from server and save it on client side
    let loto = await getTempLoto();
    //Add selected poins to loto
    loto.lotoPoints = lotoPoints;
    //update loto on server (temp loto) and redirect to creating form
    updateTempLoto(loto,token);
    //console.log(JSON.stringify(loto))
}

function updateLotoPointsButton(){
    let button = document.createElement('button');
    button.classList.add();
    button.setAttribute('id','updateLotoPointsButton');
    button.textContent = 'Add Points to LOTO';
    button.addEventListener('click',submitLotoPoints);
    return button;
}