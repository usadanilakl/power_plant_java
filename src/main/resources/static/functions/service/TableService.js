let searchValues = [];
let filteredArray = [];
let lastSortedBy = "";

/*************
 * <table class="table table-dark">
                <thead class="sticky-top">
 */

function createTableFromObjects(objects){
    filteredArray = objects;
    let table = document.createElement('table');
    table.classList.add('table');
    table.classList.add('table-dark');
    let thead = document.createElement('thead');
    thead.classList.add('sticky-top');
    table.appendChild(thead);
    let header = document.createElement('tr');
    thead.appendChild(header);

    for(let e in objects[0]){
        let th = document.createElement('th');
        header.appendChild(th);
        let search = document.createElement('input');
        th.appendChild(search);
        search.setAttribute('type','text');
        search.setAttribute('placeholder','filter');
        filteredArray = filterObjects(e,search.value,objects);
        search.addEventListener('change', ()=>createTableFromObjects(filteredArray));
        let button = document.createElement('button');
        th.appendChild(button);
        button.textContent = e;
        button.addEventListener('click',()=>{
            sortObjects(e);
            createTableFromObjects(filteredArray);
        });
    }

    let tbody = document.createElement('tbody');
    table.appendChild(tbody);
    filteredArray.forEach(el=>{
        let row = document.createElement('tr');
        tbody.appendChild(row);
        for(let key in el){
            let td = document.createElement('td');
            td.textContent = el[key];
            row.appendChild(td);
        }
    })
    return table;
}

function filterObjects(key,value, objects){
    return objects.filter(e=>{
        e[key].trim().toLowerCase().includes(value.trim().toLowerCase());
    })
}

function sortObjects(key){
    if(lastSortedBy !== key){
            filteredArray.sort((a,b)=>{
            return a[key] - b[key];
        });
        lastSortedBy = key;
    }else{
        filteredArray.sort((a,b)=>{
            return b[key] - a[key];
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

