function getExcelPointsByLabel(label){
    let result = [];
    revisedExcelPoints.forEach(e=>{
        if(formatLabel(e.label).includes(formatLabel(label))) result.push(e);
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

function showPointInfo(point){
    let form = document.createElement('form');
    for(let e in point){
        let div = document.createElement('div');
        form.appendChild(div);
        div.classList.add('form-group');
        let label = document.createElement('label');
        div.appendChild(label);
        label.setAttribute('for',e);
        let input = document.createElement('input');
        div.appendChild(input);
        input.setAttribute('id',e);
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
        let formContainer = document.createElement('div');
        item.appendChild(div);
        let button = document.createElement('button');
        item.appendChild(button);
        button.textContent = e.label;
        button.addEventListener('click', ()=>{
            if(formContainer.children.length === 0){
               div.appendChild(showPointInfo(e));
            }else{
                formContainer.innerHTML = "";
            }
        })
    })
    return list;
}
