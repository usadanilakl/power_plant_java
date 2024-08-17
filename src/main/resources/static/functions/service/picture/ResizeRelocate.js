import CoordinateCalculator from "./CoordinateCalculator";

class ResizeRelocate{
    static OLD_WIDTH;
    static ACTIVE_HIGHLIGHTS = [];

    static zoomPicture(){

        let size = picture.getBoundingClientRect();
        let startW = picture.offsetWidth; // get current width of picture
        let startH = picture.offsetHeight;
        let correction = window.innerWidth*0.028
        correction = 0 //to turn off correction (it was caused by menu, now they overlap and no need for correction)
        
        //finding the original spot where mosue is pointed before zooming
        let areaX = event.clientX - size.left;
        let areaY = event.clientY - size.top;
        
        // get new spot on the picture where mouse is currently pointing at
        let newAreaX = event.clientX - size.left; 
        let newAreaY = event.clientY - size.top;
        
        //find original picture position
        let startPictureX = picture.offsetLeft;
        let startPictureY = picture.offsetTop;
        
        let width = picture.offsetWidth;
        let scale = width;
        
        let zoomIn = 1.2;
        let zoomOut = 0.8;
        
        //scroll in
        if (event.deltaY < 0 && startW/window.innerWidth < 25) {
            scale *= zoomIn;
            areaX = areaX*zoomIn-correction; //this is X of where mosue was pointed before zooming
            areaY *= zoomIn; //this is Y of where mosue was pointed before zooming
            
                
        //scroll out   
        }else if(event.deltaY>0 && startW/window.innerWidth>0.2){
            scale *=zoomOut;
            areaX = areaX*zoomOut+correction; //this is X of where mosue was pointed before zooming
            areaY *= zoomOut; //this is Y of where mosue was pointed before zooming
            
        }
            // Apply the new scale to the picture
            picture.style.width = scale + 'px';
            event.preventDefault();
            let newPictureX = newAreaX - areaX + startPictureX;
            let newPictureY = newAreaY - areaY + startPictureY;
        
            picture.style.left = `${newPictureX}px`;
            picture.style.top = `${newPictureY}px`;
            resizeAreas(); 
            resizeHighlights(); 
            //resizeManualHighlites(); 
        
    }

    static resizeAreas(){
        const rect = picture.getBoundingClientRect();
        const width = rect.width;
        const coefficient = width/ResizeRelocate.OLD_WIDTH;
        let allAreas = document.querySelectorAll(".ar");
    
        allAreas.forEach(e=>{
            let coord = e.getAttribute('coords').split(",");
            for(let i = 0; i<coord.length; i++){
                coord[i] = coord[i]*coefficient;
            }
            e.setAttribute('coords', ""+coord.join(","));
        });
    
        ResizeRelocate.OLD_WIDTH = width;
    }

    static resizeHighlights(){
        let allHighlites = document.querySelectorAll('.areaHighlights');
        allHighlites.forEach(e=>{
            let area = document.getElementById(e.getAttribute('id').slice(0,-1));
           e.style.top = CoordinateCalculator.areaStringToXywhObject(area).y; 
           e.style.left = CoordinateCalculator.areaStringToXywhObject(area).x;
           e.style.width = CoordinateCalculator.areaStringToXywhObject(area).w;
           e.style.height = CoordinateCalculator.areaStringToXywhObject(area).h;
        })
    }

    static relocateHighlightsWithPicture(event){
        //let allHighlights = [...activeHighlights];
    
        let highlightPosition = [];
        ResizeRelocate.ACTIVE_HIGHLIGHTS.forEach(e=>{
            highlightPosition.push({top:e.offsetTop, left:e.offsetLeft}); // get current position of each highlight
        });
        
        let picPosition = {top:picture.offsetTop, left:picture.offsetLeft} // get current position of picture
    
        let startX = event.clientX; // get current position of mouse
        let startY = event.clientY;
    
        const handleMouseMove = (event) =>{
            let changeX = startX-event.clientX;
            let changeY = startY-event.clientY;
    
            let i = 0;
            ResizeRelocate.ACTIVE_HIGHLIGHTS.forEach(e=>{
                e.style.top = highlightPosition[i].top - changeY + 'px';
                e.style.left = highlightPosition[i].left - changeX + 'px';
                i++;
            });
    
            picture.style.top = picPosition.top - changeY + "px";
            picture.style.left = picPosition.left - changeX + "px";
    
        }
    
        const handleMouseUp = ()=>{
            document.removeEventListener('mousemove', handleMouseMove);
        }
    
        document.addEventListener('mousemove',handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    
    
    }
}
export default ResizeRelocate;