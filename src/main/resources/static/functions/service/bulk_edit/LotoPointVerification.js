async function toggleTableContent(){
    let items = [];
    if(tableContentBtn.textContent==='Show All LOTO Points'){
        tableContentBtn.textContent = "Show Points to verify";
        tableTitle = "Table contains all LOTO Points that are in the System";

        let data = activeLotoPoints;
        items = data.map(e => ({
            tagNumber: e.tagNumber,
            description: e.description,
            generalLocation: e.generalLocation,
            specificLocation: e.specificLocation,
            id:e.id
        }));
    }else{
        tableContentBtn.textContent = "Show All LOTO Points";
        tableTitle = "Table contains LOTO Points that needs to be verified";
        let data = allLotoPoints;
        items = data.map(e => ({
            tagNumber: e.tagNumber,
            description: e.description,
            generalLocation: e.generalLocation,
            specificLocation: e.specificLocation,
            id:e.id
        }));
    }
    let ignoreFields = ["id"];
    let table = createTableFromObjects(items, ignoreFields);
    
    tableContainer.innerHTML = "";
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