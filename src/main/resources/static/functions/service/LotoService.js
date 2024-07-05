let lotoWindow = null;

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
}

function addPointToLotoWindow(point){
    if(modes.lotoMode.state){
        let tbody = lotoWindow.querySelector('tbody');
        let index = tbody.rows.length;
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

    for(let key in object){
        let td = document.createElement('td');
        td.textContent = object[key];
        row.appendChild(td);
    }
    return row;
}