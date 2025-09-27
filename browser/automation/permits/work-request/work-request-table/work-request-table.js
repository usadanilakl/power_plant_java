const workRequestTable = {
    selectedFile: {},
    rowClickHandler: null,
    container: 'tableContainer',

    buildTable: function(items) {

        if(!items || !items.length || items.length === 0){
            document.getElementById(this.container).textContent = 'loading...';
        }

        const columns = [
            { name: 'company', inputType: 'text' },
            { name: 'location', inputType: 'text' },
            { name: 'affectedEquipment', inputType: 'text' },
            { name: 'workScope', inputType: 'text' },
            { name: 'dateOfWorkToBePerformed', inputType: 'text' },
            { name: 'timeOfWorkToBePerformed', inputType: 'text' },
            { name: 'requestedBy', inputType: 'text' },
            { name: 'isHotWorkRequired', inputType: 'text' },
            { name: 'foreman', inputType: 'text' },
            { name: 'fireWatch', inputType: 'text' },
            { name: 'isLotoRequired', inputType: 'text' },
            { name: 'isConfinedSpaceEntryRequired', inputType: 'text' },
            { name: 'space', inputType: 'text' },
            { name: 'sharepointId', inputType: 'text' },
        ];

        tableBuilder.buildTable(items, columns, this.container);

        // Remove existing event listener if it exists
        if (this.rowClickHandler) {
            document.removeEventListener('rowClick', this.rowClickHandler);
        }

        // Create new event listener
        this.rowClickHandler = (event) => {
            workRequestService.openBuilder();
        };

        // Add the new event listener
        document.addEventListener('rowClick', this.rowClickHandler);
    },

    // Add a method to remove the event listener when needed
    removeEventListener: function() {
        if (this.rowClickHandler) {
            document.removeEventListener('rowClick', this.rowClickHandler);
            this.rowClickHandler = null;
        }
    }
};

