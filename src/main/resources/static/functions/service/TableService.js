let searchValues = [];
let filteredArray = [];
let lastSortedBy = "";

/*************
 * <table class="table table-dark">
                <thead class="sticky-top">
 */

function createTableFromObjects(objects){
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

    for(let e in objects[0]){
        let th = document.createElement('th');
        header.appendChild(th);
        let search = document.createElement('input');
        th.appendChild(search);
        search.setAttribute('type','text');
        search.setAttribute('placeholder','filter');
        search.addEventListener('change', ()=>{
            filteredArray = filterObjects(e,search.value,objects);
            tableContainer.innerHTML = "";
            tableContainer.appendChild(createTableFromObjects(filteredArray));
    });
        let button = document.createElement('button');
        th.appendChild(button);
        button.textContent = e;
        button.addEventListener('click',()=>{
            sortObjects(e);
            tableContainer.innerHTML = "";
            tableContainer.appendChild(createTableFromObjects(filteredArray));
        });
    }

    let tbody = document.createElement('tbody');
    table.appendChild(tbody);
    let i = 1;
    filteredArray.forEach(el=>{
        let row = document.createElement('tr');
        tbody.appendChild(row);

        let indexData = document.createElement('td');
        indexData.textContent = i++;
        row.appendChild(indexData);

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
        //console.log(e[key] + ", " + value);
        return String(e[key]).trim().toLowerCase().includes(value.trim().toLowerCase());
    })
}

function sortObjects(key){
    console.log(lastSortedBy);
    if(lastSortedBy !== key){
        console.log(key)
            filteredArray.sort((a,b)=>{
                return a[key].toString().localeCompare(b[key].toString());
        });
        lastSortedBy = key;
    }else{
        filteredArray.sort((a,b)=>{
            return b[key].toString().localeCompare(a[key].toString());
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
