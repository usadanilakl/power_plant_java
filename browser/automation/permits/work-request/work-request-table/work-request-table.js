const workRequestTable = {
    selectedFile: {},
    rowClickHandler: null,
    container: 'tableContainer',

    buildTable: function(items,callback = null) {

        if(!items || !items.length || items.length === 0){
            document.getElementById(this.container).textContent = 'loading...';
        }

        // const columns = [
        //     { name: 'company', inputType: 'text' },
        //     { name: 'location', inputType: 'text' },
        //     { name: 'affectedEquipment', inputType: 'text' },
        //     { name: 'workScope', inputType: 'text' },
        //     { name: 'dateOfWorkToBePerformed', inputType: 'text' },
        //     { name: 'timeOfWorkToBePerformed', inputType: 'text' },
        //     { name: 'requestedBy', inputType: 'text' },
        //     { name: 'isHotWorkRequired', inputType: 'text' },
        //     { name: 'foreman', inputType: 'text' },
        //     { name: 'fireWatch', inputType: 'text' },
        //     { name: 'isLotoRequired', inputType: 'text' },
        //     { name: 'isConfinedSpaceEntryRequired', inputType: 'text' },
        //     { name: 'space', inputType: 'text' },
        //     { name: 'sharepointId', inputType: 'text' },
        // ];
        const columns = [
            { name: 'company', inputType: 'text', label: 'Company' },
            { name: 'location', inputType: 'text', label: 'Location' },
            { name: 'affectedEquipment', inputType: 'text', label: 'Affected Equipment' },
            { name: 'workScope', inputType: 'text', label: 'Work Scope' },
            { name: 'dateOfWorkToBePerformed', inputType: 'text', label: 'Date of Work' },
            { name: 'timeOfWorkToBePerformed', inputType: 'text', label: 'Time of Work' },
            { name: 'status', inputType: 'text', label: 'Status' },
            { name: 'requestedBy', inputType: 'text', label: 'Requested By' },
            { name: 'isHotWorkRequired', inputType: 'text', label: 'Hot Work Required' },
            { name: 'foreman', inputType: 'text', label: 'Foreman' },
            { name: 'fireWatch', inputType: 'text', label: 'Fire Watch' },
            { name: 'isLotoRequired', inputType: 'text', label: 'LOTO Required' },
            { name: 'isConfinedSpaceEntryRequired', inputType: 'text', label: 'Confined Space Entry' },
            { name: 'space', inputType: 'text', label: 'Space' },
            { name: 'sharepointId', inputType: 'text', label: 'Received At' },
        ];


        if (items) {
            items.forEach(item => {
                if (item.dateOfWorkToBePerformed) {
                    const date = new Date(item.dateOfWorkToBePerformed);
                    const formattedDate = date.toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        timeZone: 'UTC'  // Force UTC for consistent date display
                    });
                    item.dateOfWorkToBePerformed = formattedDate;
                    console.log('Formatted date: ', item.dateOfWorkToBePerformed);
                }

                if(item.sharepointId){
                    item.sharepointId = formatSharepointIdToDateTime(item.sharepointId);

                    console.log('Formatted id: ',item.sharepointId)
                }
            });
        }

        tableBuilder.buildTable(items, columns, this.container);

        // Remove existing event listener if it exists
        if (this.rowClickHandler) {
            document.removeEventListener('rowClick', this.rowClickHandler);
        }

        // Create new event listener
        this.rowClickHandler = (event) => {
            const id = event.detail.data.id;
            // if(!callback)workRequestService.openBuilder(id);
            if(!callback)showActionMenu(id);
            else callback(event.detail.data);
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

function formatSharepointIdToDateTime(dateTimeString) {
    // Extract components using substring
    const year = parseInt(dateTimeString.substring(0, 4), 10);
    const month = parseInt(dateTimeString.substring(4, 6), 10) - 1; // Month is 0-based in JS
    const day = parseInt(dateTimeString.substring(6, 8), 10);
    const hour = parseInt(dateTimeString.substring(8, 10), 10);
    const minute = parseInt(dateTimeString.substring(10, 12), 10);
    const second = parseInt(dateTimeString.substring(12, 14), 10);

    // Create Date object
    const date = new Date(year, month, day, hour, minute, second);

    // Format to readable string, e.g. "MM/DD/YYYY HH:mm:ss"
    const formatted = date.toLocaleString(undefined, {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });

    return formatted;
}

function showActionMenu(id) {
  // Create overlay background
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  });

  // Create popup container
  const popup = document.createElement('div');
  Object.assign(popup.style, {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: '200px',
  });

  // Button labels and actions as functions
  const buttons = [
    { label: 'Build', action: () => workRequestService.openBuilder(id) },
    { label: 'Archive', action: () => workRequestService.archive(id) },
    // { label: 'Delete', action: () => workRequestService.delete(id) },
    // { label: 'View', action: () => workRequestService.viewDetails(id) }
  ];

  buttons.forEach(({ label, action }) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.padding = '8px 12px';
    btn.style.fontSize = '1em';
    btn.style.cursor = 'pointer';
    btn.onclick = () => {
      action();  // Call assigned action on click
      document.body.removeChild(overlay);
    };
    popup.appendChild(btn);
  });

  // Append popup to overlay then overlay to body
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // Clicking outside popup closes it
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  };
}



