function buildFileTable(tableContainer){
    tableContainer.innerHTML="";
    let ignoreFields = ["id"];
    let table = createTableWithFunctionFromObjects(fileRepository, ignoreFields,showEquipmentOnPid);
    
    tableContainer.appendChild(table);
 
    let lastScrollTop = 0;
    tableContainer.addEventListener('scroll', function() {
        const scrollPosition = this.scrollTop + this.clientHeight;
        const tableHeight = this.scrollHeight;
        let currentScrollTop = this.scrollTop;
    
        if (tableHeight - scrollPosition < 500 && currentScrollTop > lastScrollTop) {
            tableDisplayControl(table, false);
        } else if (this.scrollTop < 500 && currentScrollTop < lastScrollTop) {
            tableDisplayControl(table, true);
        }
    
        lastScrollTop = currentScrollTop;
    });
 }