/************************************************************************************************************************************ *
 * Open Window with Points when deliting value and some items using it
************************************************************************************************************************************ */

//Open new Window
//Set header to say what category is being changed
//Set text: Change "VALUE NAME" to "_____________" (underscore is an input field)
//display items returned from server by delete end point. 

function fillValueRefractorWindow(){
    
}

function isValue(item) {
    return item && typeof item === 'object' && !Array.isArray(item) && item.objectType === "Value";
}
