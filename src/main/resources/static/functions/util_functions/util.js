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

