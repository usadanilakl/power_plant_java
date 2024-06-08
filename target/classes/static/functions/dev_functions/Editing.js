//const { get } = require("mongoose");

let currentX = 0;
let currentY = 0;
let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;
let height= 0;
let width = 0;

let cX = 0;
let cY = 0;
let sX = 0;
let sY = 0;

let area = {
    startX:0,
    startY:0,
    endX: 0,
    endY: 0,
    width: 0,
    height: 0
  };

  let obj = {
    id:"##-XXXX###", 
    name:"name", 
    description:"description",
    type:"line",
    location:"location",
    pid:"pid number",
    system:"system",
    vendor:"Kiewit",
    ht:"n/a",
    br:"n/a", 
    originalSize: {
                    width: 0,
                    height: 0
                  },
    area:   {
              startX:0,
              startY:0,
              endX: 0,
              endY: 0,
              width: 0,
              height: 0
            },
    manuals:{
                full:"full",
                maintenance:"maintenance",
                ops:"ops",
                sop:"SOP",
                eop:"EOP",
                loto:"LOTO"
            }
}


let highliterArray = [];
let eType = "line";


function resizeManualHighlites(){
    highliterArray.forEach(e=>{  //
       let coords = JSON.stringify(e.id).slice(1,-1);
       e.element.style.top = manualHighlighterPosition(coords).y; 
       e.element.style.left = manualHighlighterPosition(coords).x;
       e.element.style.width = manualHighlighterPosition(coords).width;
       e.element.style.height = manualHighlighterPosition(coords).height;
    })
}

function manualHighlighterPosition(coord){
    let picture = document.getElementById('image');
    const coefficient = picture.offsetWidth/picture.naturalWidth;
    let coords = coord.split(",");

    for(let i = 0; i<coords.length; i++){
        coords[i] *= coefficient;
    }

    let wid = (coords[2]-coords[0])+'px'; 
    let heigh = (coords[3]-coords[1])+'px'; 
    let y = parseFloat(coords[1])+picture.offsetTop + "px";
    let x = parseFloat(coords[0])+picture.offsetLeft + "px";

    return {width:wid, height:heigh, y:y, x:x};
}

function handleMouseDown(event) {
        if(event.button===2){
        
        let picture = document.getElementById('image');
        let all = document.getElementById('objects');
        let imgContainer = document.getElementById('img-container');

        let highlight = document.createElement('div');
        highlight.setAttribute('class', 'hglt');
        all.appendChild(highlight);
        highliterArray.push({element:highlight});
        drag(highlight, imgContainer);

        console.log(event.clientY);
        console.log(picture.offsetTop);

        startX = event.clientX - picture.offsetLeft;
        startY = event.clientY - picture.offsetTop;

        sX = event.clientX;
        sY = event.clientY;

        area.startX = startX;
        area.startY = startY;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup',handleMouseUp);    
    }
}
      
function handleMouseMove(event) {
        currentX = event.clientX - picture.offsetLeft;
        currentY = event.clientY - picture.offsetTop;

        let highlight = highliterArray[highliterArray.length-1].element;
        highlight.style.width = (currentX-startX)+'px';
        highlight.style.height = (currentY-startY)+'px';
        highlight.style.border = '2px solid blue';
        highlight.style.position = 'fixed';
        highlight.style.top = sY+'px';
        highlight.style.left = sX+'px';
        highlight.style.zIndex = '10';

}

async function handleMouseUp() {

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        area.endX = currentX;
        area.endY = currentY;
        area.width = (currentX-startX);
        area.height = (currentY-startY);
        endX = currentX;
        endY = currentY;
        width = (currentX-startX);
        height = (currentY-startY);
        await offsetSizing(picture);
        await sendCoordinates();

        let id = startX + ',' + startY+ ','+ endX + ',' + endY;
        let picSize = picture.offsetWidth;
        highliterArray[highliterArray.length-1].id = id;
        highliterArray[highliterArray.length-1].picSize = picSize;
  
        if(endX-startX < 20 && endY - startY < 20) removeLastHighlite();
}

async function offsetSizing(picture){

    const coefficientX = picture.naturalWidth/picture.offsetWidth;

   startX = Math.floor(startX*coefficientX);
   startY = Math.floor(startY*coefficientX);
   endX = Math.floor(endX*coefficientX);
   endY = Math.floor(endY*coefficientX);
   width = Math.floor(width*coefficientX);
   height = Math.floor(height*coefficientX);

   area.startX = Math.floor(startX*coefficientX);
   area.startY = Math.floor(startY*coefficientX);
   area.endX = Math.floor(endX*coefficientX);
   area.endY = Math.floor(endY*coefficientX);
   area.width = Math.floor(width*coefficientX);
   area.height = Math.floor(height*coefficientX);
    
}

async function sendCoordinates(){
console.log('sending coords');
const url = '/dev/cut_picture';
fetch(url,{
    method: 'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({x:startX, 
                          y:startY, 
                          width: (width), 
                          height: (height),
                          picture: picture.getAttribute('src'),
                          type: eType
                        })
})
    .then(response =>response.json())
    .then(data=>{
      obj.id = String(data.info.toUpperCase());
      console.log(obj.id);
      fillInfoWindow(obj);
      document.getElementById('cutimage').setAttribute('src','/cutImage.jpg?'+new Date().getTime());
    })
    .catch(error => {
        console.error('Error:', error);
        throw new Error('Failed to send post request');
})
}

function removeLastHighlite(){
    let i = highliterArray.length-1;
    highliterArray.pop().element.remove();
}

async function confirmCoords(){
    fetch('/dev/confirm_coordinates',{
      method: 'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(obj)
  })
  .then(response =>{
    let infoWindow = document.getElementById('infoWindow');
    infoWindow.innerHTML = "";
    response.json().then(data => {
      infoWindow.innerHTML = JSON.stringify(data.message);
    });
  })
  .catch(error => {
    console.error('Error:', error);
  })
  
}
  
async function updateAndConfirm(){
      id = document.getElementById('equipmentId').value;
      obj.id = id;
      console.log(obj.id);
      confirmData(); 
}

function floatingMenuPosition(top,left){
    let w = floatingMenu.offsetWidth;
  
    floatingMenu.style.top = top+'px';
    floatingMenu.style.left = left+'px';
    floatingMenu.style.width = w+'px';
}

function setEquipmentType(type){
    obj.type = String(type);
    eType = type;
    let screenshot = document.getElementById('cutimage');
    let eqIDtext = document.getElementById('equipmentId');
    let floatingWindow = document.getElementById('floatingMenu');
    let dropdownMenu = document.getElementById('one');
    let confirmButton = document.getElementById('confirm');
    let removeButton = document.getElementById('remove');
   
   // let buttonText = 10;
  
    if(type === 'line'){
      //buttonText=14;
      screenshot.style.alignSelf ="center";
      screenshot.style.height = '130px';
      screenshot.style.width = '330px';
      eqIDtext.style.fontSize = '20px';
      floatingWindow.style.height='120px';
      floatingWindow.style.width='350px';
      dropdownMenu.style.width='200px';
      confirmButton.style.width='80px';
      removeButton.style.width='80px';
      dropdownMenu.style.height='25px';
      confirmButton.style.height='25px';
      removeButton.style.height='25px';
    }else if(type==='manualValve'){
      screenshot.style.alignSelf ="center";
      screenshot.style.height = '110px';
      screenshot.style.width = '170px';
      eqIDtext.style.fontSize = '26px';
      floatingWindow.style.height='170px';
      floatingWindow.style.width='180px';
      dropdownMenu.style.width='80px';
      confirmButton.style.width='50px';
      removeButton.style.width='50px';
      dropdownMenu.style.height='20px';
      confirmButton.style.height='20px';
      removeButton.style.height='20px';
  
    }else if(type==='instrument'){
      screenshot.style.alignSelf ="center";
      screenshot.style.height = '110px';
      screenshot.style.width = '170px';
      eqIDtext.style.fontSize = '19px';
      floatingWindow.style.height='170px';
      floatingWindow.style.width='180px';
      dropdownMenu.style.width='80px';
      confirmButton.style.width='50px';
      removeButton.style.width='50px';
      dropdownMenu.style.height='20px';
      confirmButton.style.height='20px';
      removeButton.style.height='20px';
  
    } else if(type==='AOV'){
      screenshot.style.alignSelf ="center";
      screenshot.style.height = '130px';
      screenshot.style.width = '170px';
      eqIDtext.style.fontSize = '19px';
      floatingWindow.style.height='190px';
      floatingWindow.style.width='180px';
      dropdownMenu.style.width='80px';
      confirmButton.style.width='50px';
      removeButton.style.width='50px';
      dropdownMenu.style.height='25px';
      confirmButton.style.height='25px';
      removeButton.style.height='25px';
  
  } else if(type==='MOV'){
    screenshot.style.alignSelf ="center";
      screenshot.style.height = '130px';
      screenshot.style.width = '170px';
      eqIDtext.style.fontSize = '19px';
      floatingWindow.style.height='190px';
      floatingWindow.style.width='180px';
      dropdownMenu.style.width='80px';
      confirmButton.style.width='50px';
      removeButton.style.width='50px';
      dropdownMenu.style.height='25px';
      confirmButton.style.height='25px';
      removeButton.style.height='25px';
  
    }  else if(type==='SOV'){
      screenshot.style.alignSelf ="center";
      screenshot.style.height = '130px';
      screenshot.style.width = '170px';
      eqIDtext.style.fontSize = '19px';
      floatingWindow.style.height='190px';
      floatingWindow.style.width='180px';
      dropdownMenu.style.width='80px';
      confirmButton.style.width='50px';
      removeButton.style.width='50px';
      dropdownMenu.style.height='25px';
      confirmButton.style.height='25px';
      removeButton.style.height='25px';
    } 
  
}

function relocate(event,element){
    let viewportW = window.innerWidth;
    let viewportH = window.innerHeight;
    let viewportL = event.offsetLeft;
    let viewportT = event.offsetTop;

    let elRec = element.getBoundingClientRect();

    let all = document.getElementById('all');
    let w = element.offsetWidth;
    let position = {
        startX : event.clientX,
        startY : event.clientY,
        elX : element.offsetLeft,
        elY : element.offsetTop,
    }


    const mouseMove = (event) =>{
        let changeX = position.startX-event.clientX;
        let changeY = position.startY-event.clientY;
        element.style.top = position.elY-changeY + 'px';
        element.style.left = position.elX-changeX + 'px';
        element.style.width = w+'px';
    }

    const mouseUp = ()=>{
      let elSize = element.getBoundingClientRect();
        document.removeEventListener('mousemove', mouseMove);
        
        if(element.getBoundingClientRect().bottom > window.innerHeight){
          element.style.top = (window.innerHeight - element.offsetHeight) + 'px';
        } 
        if(element.getBoundingClientRect().y < 0){
          element.style.top = '0px';
        } 
        if(element.offsetLeft < 0){
          element.style.left = '0px';
        } 
        if(element.getBoundingClientRect().right > window.innerWidth){
          element.style.left = (window.innerWidth - element.offsetWidth) + 'px';
        }



    }

    document.addEventListener('mousemove',mouseMove);
    document.addEventListener('mouseup', mouseUp);
}

function fillInfoWindow(object){
    let id = document.getElementById('equipmentId');
    id.value = object.id;
  }


  


  document.addEventListener('keydown',(event)=>{
    if(event.key === 'Control'){ctrlPressed=true}
    if(event.key==='ArrowUp' && ctrlPressed) {
      //event.preventDefault();
      updateAndConfirm()
      //console.log(ctrlPressed)
    }
  });
  
  document.addEventListener('keyup',(event)=>{
    if(event.key === 'Control'){ctrlPressed = false}
    //console.log(ctrlPressed)
  })
  
  document.addEventListener('keydown',(event)=>{
    if(event.key === 'Control'){ctrlPressed=true}
    if(event.key==='ArrowDown' && ctrlPressed) {
      //event.preventDefault();
      removeLastHighlite()
      //console.log(ctrlPressed)
    }
  });
  
  document.addEventListener('keyup',(event)=>{
    if(event.key === 'Control'){ctrlPressed = false}
    //console.log(ctrlPressed)
  })
  
  document.addEventListener('click',(event)=>{
    event.stopPropagation();
    event.stopImmediatePropagation();
    if(event.button === 1) {
      updateAndConfirm();
    }
  })

  document.addEventListener('contextmenu', function(event){
    event.preventDefault();
    floatingMenuPosition(event.clientY,event.clientX);
    if(floatingMenu.getBoundingClientRect().right > window.innerWidth){
          floatingMenu.style.left = (window.innerWidth - floatingMenu.offsetWidth) + 'px';
      }
      if(floatingMenu.getBoundingClientRect().bottom > window.innerHeight){
        floatingMenu.style.top = (window.innerHeight - floatingMenu.offsetHeight) + 'px';
          } 
  });

  bar.addEventListener('mousedown',()=>{relocate(event,floatingMenu)});

  //document.addEventListener('mousedown',handleMouseDown);

  document.addEventListener('mousedown', function(event){
    if (!event.target.matches('.dropdown') && !event.target.matches('#equipmentId')) {
      event.preventDefault();
    }
    if(event.button === 2){
      event.preventDefault();
      handleMouseDown(event);
      
    } 
  });

  setEquipmentType('line');
  /*******************************************BUILDING OBJECT MENU*************************************************** */
  
  async function getFileObjects(path, cb){
    fetch(`/dev/show_all_files?path=${path}`,{
        method:'GET',
        headers: {'Content-Type':'application/json'}
    }).then(res=>res.json())
      .then(data=>{
        console.log('data',data.files)
        cb(data.files);
      });
  }

  function createNewFolder(path){
    fetch('/dev/create_new_folder',(res,rej)=>{

    });
  }

  function retrieve(data){
    console.log(data);
  }

  //getFileObjects('public/database/',retrieve);
  
/**************************************************************************
 1. when file is open, use link to get all assosiated areas
 2. display all created categories
 3. at the end of the list add + button to add new category
 4. on click open list of area types for each category grouped by type with + button to add new type
 5. on click open list of areas for that type
 6. on click highlight area on P&ID and display all fields for that area
 7. double click on field to edit
 8. double click on area to enable relocation
 ***************************************************************************/
  
 /****************************************************************************
  1. On click on object file: read categories, create list, append to object item
  2. On click on category item, read types file in categories, create list append to item
  3. On click on type item, read this files objects, get this type, make list, append to this item
  ***************************************************************************/
     


