let equipmentFormsPopup = document.getElementById('equipmentFormsPopup');
let closePopup = document.getElementsByClassName('close-popup')[0];
let currentEquipmentData = {};

    // Function to open the popup
    function openEquipmentFormsPopup() {
        equipmentFormsPopup.style.display = 'block';
    }

    // Function to close the popup
    function closeEquipmentFormsPopup() {
        equipmentFormsPopup.style.display = 'none';
    }

    // Close the popup when clicking on <span> (x)
    closePopup.onclick = closeEquipmentFormsPopup;

    // Close the popup when clicking outside of it
    window.onclick = function(event) {
        if (event.target == equipmentFormsPopup) {
            closeEquipmentFormsPopup();
        }
    }

    async function displayEquipmentWithConflict(eqId) {
        console.log('Displaying equipment with conflict for eqId:', eqId);
        try {
            const data = await getConflict(eqId);
            currentEquipmentData = await data;
            console.log('Data received in displayEquipmentWithConflict:', data);
            
            if (data === null) {
                console.error('No data received from getConflict');
                return;
            }

            // Clear previous forms
            document.getElementById('equipmentFormsContainer').innerHTML = '';

            buildEquipmentForm(data.point);
            showOtherUnitEq();
            showDuplicates();
            showDiscrepancies();
            
            // Open the popup after forms are built
            openEquipmentFormsPopup();
        } catch (error) {
            console.error('Error in displayEquipmentWithConflict:', error);
        }
    }

    /*******************************************************************
     * EQUIPMENT POINT FORM
     * ****************************************************************/

    // function buildEquipmentForm(equipment) {

    //     const form = document.createElement('form');
    //     form.id = 'equipmentForm_' + equipment.id;
    //     form.classList.add('equipment-form');

    //     const titleContainer = document.createElement('div');
    //     titleContainer.style.display = 'flex';
    //     titleContainer.style.alignItems = 'center';
    //     titleContainer.style.justifyContent = 'space-between';
    //     titleContainer.style.marginBottom = '10px';

    //     const title = document.createElement('h2');
    //     title.textContent = equipment.tagNumber;
    //     title.style.marginRight = '10px';

    //     const dropdown = document.createElement('select');
    //     dropdown.id = 'conflictType_' + equipment.id;
    //     dropdown.style.padding = '5px';

    //     const options = ['completion', 'duplicates', 'other unit'];
    //     options.forEach(optionText => {
    //         const option = document.createElement('option');
    //         option.value = optionText;
    //         option.textContent = optionText.charAt(0).toUpperCase() + optionText.slice(1);
    //         dropdown.appendChild(option);
    //     });

    //     dropdown.addEventListener('change', function() {
    //         console.log('Selected conflict type:', this.value);
    //         getConflictData(this.value);
    //     });

    //     titleContainer.appendChild(title);
    //     titleContainer.appendChild(dropdown);
    //     form.appendChild(titleContainer);

    //     const equipmentFields = ['tagNumber', 'description', 'specificLocation', 'coordinates'];

    //     // Equipment fields
    //     equipmentFields.forEach(field => {
    //         const fieldDiv = document.createElement('div');
    //         fieldDiv.classList.add('equipment-field');

    //         const label = document.createElement('label');
    //         label.htmlFor = `${equipment.id}_${field}`;
    //         label.textContent = field.charAt(0).toUpperCase() + field.slice(1) + ':';

    //         const input = document.createElement('input');
    //         input.type = 'text';
    //         input.id = `${equipment.id}_${field}`;
    //         input.name = `equipment.${field}`;
    //         input.value = equipment[field] || '';

    //         fieldDiv.appendChild(label);
    //         fieldDiv.appendChild(input);
    //         form.appendChild(fieldDiv);
    //     });

    //     const fieldDiv = document.createElement('div');
    //     fieldDiv.classList.add('equipment-field');

    //     // File Number field
    //     const label = document.createElement('label');
    //     label.htmlFor = `${equipment.id}_mainFile`;
    //     label.textContent = 'File Number:';

    //     const filePath = equipment.files && equipment.files.length > 0 ? equipment.files[0].fileLink : '';
    //     const fileNumber = filePath.substring(filePath.lastIndexOf('/') + 1);

    //     const input = document.createElement('input');
    //     input.type = 'text';
    //     input.id = `${equipment.id}_mainFile`;
    //     input.name = 'equipment.files[0]';
    //     input.value = fileNumber;
    //     input.readOnly = true;

    //     fieldDiv.appendChild(label);
    //     fieldDiv.appendChild(input);
    //     form.appendChild(fieldDiv);

    //     // Hidden input for equipment ID
    //     const idInput = document.createElement('input');
    //     idInput.type = 'hidden';
    //     idInput.name = 'equipment.id';
    //     idInput.value = equipment.id || '';
    //     form.appendChild(idInput);

    //     // Add update coordinates button
    //     const updateCoordsButton = document.createElement('button');
    //     updateCoordsButton.type = 'button';
    //     updateCoordsButton.textContent = 'Update Coordinates';
    //     updateCoordsButton.onclick = () => updateCoordinates(currentShape);
    //     form.appendChild(updateCoordsButton);

    //     // Loto Points
    //     const lotoPointsContainer = document.createElement('div');
    //     lotoPointsContainer.id = `lotoPointsContainer_${equipment.id}`;
    //     lotoPointsContainer.classList.add('loto-points-container');
        
    //     const lotoPointsTitle = document.createElement('h3');
    //     lotoPointsTitle.textContent = 'Loto Points';
    //     lotoPointsContainer.appendChild(lotoPointsTitle);
        
    //     form.appendChild(lotoPointsContainer);

    //     const buttonContainer = document.createElement('div');
    //     buttonContainer.classList.add('button-container');

    //     const addLotoPointButton = document.createElement('button');
    //     addLotoPointButton.type = 'button';
    //     addLotoPointButton.textContent = 'Add Loto Point';
    //     addLotoPointButton.onclick = () => addLotoPointFields(equipment.id);
    //     buttonContainer.appendChild(addLotoPointButton);

    //     const submitButton = document.createElement('button');
    //     submitButton.type = 'submit';
    //     submitButton.textContent = 'Update Equipment and Loto Points';
    //     buttonContainer.appendChild(submitButton);

    //     form.appendChild(buttonContainer);
    
    //     form.addEventListener('submit', async (e) => {
    //         e.preventDefault();
    //         const formData = new FormData(form);
    //         const updatedEquipment = {
    //             id: formData.get('equipment.id'),
    //             tagNumber: formData.get('equipment.tagNumber'),
    //             description: formData.get('equipment.description'),
    //             specificLocation: formData.get('equipment.specificLocation'),
    //             coordinates: formData.get('equipment.coordinates'),
    //             lotoPoints: []
    //         };
    
    //         // Collect loto points data
    //         const lotoPointsData = {};
    //         for (let [key, value] of formData.entries()) {
    //             if (key.startsWith('lotoPoints[')) {
    //                 const match = key.match(/lotoPoints\[(\d+)\]\.(.+)/);
    //                 if (match) {
    //                     const index = match[1];
    //                     const field = match[2];
    //                     if (!lotoPointsData[index]) {
    //                         lotoPointsData[index] = {};
    //                     }
    //                     lotoPointsData[index][field] = value;
    //                 }
    //             }
    //         }
    
    //         updatedEquipment.lotoPoints = Object.values(lotoPointsData);
    
    //         try {
    //             const response = await fetch('/api/point-by-point/transfer', {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                     'X-CSRF-TOKEN': document.querySelector('meta[name="_csrf"]').getAttribute('content')
    //                 },
    //                 body: JSON.stringify(updatedEquipment)
    //             });
    
    //             if (response.ok) {
    //                 const result = await response.text();
    //                 console.log('Equipment and Loto Points updated:', result);
    //                 // alert('Equipment and Loto Points updated successfully!');
    //                 form.remove();    
    //                 let forms = document.querySelectorAll('.equipment-form');
    //                 if (forms.length === 0) {
    //                     const dropdown = document.getElementById('api-dropdown');
    //                     if (dropdown.value) {
    //                         await getConflictList(dropdown.value);
    //                     }
    //                 }
    //             } else {
    //                 throw new Error('Failed to update equipment and loto points');
    //             }
    //         } catch (error) {
    //             console.error('Error updating equipment and loto points:', error);
    //             alert('Failed to update equipment and loto points. Please try again.');
    //         }
    //     });

    //     document.getElementById('equipmentFormsContainer').appendChild(form);

    //     if (equipment.lotoPoints && equipment.lotoPoints.length > 0) {
    //         equipment.lotoPoints.forEach((lotoPoint, index) => {
    //             addLotoPointFields(equipment.id, lotoPoint, index);
    //         });
    //     }

    //     form.querySelectorAll('input, select').forEach(element => {
    //         addCopyListener(element);
    //     });
    // }
    
    // function addLotoPointFields(equipmentId, lotoPoint = {}, index = Date.now()) {
    //     const container = document.getElementById(`lotoPointsContainer_${equipmentId}`);
    //     const lotoPointDiv = document.createElement('div');
    //     lotoPointDiv.classList.add('loto-point');
    
    //     const fields = ['id', 'tagNumber', 'description', 'specificLocation', 'normalPosition', 'isolatedPosition'];
    
    //     fields.forEach(field => {
    //         if (field !== 'id') {
    //             const fieldDiv = document.createElement('div');
    //             fieldDiv.classList.add('loto-point-field');
    
    //             const label = document.createElement('label');
    //             label.htmlFor = `lotoPoint_${field}_${index}`;
    //             label.textContent = field.charAt(0).toUpperCase() + field.slice(1) + ':';
    
    //             const input = document.createElement('input');
    //             input.type = 'text';
    //             input.id = `lotoPoint_${field}_${index}`;
    //             input.name = `lotoPoints[${index}].${field}`;
    //             input.value = lotoPoint[field] || '';
    
    //             fieldDiv.appendChild(label);
    //             fieldDiv.appendChild(input);
    //             lotoPointDiv.appendChild(fieldDiv);
    //         } else {
    //             const input = document.createElement('input');
    //             input.type = 'hidden';
    //             input.name = `lotoPoints[${index}].${field}`;
    //             input.value = lotoPoint[field] || '';
    //             lotoPointDiv.appendChild(input);
    //         }
    //     });
    
    //     const removeButton = document.createElement('button');
    //     removeButton.type = 'button';
    //     removeButton.textContent = 'Remove';
    //     removeButton.onclick = () => lotoPointDiv.remove();
    //     lotoPointDiv.appendChild(removeButton);
    
    //     container.appendChild(lotoPointDiv);

    //     container.querySelectorAll('input, select').forEach(element => {
    //         addCopyListener(element);
    //     });
    // }

    /*******************************************************************
     * SELECT CONFLICT TYPE
     * ****************************************************************/

    
    function showConflictData(conflictType) {
        // Hide all conflict forms first
        const allConflictForms = document.querySelectorAll('[id^="conflict-"]');
        allConflictForms.forEach(form => {
            form.style.display = 'none';
        });
    
        // Show forms that contain the selected conflict type in their IDs
        const relevantForms = document.querySelectorAll(`[id*="${conflictType}"]`);
        relevantForms.forEach(form => {
            form.style.display = 'block';
        });
    
        // If no relevant forms found, display a message
        if (relevantForms.length === 0) {
            const container = document.getElementById('conflictsSection');
            container.innerHTML = `<p>No ${conflictType} conflicts found.</p>`;
        }
    
        // Log the action for debugging
        console.log(`Showing conflict forms for type: ${conflictType}`);
    }

    function showDuplicates() {
        const duplicates = currentEquipmentData.duplicates;
        const container = document.getElementById('conflictsSection');
    
        // Create a header for the duplicates section
        const header = document.createElement('h3');
        header.textContent = 'Duplicate Equipment';
        container.appendChild(header);
    
        // Create a container for the duplicate forms
        const duplicatesContainer = document.createElement('div');
        duplicatesContainer.id = 'duplicatesContainer';
        container.appendChild(duplicatesContainer);
    
        // Add each duplicate equipment form
        duplicates.forEach((duplicate, index) => {
            const formContainer = document.createElement('div');
            formContainer.className = 'duplicate-form';
            formContainer.id = `duplicate-${index}`;
    
            // Use the existing createEquipmentFormElement function
            const duplicateForm = createEquipmentFormElement(duplicate, 'conflict');
            formContainer.appendChild(duplicateForm);
    
            duplicatesContainer.appendChild(formContainer);
        });
    
        // If no duplicates found
        if (duplicates.length === 0) {
            const noDuplicatesMessage = document.createElement('p');
            noDuplicatesMessage.textContent = 'No duplicates found.';
            duplicatesContainer.appendChild(noDuplicatesMessage);
        }
    }

    function showOtherUnitEq() {
        const otherUnit = currentEquipmentData.otherUnit;
        const container = document.getElementById('conflictsSection');
    
        // Create a container for the other unit equipment forms
        const otherUnitContainer = document.createElement('div');
        otherUnitContainer.id = 'otherUnitContainer';
        container.appendChild(otherUnitContainer);
    
        // Add each other unit equipment form
        otherUnit.forEach((equipment, index) => {
            const formContainer = document.createElement('div');
            formContainer.className = 'other-unit-form';
            formContainer.id = `other-unit-${index}`;
    
            // Use the existing createEquipmentFormElement function
            const equipmentForm = createEquipmentFormElement(equipment, 'conflict');
            formContainer.appendChild(equipmentForm);
    
            otherUnitContainer.appendChild(formContainer);
        });
    
        // If no other unit equipment found
        if (otherUnit.length === 0) {
            const noOtherUnitMessage = document.createElement('p');
            noOtherUnitMessage.textContent = 'No other unit equipment found.';
            otherUnitContainer.appendChild(noOtherUnitMessage);
        }
    }

    function showDiscrepancies() {
        const container = document.getElementById('equipmentFormsContainer');
        const currentEquipmentSection = document.getElementById('currentEquipmentSection');
        const conflictsSection = document.getElementById('conflictsSection');
        const currentEquipmentForm = currentEquipmentSection.querySelector('.equipment-form');
        const conflictForms = conflictsSection.querySelectorAll('.conflict-form');
        
        const equipmentFields = ['tagNumber', 'description', 'specificLocation'];
        const lotoPointFields = ['tagNumber', 'description', 'specificLocation', 'normalPosition', 'isolatedPosition'];
    
        // Function to highlight discrepancies
        const highlightDiscrepancy = (input, referenceValue) => {
            if (input.value.trim() !== (referenceValue || '').trim()) {
                input.style.backgroundColor = 'yellow';
                input.title = `Discrepancy found. Other value: ${referenceValue}`;
            } else {
                input.style.backgroundColor = '';
                input.title = '';
            }
        };
    
        // Function to swap unit references
        const swapUnitReferences = (value, fromUnit, toUnit) => {
            return value.replace(new RegExp(`${fromUnit}`, 'gi'), toUnit)
                        .replace(new RegExp(`Unit${fromUnit[1]}`, 'gi'), `Unit${toUnit[1]}`)
                        .replace(new RegExp(`UNIT ${fromUnit[1]}`, 'gi'), `UNIT${toUnit[1]}`)
                        .replace(new RegExp(`UNIT${fromUnit[1]}`, 'gi'), `UNIT${toUnit[1]}`)
                        .replace(new RegExp(`Unit ${fromUnit[1]}`, 'gi'), `Unit ${toUnit[1]}`)
                        .replace(new RegExp(`U${fromUnit[1]}`, 'gi'), `U${toUnit[1]}`);
        };
    
        // Function to check discrepancies
        const checkDiscrepancies = () => {
            const allForms = [currentEquipmentForm, ...conflictForms];
    
            allForms.forEach((form) => {
                const equipmentInputs = {};
                equipmentFields.forEach(field => {
                    equipmentInputs[field] = form.querySelector(`input[name="equipment.${field}"]`);
                });
    
                // Step 1: Compare equipment fields with its LOTO points
                const lotoPointsContainer = form.querySelector('.loto-points-container');
                if (lotoPointsContainer) {
                    const lotoPoints = lotoPointsContainer.querySelectorAll('.loto-point');
                    lotoPoints.forEach((lotoPoint) => {
                        lotoPointFields.forEach(field => {
                            const lotoPointInput = lotoPoint.querySelector(`input[name^="lotoPoints["][name$="].${field}"]`);
                            if (lotoPointInput && equipmentInputs[field]) {
                                highlightDiscrepancy(equipmentInputs[field], lotoPointInput.value);
                                highlightDiscrepancy(lotoPointInput, equipmentInputs[field].value);
                            }
                        });
                    });
                }
    
                // Step 2: Compare current equipment with duplicate equipment
                if (form === currentEquipmentForm) {
                    conflictForms.forEach((conflictForm) => {
                        equipmentFields.forEach(field => {
                            const conflictInput = conflictForm.querySelector(`input[name="equipment.${field}"]`);
                            if (conflictInput && equipmentInputs[field]) {
                                highlightDiscrepancy(equipmentInputs[field], conflictInput.value);
                            }
                        });
                    });
                }
    
                // Step 3: Compare current equipment with other unit equipment
                if (form === currentEquipmentForm) {
                    const currentTagNumber = equipmentInputs.tagNumber.value;
                    const currentUnit = currentTagNumber.startsWith('01') ? '01' : '02';
                    const otherUnit = currentUnit === '01' ? '02' : '01';
    
                    conflictForms.forEach((conflictForm) => {
                        const conflictTagNumber = conflictForm.querySelector('input[name="equipment.tagNumber"]').value;
                        if (conflictTagNumber.startsWith(otherUnit)) {
                            equipmentFields.forEach(field => {
                                const conflictInput = conflictForm.querySelector(`input[name="equipment.${field}"]`);
                                if (conflictInput && equipmentInputs[field]) {
                                    let conflictValue = conflictInput.value;
                                    if (field === 'tagNumber') {
                                        conflictValue = currentUnit + conflictValue.substring(2);
                                    } else {
                                        conflictValue = swapUnitReferences(conflictValue, otherUnit, currentUnit);
                                    }
                                    highlightDiscrepancy(equipmentInputs[field], conflictValue);
                                }
                            });
                        }
                    });
                }
            });
        };
    
        // Initial check
        checkDiscrepancies();
    
        // Add event listeners to all input fields
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', checkDiscrepancies);
        });
    }

    /*******************************************************************
     * PROCESS CONFLICTS
     * ****************************************************************/

    function updateCoordinates(){
        const shape = currentShape.shape;
        const id = shape.dataset.pointId;
        const coordinates = currentShape.coordinates;
        console.log('Updating coordinates for point ID:', id);
        const coordinatesString = JSON.stringify(coordinates).replace(/[{}"]/g, '');
        document.getElementById(`${id}_coordinates`).value = coordinatesString;
    }
    
    function checkDataCompletion(equipment){

    }
    
    function checkForDuplicates(tagNumber){
    
    }
    
    function checkOtherUnitMatches(){
        
    }


    /*******************************************************************
     * CLIPBOARD FUNCTIONS
     * ****************************************************************/


    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Text copied to clipboard');
        }).catch(err => {
            console.error('Error in copying text: ', err);
        });
    }
    
    async function pasteFromClipboard() {
        try {
            return await navigator.clipboard.readText();
        } catch (err) {
            console.error('Error in pasting text: ', err);
            return null;
        }
    }
    
    function addCopyListener(element) {
        element.addEventListener('click', async (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                copyToClipboard(element.value || element.textContent);
            } else if (e.shiftKey) {
                e.preventDefault();
                const clipboardText = await pasteFromClipboard();
                if (clipboardText !== null) {
                    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        element.value = clipboardText;
                    } else if (element.tagName === 'SELECT') {
                        // For select elements, we need to find if there's a matching option
                        const option = Array.from(element.options).find(opt => opt.value === clipboardText);
                        if (option) {
                            element.value = clipboardText;
                        } else {
                            console.warn('No matching option found for pasted value');
                        }
                    } else {
                        element.textContent = clipboardText;
                    }
                    // Trigger a change event
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });
    }





    //New Form Building Functions

    function buildEquipmentForm(equipment) {
        const container = document.getElementById('equipmentFormsContainer');
        container.innerHTML = ''; // Clear previous content
    
        // Create a wrapper for the entire content
        const contentWrapper = document.createElement('div');
        contentWrapper.style.display = 'flex';
        contentWrapper.style.flexDirection = 'column';
        contentWrapper.style.alignItems = 'center';
    
        // Create a wrapper for the dropdown
        const dropdownWrapper = document.createElement('div');
        dropdownWrapper.style.marginBottom = '20px';
        dropdownWrapper.style.width = '100%';
        dropdownWrapper.style.textAlign = 'center';
    
        // Create dropdown for conflict types
        const dropdown = document.createElement('select');
        dropdown.id = 'conflictType_' + equipment.id;
        dropdown.style.padding = '5px';
        dropdown.style.width = '200px'; // Adjust width as needed
    
        const options = ['Select Conflict Type', 'completion', 'duplicates', 'other unit'];
        options.forEach(optionText => {
            const option = document.createElement('option');
            option.value = optionText.toLowerCase().replace(' ', '_');
            option.textContent = optionText.charAt(0).toUpperCase() + optionText.slice(1);
            dropdown.appendChild(option);
        });
    
        // Add dropdown to wrapper
        dropdownWrapper.appendChild(dropdown);
    
        // Create a wrapper for the two sections
        const sectionsWrapper = document.createElement('div');
        sectionsWrapper.style.display = 'flex';
        sectionsWrapper.style.justifyContent = 'space-between';
        sectionsWrapper.style.width = '100%';
    
        // Create two sections
        const currentEquipmentSection = document.createElement('div');
        currentEquipmentSection.id = 'currentEquipmentSection';
        currentEquipmentSection.style.width = '48%'; // Adjust as needed
    
        const conflictsSection = document.createElement('div');
        conflictsSection.id = 'conflictsSection';
        conflictsSection.style.width = '48%'; // Adjust as needed
    
        // Build form for current equipment
        const currentEquipmentForm = createEquipmentFormElement(equipment, 'current');
    
        // Append elements to the sections wrapper
        currentEquipmentSection.appendChild(currentEquipmentForm);
        sectionsWrapper.appendChild(currentEquipmentSection);
        sectionsWrapper.appendChild(conflictsSection);
    
        // Append elements to the content wrapper
        contentWrapper.appendChild(dropdownWrapper);
        contentWrapper.appendChild(sectionsWrapper);
    
        // Add the content wrapper to the container
        container.appendChild(contentWrapper);
    
        // Add event listener to dropdown
        dropdown.addEventListener('change', async function() {
            const conflictType = this.value;
            console.log('Selected conflict type:', conflictType);
            if (conflictType !== 'select_conflict_type') {
                const conflictData = showConflictData(conflictType);
                displayConflictData(conflictData, conflictType);
            } else {
                conflictsSection.innerHTML = ''; // Clear the conflicts section
            }
        });
    }
    
    function createEquipmentFormElement(equipment, formType) {
        const form = document.createElement('form');
        form.id = `equipmentForm_${formType}_${equipment.id}`;
        form.classList.add('equipment-form');
    
        const title = document.createElement('h2');
        title.textContent = formType === 'current' ? 'Current Equipment' : 'Conflict Equipment';
        form.appendChild(title);
    
        const equipmentFields = ['tagNumber', 'description', 'specificLocation', 'coordinates'];
    
        // Equipment fields
        equipmentFields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.classList.add('equipment-field');
    
            const label = document.createElement('label');
            label.htmlFor = `${equipment.id}_${field}`;
            label.textContent = field.charAt(0).toUpperCase() + field.slice(1) + ':';
    
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `${equipment.id}_${field}`;
            input.name = `equipment.${field}`;
            input.value = equipment[field] || '';
    
            fieldDiv.appendChild(label);
            fieldDiv.appendChild(input);
            form.appendChild(fieldDiv);
        });
    
        // File Number field
        const fileFieldDiv = document.createElement('div');
        fileFieldDiv.classList.add('equipment-field');
    
        const fileLabel = document.createElement('label');
        fileLabel.htmlFor = `${equipment.id}_mainFile`;
        fileLabel.textContent = 'File Number:';
    
        const filePath = equipment.files && equipment.files.length > 0 ? equipment.files[0].fileLink : '';
        const fileNumber = filePath.substring(filePath.lastIndexOf('/') + 1);
    
        const fileInput = document.createElement('input');
        fileInput.type = 'text';
        fileInput.id = `${equipment.id}_mainFile`;
        fileInput.name = 'equipment.files[0]';
        fileInput.value = fileNumber;
        fileInput.readOnly = true;
    
        fileFieldDiv.appendChild(fileLabel);
        fileFieldDiv.appendChild(fileInput);
        form.appendChild(fileFieldDiv);
    
        // Hidden input for equipment ID
        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'equipment.id';
        idInput.value = equipment.id || '';
        form.appendChild(idInput);
    
        // Add Loto Points section
        const lotoPointsContainer = document.createElement('div');
        lotoPointsContainer.id = `lotoPointsContainer_${formType}_${equipment.id}`;
        lotoPointsContainer.classList.add('loto-points-container');
        
        const lotoPointsTitle = document.createElement('h3');
        lotoPointsTitle.textContent = 'Loto Points';
        lotoPointsContainer.appendChild(lotoPointsTitle);
    
        // Add existing loto points
        if (equipment.lotoPoints && equipment.lotoPoints.length > 0) {
            equipment.lotoPoints.forEach((lotoPoint, index) => {
                const lotoPointDiv = createLotoPointFields(equipment.id, formType, index, lotoPoint);
                lotoPointsContainer.appendChild(lotoPointDiv);
            });
        }
        
        form.appendChild(lotoPointsContainer);
    
        // Add buttons only for the current equipment form
        if (formType === 'current') {
            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('button-container');
    
            const addLotoPointButton = document.createElement('button');
            addLotoPointButton.type = 'button';
            addLotoPointButton.textContent = 'Add Loto Point';
            addLotoPointButton.onclick = () => addLotoPointFields(equipment.id, formType);
            buttonContainer.appendChild(addLotoPointButton);
    
            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.textContent = 'Update Equipment and Loto Points';
            buttonContainer.appendChild(submitButton);
    
            form.appendChild(buttonContainer);
    
            // Add form submission event listener
            form.addEventListener('submit', handleFormSubmit);
        }
        
        form.querySelectorAll('input, select').forEach(element => {
            addCopyListener(element);
        });
    
        return form;
    }
    
    function displayConflictData(conflictData, conflictType) {
        const conflictsSection = document.getElementById('conflictsSection');
        conflictsSection.innerHTML = ''; // Clear previous content
    
        if (conflictData && conflictData.length > 0) {
            conflictData.forEach(equipment => {
                const conflictForm = createEquipmentFormElement(equipment, 'conflict');
                conflictsSection.appendChild(conflictForm);
            });
        } else {
            const noConflictMessage = document.createElement('p');
            noConflictMessage.textContent = `No ${conflictType} conflicts found.`;
            conflictsSection.appendChild(noConflictMessage);
        }
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updatedEquipment = {
            id: formData.get('equipment.id'),
            tagNumber: formData.get('equipment.tagNumber'),
            description: formData.get('equipment.description'),
            specificLocation: formData.get('equipment.specificLocation'),
            coordinates: formData.get('equipment.coordinates'),
            lotoPoints: []
        };
    
        // Collect loto points data
        const lotoPointsData = {};
        for (let [key, value] of formData.entries()) {
            if (key.startsWith('lotoPoints[')) {
                const match = key.match(/lotoPoints\[(\d+)\]\.(.+)/);
                if (match) {
                    const index = match[1];
                    const field = match[2];
                    if (!lotoPointsData[index]) {
                        lotoPointsData[index] = {};
                    }
                    lotoPointsData[index][field] = value;
                }
            }
        }
    
        updatedEquipment.lotoPoints = Object.values(lotoPointsData);
    
        // Send the updated data to the server
        updateEquipmentOnServer(updatedEquipment);
    }
    
    async function updateEquipmentOnServer(updatedEquipment) {
        try {
            const response = await fetch('/api/point-by-point/transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="_csrf"]').getAttribute('content')
                },
                body: JSON.stringify(updatedEquipment)
            });
    
            if (response.ok) {
                const result = await response.text();
                console.log('Equipment and Loto Points updated:', result);
                alert('Equipment and Loto Points updated successfully!');
                // Optionally, refresh the current equipment display or close the form
            } else {
                throw new Error('Failed to update equipment and loto points');
            }
        } catch (error) {
            console.error('Error updating equipment and loto points:', error);
            alert('Failed to update equipment and loto points. Please try again.');
        }
    }
    
    function createLotoPointFields(equipmentId, formType, index, lotoPoint = {}) {
        const lotoPointDiv = document.createElement('div');
        lotoPointDiv.classList.add('loto-point');
    
        const fields = ['id', 'tagNumber', 'description', 'specificLocation', 'normalPosition', 'isolatedPosition'];
        fields.forEach(field => {
            const label = document.createElement('label');
            label.textContent = field.charAt(0).toUpperCase() + field.slice(1) + ':';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.name = `lotoPoints[${index}].${field}`;
            input.value = lotoPoint[field] || '';
            
            lotoPointDiv.appendChild(label);
            lotoPointDiv.appendChild(input);
        });
        lotoPointDiv.querySelectorAll('input, select').forEach(element => {
            addCopyListener(element);
        });
    
        return lotoPointDiv;
    }
    
    function addLotoPointFields(equipmentId, formType) {
        const lotoPointsContainer = document.getElementById(`lotoPointsContainer_${formType}_${equipmentId}`);
        const lotoPointIndex = lotoPointsContainer.querySelectorAll('.loto-point').length;
    
        const lotoPointDiv = createLotoPointFields(equipmentId, formType, lotoPointIndex);
        lotoPointsContainer.appendChild(lotoPointDiv);
    }

    
