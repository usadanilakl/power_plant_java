function dbClick(element, oneClickFunc, twoClickFunc) {
    let counter = 0;
    const clickCounter = () => {
        counter++;
        if (counter === 1) {
            setTimeout(() => {
                if (counter === 1) {
                    oneClickFunc();
                } else if (counter > 1) {
                    twoClickFunc();
                }
                counter = 0; // reset counter
            }, 300);
        }
    };
    element.addEventListener('click', clickCounter);
}

function toggleBoolean(booleanVariable){
    if(booleanVariable) booleanVariable = false;
    else booleanVariable = true;
}

function hide(element){
    element.classList.add('hide');
}

async function loadDataIntoContainer(container,data){
    let content = await data();
    container.innerHTML = content;
}

function firstLetterToUpperCase(sentence){
    let res = "";
    for (let word of sentence.split(",")) {
        let result = word.trim().toLowerCase();
        result = result.substring(0,1).toUpperCase()+result.substring(1);
        res +=result+" ";
    }
    return res.trim();
}

