const STORAGE_KEY = 'jhaFormData';
const form = document.querySelector('form');

function saveFormData() {
  const formData = new FormData(form);
  const obj = {};

  // Temporary map for jobSteps by index
  const jobStepsMap = {};

  for (const [key, value] of formData.entries()) {
    const match = key.match(/^jobSteps\[(\d+)\]\.(.+)$/);
    if (match) {
      const index = parseInt(match[1], 10);
      const prop = match[2];
      if (!jobStepsMap[index]) jobStepsMap[index] = {};
      jobStepsMap[index][prop] = value;
    } else {
      obj[key] = value; // normal fields
    }
  }

  // Convert jobStepsMap to an array sorted by index
  const jobStepsArray = Object.keys(jobStepsMap)
    .sort((a, b) => a - b)
    .map(i => jobStepsMap[i]);

  obj.jobSteps = jobStepsArray;

  // Save full object (jobSteps is an array, NOT a JSON string)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  console.log(obj);
  return obj;
}

// Populate a single jobStep block with provided data
function populateJobStep(index, stepObj) {
  // Helper to safely set value if element exists; log a warning otherwise
  function setFieldValue(name, value) {
    const element = form.elements[name];
    if (element) {
      element.value = value || '';
      return true;
    } else {
      console.warn(`Element not found: ${name}`);
      return false;
    }
  }

  // If index is 0 and inputs exist, fill them. Otherwise create the step first.
  if (index === 0) {
    // If first step inputs don't exist, try to create them
    if (!form.elements[`jobSteps[0].description`]) {
      // create the first step UI (if your initial HTML doesn't contain it)
      // Use addJobStep only if it creates the correct jobSteps[0] names;
      // otherwise ensure initial HTML contains jobSteps[0] set.
      addJobStep();
      stepIndex = Math.max(stepIndex, 1);
    }
    setFieldValue(`jobSteps[0].description`, stepObj.description);
    setFieldValue(`jobSteps[0].hazard`, stepObj.hazard);
    setFieldValue(`jobSteps[0].safetyMeasures`, stepObj.safetyMeasures);
    return;
  }

  // For index > 0: ensure enough steps exist
  // If stepIndex currently <= index, keep adding steps until index exists
  while (!form.elements[`jobSteps[${index}].description`]) {
    addJobStep(); // must create jobSteps[stepIndex] and increment stepIndex
  }

  setFieldValue(`jobSteps[${index}].description`, stepObj.description);
  setFieldValue(`jobSteps[${index}].hazard`, stepObj.hazard);
  setFieldValue(`jobSteps[${index}].safetyMeasures`, stepObj.safetyMeasures);
}

// Load and populate form from localStorage
function loadFormData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  const data = JSON.parse(saved);

  // Applicability (radio)
  if (data.applicability) {
    const applicabilityRadios = form.querySelectorAll('input[name="applicability"]');
    applicabilityRadios.forEach(radio => {
      radio.checked = (radio.value === data.applicability);
    });
  }

  // Status (radio)
  if (data.status) {
    const radios = form.querySelectorAll('input[name="status"]');
    radios.forEach(r => r.checked = (r.value === data.status));
  }

  // Other simple fields (not arrays or radio groups)
  for (const [key, value] of Object.entries(data)) {
    if (key === 'applicability' || key === 'status' || key === 'jobSteps') continue;

    const element = form.elements[key];
    if (!element) continue;
    if (element.type === 'checkbox') {
      element.checked = Boolean(value);
    } else {
      element.value = value;
    }
  }

  // Clear existing jobSteps except the first (if desired)
  const jobStepsFieldset = document.getElementById('jobStepsFieldset');
  // Remove all existing jobStep DIVs and recreate them based on saved array.
  // Assumes each job step block is a direct child div.jobStep of the fieldset.
  const existingSteps = Array.from(jobStepsFieldset.querySelectorAll('.jobStep'));
  existingSteps.forEach(el => el.remove());
  // Reset stepIndex so addJobStep uses correct indices
  stepIndex = 0;

  // Populate each jobStep block from jobSteps array (if present)
  if (Array.isArray(data.jobSteps)) {
    data.jobSteps.forEach((stepObj, idx) => {
      // Use addJobStep to create the block, then fill fields
      addJobStep();          // creates jobSteps[stepIndex] and increments stepIndex
      // stepIndex was incremented by addJobStep; the new index is stepIndex-1
      const createdIndex = stepIndex - 1;
      populateJobStep(createdIndex, stepObj);
    });
  }
}

// Event listeners
form.addEventListener('input', saveFormData);

window.addEventListener('DOMContentLoaded', loadFormData);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  // You can customize saveFormToIndexedDB and submitFormToPowerAutomate as needed
  const data = saveFormData();
  saveFormToIndexedDB(event.target);
  submitFormToPowerAutomate(data);
  localStorage.removeItem(STORAGE_KEY);
});



/*************************************************************************************************************************************************************************************************************
 * INDEXED DB OPERATIONS
 ************************************************************************************************************************************************************************************************************/
const DB_NAME = 'JhaDatabase';
const DB_VERSION = 1; // Incremented version to trigger upgrade
const STORE_NAME = 'forms';

function getDataFromForm(){
  const data = {};

  // Create a map to collect multiple checkbox values for the same name (applicability)
  const checkboxValuesMap = {};

  // Create a map to collect jobSteps fields grouped by index
  const jobStepsMap = {};

  Array.from(form.elements).forEach(el => {
    if (!el.name) return;

    // Group jobSteps fields by index and property
    const match = el.name.match(/^jobSteps\[(\d+)\]\.(.+)$/);
    if (match) {
      const index = parseInt(match[1], 10);
      const prop = match[2];
      if (!jobStepsMap[index]) jobStepsMap[index] = {};
      
      // For textareas and inputs, just take the value
      jobStepsMap[index][prop] = el.value;

      return; // Skip further processing for jobSteps fields here
    }

    if (el.type === 'checkbox') {
      // Collect checked checkboxes into arrays
      if (el.checked) {
        if (!checkboxValuesMap[el.name]) {
          checkboxValuesMap[el.name] = [];
        }
        checkboxValuesMap[el.name].push(el.value);
      }
    } else if (el.type === 'radio') {
      if (el.checked) {
        data[el.name] = el.value;
      }
    } else {
      data[el.name] = el.value;
    }
  });

  // Assign collected checkbox arrays to data object
  Object.entries(checkboxValuesMap).forEach(([key, values]) => {
    data[key] = values;
  });

  // Convert jobStepsMap into a sorted array
  const jobStepsArray = Object.keys(jobStepsMap)
    .sort((a, b) => a - b)
    .map(i => jobStepsMap[i]);

  data.jobSteps = jobStepsArray;

  return data;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      let store;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      } else {
        // Get existing store to add index
        store = event.target.transaction.objectStore(STORE_NAME);
      }

      if (!store.indexNames.contains('status')) {
        store.createIndex('status', 'status', { unique: false });
        console.log('Status index created successfully.');
      }
      
      // Data Migration: Add a default 'status' to old records
      if (event.oldVersion < 5) {
        console.log('Migrating data: adding default status to existing records.');
        store.openCursor().onsuccess = e => {
          const cursor = e.target.result;
          if (cursor) {
            const record = cursor.value;
            // If 'status' field is missing, add it with a default value
            if (record.status === undefined) {
              record.status = 'unknown'; // Or another sensible default like 'unknown'
              cursor.update(record);
            }
            cursor.continue();
          } else {
            console.log('Data migration complete.');
          }
        };
      }
    };

    request.onsuccess = event => {
      resolve(event.target.result);
    };

    request.onerror = event => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
}

function saveFormToIndexedDB(form) {
  const data = {};

  // Create a map to collect multiple checkbox values for the same name (applicability)
  const checkboxValuesMap = {};

  // Create a map to collect jobSteps fields grouped by index
  const jobStepsMap = {};

  Array.from(form.elements).forEach(el => {
    if (!el.name) return;

    // Group jobSteps fields by index and property
    const match = el.name.match(/^jobSteps\[(\d+)\]\.(.+)$/);
    if (match) {
      const index = parseInt(match[1], 10);
      const prop = match[2];
      if (!jobStepsMap[index]) jobStepsMap[index] = {};
      
      // For textareas and inputs, just take the value
      jobStepsMap[index][prop] = el.value;

      return; // Skip further processing for jobSteps fields here
    }

    if (el.type === 'checkbox') {
      // Collect checked checkboxes into arrays
      if (el.checked) {
        if (!checkboxValuesMap[el.name]) {
          checkboxValuesMap[el.name] = [];
        }
        checkboxValuesMap[el.name].push(el.value);
      }
    } else if (el.type === 'radio') {
      if (el.checked) {
        data[el.name] = el.value;
      }
    } else {
      data[el.name] = el.value;
    }
  });

  // Assign collected checkbox arrays to data object
  Object.entries(checkboxValuesMap).forEach(([key, values]) => {
    data[key] = values;
  });

  // Convert jobStepsMap into a sorted array
  const jobStepsArray = Object.keys(jobStepsMap)
    .sort((a, b) => a - b)
    .map(i => jobStepsMap[i]);

  data.jobSteps = jobStepsArray;

  // IndexedDB saving logic unchanged
  const request = indexedDB.open('JhaDatabase', 1);

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
  const request = indexedDB.open('JhaDatabase', 1);

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
  const request = indexedDB.open('JhaDatabase', 1);

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
  const request = indexedDB.open('JhaDatabase', 1);

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
  const request = indexedDB.open('JhaDatabase', 1);

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

  const message = "Table below displays ONLY previously submitted requests from CURRENT DEVICE and CURRENT BROWSER";

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

  // Determine all keys present in data array objects (union of keys)
  const allKeysSet = new Set();
  data.forEach(item => {
    Object.keys(item).forEach(k => allKeysSet.add(k));
  });
  const keys = Array.from(allKeysSet);

  // Create table header using keys + Delete column
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  keys.forEach(key => {
    const th = document.createElement('th');
    const formattedKey = key.replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase());
    th.textContent = formattedKey;
    Object.assign(th.style, {
      border: '1px solid #ccc', padding: '8px', backgroundColor: '#eee', textAlign: 'left'
    });
    headerRow.appendChild(th);
  });

  const thDel = document.createElement('th');
  thDel.textContent = "Delete";
  headerRow.appendChild(thDel);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Helper: create nested table for jobSteps array
  function createJobStepsTable(jobStepsArray) {
    const nestedTable = document.createElement('table');
    Object.assign(nestedTable.style, {
      border: '1px solid #999',
      borderCollapse: 'collapse',
      width: '100%'
    });

    const nestedThead = document.createElement('thead');
    const nestedHeaderRow = document.createElement('tr');
    ['Description', 'Hazard', 'Safety Measures'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      Object.assign(th.style, { border: '1px solid #999', padding: '4px', backgroundColor: '#ddd' });
      nestedHeaderRow.appendChild(th);
    });
    nestedThead.appendChild(nestedHeaderRow);
    nestedTable.appendChild(nestedThead);

    const nestedTbody = document.createElement('tbody');
    jobStepsArray.forEach(step => {
      const tr = document.createElement('tr');
      ['description', 'hazard', 'safetyMeasures'].forEach(prop => {
        const td = document.createElement('td');
        td.textContent = step[prop] || '';
        Object.assign(td.style, { border: '1px solid #999', padding: '4px' });
        tr.appendChild(td);
      });
      nestedTbody.appendChild(tr);
    });
    nestedTable.appendChild(nestedTbody);

    return nestedTable;
  }

  // Create table body rows
  const tbody = document.createElement('tbody');

  data.forEach(formData => {
    const row = document.createElement('tr');

    row.addEventListener('click', () => {
      console.log('Row clicked:', formData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      location.reload();
    });

    keys.forEach(key => {
      const td = document.createElement('td');
      let value = formData[key];

      if (key === 'jobSteps' && Array.isArray(value)) {
        // Render nested table for jobSteps array
        const jobStepsTable = createJobStepsTable(value);
        td.appendChild(jobStepsTable);
      } else if (Array.isArray(value)) {
        td.textContent = value.join(', ');
      } else if (typeof value === 'object' && value !== null) {
        td.textContent = JSON.stringify(value);
      } else {
        td.textContent = value !== undefined ? value : '';
      }
      Object.assign(td.style, { border: '1px solid #ccc', padding: '8px' });
      row.appendChild(td);
    });

    // Add delete button cell
    const tdDel = document.createElement('td');
    const btn = document.createElement('button');
    btn.textContent = "Delete";
    btn.style.backgroundColor = 'red';
    btn.onclick = (event) => {
      event.stopPropagation();
      deleteFormFromIndexedDB(formData.id, success => {
        if (success) {
          console.log('Form deleted.');
          row.remove();
        } else {
          console.log('Failed to delete form.');
        }
      });
    };
    tdDel.appendChild(btn);
    row.appendChild(tdDel);

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
        actionType: 'saveJha',
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







