/************************************************************************************************************************************ *
 * Open Window with Points when deliting value and some items using it
************************************************************************************************************************************ */

//Open new Window
//Set header to say what category is being changed
//Set text: Change "VALUE NAME" to "_____________" (underscore is an input field)
//display items returned from server by delete end point. 


function isValue(item) {
    return item && typeof item === 'object' && !Array.isArray(item) && item.objectType === "Value";
}

function validateCategory(category, value){
    let values = valuesByCategory[category].map(e=>e.name);
    if(!values.includes(value)) return category + " doesn't include " + value + " create new value or select existing one";
    else return null;
}

async function isCategory(key){
    if(allAliases.includes(key))return true;
    return false;
}



