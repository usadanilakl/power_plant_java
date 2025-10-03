const form = document.querySelector('form');
const STORAGE_KEY = 'workFormBackup';

// Save form data to localStorage on any input change
form.addEventListener('input', () => {
  const formData = new FormData(form);
  const obj = {};
  for (const [key, value] of formData.entries()) {
    // For radio buttons, store only checked value
    obj[key] = value;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
});

// Repopulate form fields on page load
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  const data = JSON.parse(saved);

  for (const [key, value] of Object.entries(data)) {
    const element = form.elements[key];
    if (!element) continue;
    if (element.type === 'radio') {
      // Set checked radio value
      [...form.elements[key]].forEach(r => r.checked = (r.value === value));
    } else if (element.type === 'checkbox') {
      element.checked = Boolean(value);
    } else {
      element.value = value;
    }
  }
  updateDependents();
});

// Optionally, clear localStorage on submit:
form.addEventListener('submit', (event) => {
  event.preventDefault(); 
  const data = saveFormToIndexedDB(event.target);
  submitFormToPowerAutomate(data);
  localStorage.removeItem(STORAGE_KEY);
});


/*************************************************************************************************************************************************************************************************************
 * INDEXED DB OPERATIONS
 ************************************************************************************************************************************************************************************************************/

function saveFormToIndexedDB(form) {
  const data = {};
  Array.from(form.elements).forEach(el => {
    if (!el.name) return;
    if (el.type === 'radio') {
      if (el.checked) data[el.name] = el.value;
    } else if (el.type === 'checkbox') {
      data[el.name] = el.checked;
    } else {
      data[el.name] = el.value;
    }
  });

  // Open IndexedDB database
  const request = indexedDB.open('FormDatabase', 1);

  request.onupgradeneeded = event => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('forms')) {
      db.createObjectStore('forms', { keyPath: 'id', autoIncrement: true });
    }
  };

  request.onsuccess = event => {
    const db = event.target.result;
    const transaction = db.transaction(['forms'], 'readwrite');
    const store = transaction.objectStore('forms');

    // Add form data
    store.add(data).onsuccess = () => {
    console.log('Form data saved:', data);
    };

    transaction.oncomplete = () => {
    form.reset();
    db.close();
    };

  };

  request.onerror = event => {
    console.error('IndexedDB error:', event.target.error);
  };
  return data;
}

function getAllFormsFromIndexedDB(callback) {
  const request = indexedDB.open('FormDatabase', 1);

  request.onupgradeneeded = event => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('forms')) {
      db.createObjectStore('forms', { keyPath: 'id', autoIncrement: true });
    }
  };

  request.onsuccess = event => {
    const db = event.target.result;
    const transaction = db.transaction('forms', 'readonly');
    const store = transaction.objectStore('forms');
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => {
      callback(getAllRequest.result);
      db.close();
    };

    getAllRequest.onerror = () => {
      console.error('Error fetching all forms:', getAllRequest.error);
      callback(null);
      db.close();
    };
  };

  request.onerror = event => {
    console.error('IndexedDB open error:', event.target.error);
    callback(null);
  };
}

function getFormByIdFromIndexedDB(id, callback) {
  const request = indexedDB.open('FormDatabase', 1);

  request.onupgradeneeded = event => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('forms')) {
      db.createObjectStore('forms', { keyPath: 'id', autoIncrement: true });
    }
  };

  request.onsuccess = event => {
    const db = event.target.result;
    const transaction = db.transaction(['forms'], 'readonly');
    const store = transaction.objectStore('forms');
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      callback(getRequest.result || null);
      db.close();
    };

    getRequest.onerror = () => {
      console.error('Error fetching form by id:', getRequest.error);
      callback(null);
      db.close();
    };
  };

  request.onerror = event => {
    console.error('IndexedDB open error:', event.target.error);
    callback(null);
  };
}

function deleteFormFromIndexedDB(id, callback) {
  const request = indexedDB.open('FormDatabase', 1);

  request.onupgradeneeded = event => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('forms')) {
      db.createObjectStore('forms', { keyPath: 'id', autoIncrement: true });
    }
  };

  request.onsuccess = event => {
    const db = event.target.result;
    const transaction = db.transaction(['forms'], 'readwrite');
    const store = transaction.objectStore('forms');
    const deleteRequest = store.delete(id);

    deleteRequest.onsuccess = () => {
      console.log(`Form with id ${id} deleted successfully`);
      callback(true);
      db.close();
    };

    deleteRequest.onerror = () => {
      console.error('Error deleting form:', deleteRequest.error);
      callback(false);
      db.close();
    };
  };

  request.onerror = event => {
    console.error('IndexedDB open error:', event.target.error);
    callback(false);
  };
}

function queryByColumn(storeName, indexName, queryValue, callback) {
  const request = indexedDB.open('FormDatabase', 1);

  request.onupgradeneeded = event => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(storeName)) {
      const objectStore = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
      objectStore.createIndex(indexName, indexName, { unique: false });
    }
  };

  request.onsuccess = event => {
    const db = event.target.result;
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const keyRange = IDBKeyRange.only(queryValue);
    const results = [];
    const cursorRequest = index.openCursor(keyRange);

    cursorRequest.onsuccess = e => {
      const cursor = e.target.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        callback(results);
        db.close();
      }
    };

    cursorRequest.onerror = e => {
      console.error('Cursor error:', e.target.error);
      callback(null);
      db.close();
    };
  };

  request.onerror = event => {
    console.error('IndexedDB open error:', event.target.error);
    callback(null);
  };
}

function areObjectsEqualIgnoreCase(obj1, obj2) {
  const keys1 = Object.keys(obj1).filter(key => key !== 'id');
  const keys2 = Object.keys(obj2).filter(key => key !== 'id');

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;

    const val1 = obj1[key];
    const val2 = obj2[key];

    if (typeof val1 === 'string' && typeof val2 === 'string') {
      // Case-insensitive comparison of strings
      if (val1.toLowerCase() !== val2.toLowerCase()) return false;
    } else {
      // Strict equality for non-string fields
      if (val1 !== val2) return false;
    }
  }
  return true;
}

function checkForDuplicate(current, callback) {
  queryByColumn('forms', 'dateOfWork', current.dateOfWork, results => {
    // Check if any matching form equals current ignoring case (excluding id)
    const isDuplicate = results.some(e => areObjectsEqualIgnoreCase(current, e));
    callback(isDuplicate);
  });
}




/*************************************************************************************************************************************************************************************************************
 * DISPLAY AND SUBMIT OPERATIONS
 ************************************************************************************************************************************************************************************************************/
function showFormDataPopup(data) {

  // Create overlay
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 9999
  });

  // Create popup container
  const popup = document.createElement('div');
  Object.assign(popup.style, {
    background: '#fff', padding: '20px', borderRadius: '8px', maxHeight: '80vh',
    overflowY: 'auto', boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
  });
  overlay.appendChild(popup);

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.marginBottom = '15px';
  closeButton.onclick = () => document.body.removeChild(overlay);
  popup.appendChild(closeButton);

  const message = "Table below displays ONLY previously submitted requests from CURRENT DEVICE and CURRENT BROWSER"

  // Add message element
  const messageElement = document.createElement('h2');
  messageElement.textContent = message;
  Object.assign(messageElement.style, {
    marginBottom: '15px',
    fontStyle: 'italic',
    color: '#a83d3dff'
  });
  popup.appendChild(messageElement);

  // Create table
  const table = document.createElement('table');
  Object.assign(table.style, {
    width: '100%', borderCollapse: 'collapse'
  });

  // Create table header using keys from the first object
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  // Use keys from first object for header cells
  const keys = Object.keys(data[0] || {});
  keys.forEach(key => {
    const th = document.createElement('th');
    // Format header - capitalize and add spaces if needed
    const formattedKey = key.replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase());
    th.textContent = formattedKey;
    Object.assign(th.style, {
      border: '1px solid #ccc', padding: '8px', backgroundColor: '#eee', textAlign: 'left'
    });
    headerRow.appendChild(th);
  });
    
    const th = document.createElement('th');
    th.textContent = "Delete";
    headerRow.appendChild(th);
  
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement('tbody');

  // One table row per form data object in data array
  data.forEach(formData => {
    const row = document.createElement('tr');
    row.addEventListener('click', (event) => {
    console.log('Row clicked:', formData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    location.reload();

    });
    keys.forEach(key => {
      const td = document.createElement('td');
      td.textContent = formData[key] !== undefined ? formData[key] : '';
      Object.assign(td.style, { border: '1px solid #ccc', padding: '8px' });
      row.appendChild(td);
    });
    const td = document.createElement('td');
    const btn = document.createElement('button');
    btn.textContent = "Delete";
    btn.style.backgroundColor = 'red';
    btn.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent row click event
      deleteFormFromIndexedDB(formData.id, success => {
        if (success) {
          console.log('Form deleted.');
          row.remove(); // Remove the row from the table
        } else {
          console.log('Failed to delete form.');
        }
      });
    });

    td.appendChild(btn);
    row.appendChild(td);
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  popup.appendChild(table);
  document.body.appendChild(overlay);
}

function getSavedAndShow(){    let data = [];
    getAllFormsFromIndexedDB((forms) => {
        if (forms) {
            console.log('All saved forms:', forms);
            showFormDataPopup(forms);
        } else {
            console.log('Failed to retrieve forms');
        }
    });
}

async function submitFormToPowerAutomate(data) {
  const url = 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b6c024f8020c42a4b697425a84a97653/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qWEExDdL83FWcObWTykEQEG01HKHWAnvKBzA-ttwvms';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        actionType: 'save',
        workForm: data
      })
    });

    if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
      showMessage("Failed to submit request, try again. If form is empty, it should be accessable in previously submitted froms list.", 7000)
    }

    const result = await response.json();
    console.log('Successfully submitted:', result);
    const message = result.message ?? "Failed to submit request, try again. If form is empty, it should be accessable in previously submitted froms list.";
    showMessage(message, 2000)
    return result;

  } catch (error) {
    console.error('Error submitting form to Power Automate:', error);
    showMessage("Failed to submit request, try again. If form is empty, it should be accessable in previously submitted froms list.", 7000)
    // throw error;
  }
}

function showMessage(message, durationMs = 3000, color = 'white') {
  // Define muted colors and text colors
  const colors = {
    red: { bg: '#c75c5c', text: '#fff5f5' },       // muted dark red background
    green: { bg: '#5c9575', text: '#f1fbf7' },     // muted dark green background
    white: { bg: '#f5f5f5', text: '#333' },        // light gray background with dark text
    yellow: { bg: '#d4c66d', text: '#2f2e18' }     // muted mustard yellow background
  };

  const chosen = colors[color.toLowerCase()] || colors.white;

  // Create overlay
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed',
    top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  });

  // Create message box
  const box = document.createElement('div');
  box.textContent = message;
  Object.assign(box.style, {
    backgroundColor: chosen.bg,
    color: chosen.text,
    padding: '15px 25px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    fontSize: '1.1rem',
    maxWidth: '80%',
    textAlign: 'center',
    cursor: 'pointer',
    userSelect: 'none'
  });

  // Append box to overlay, and overlay to body
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // Function to remove popup safely
  function removeMessage() {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
      clearTimeout(timeoutId);
    }
  }

  // Remove on click
  box.addEventListener('click', removeMessage);

  // Remove after timeout
  const timeoutId = setTimeout(removeMessage, durationMs);
}







