function backAndForthButtons(){
    let back = document.getElementById('back');
    let forward = document.getElementById('forward');
    
    back.addEventListener('click',()=>{
        if(backAndForthIndex>0)backAndForthIndex--;
        showJpg2(backAndForthArray[backAndForthIndex]);
        //console.log(backAndForthIndex);
    });
    forward.addEventListener('click',()=>{
        if(backAndForthIndex<backAndForthArray.length-1)backAndForthIndex++;
        showJpg2(backAndForthArray[backAndForthIndex]);
        
    })
}