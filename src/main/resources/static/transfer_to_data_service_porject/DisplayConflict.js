let equipmentFormsPopup = document.getElementById('equipmentFormsPopup');
let closePopup = document.getElementsByClassName('close-popup')[0];

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

// Modify your existing displayEquipmentWithConflict function
async function displayEquipmentWithConflict(eqId) {
    console.log('Displaying equipment with conflict for eqId:', eqId);
    try {
        const data = await getConflict(eqId);
        console.log('Data received in displayEquipmentWithConflict:', data);
        
        if (data === null) {
            console.error('No data received from getConflict');
            return;
        }

        // Clear previous forms
        document.getElementById('equipmentFormsContainer').innerHTML = '';

        for (let point of data) {
            buildEquipmentForm(point);
        }

        // Open the popup after forms are built
        openEquipmentFormsPopup();
    } catch (error) {
        console.error('Error in displayEquipmentWithConflict:', error);
    }
}

        /*******************************************************************
         * EQUIPMENT POINT FORM
         * ****************************************************************/

        function buildEquipmentForm(equipment) {
            const shape = document.querySelector(`div[data-point-id="${equipment.id}"]`);
            if (!shape) {
                console.warn(`Shape not found for equipment with id ${equipment.id}`);
            }
            const form = document.createElement('form');
            form.id = 'equipmentForm_' + equipment.id;
            form.classList.add('equipment-form');

            const title = document.createElement('h2');
            title.textContent = equipment.tagNumber;
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

            const fieldDiv = document.createElement('div');
            fieldDiv.classList.add('equipment-field');

            // File Number field
            const label = document.createElement('label');
            label.htmlFor = `${equipment.id}_mainFile`;
            label.textContent = 'File Number:';

            const filePath = equipment.files && equipment.files.length > 0 ? equipment.files[0] : '';
            const fileNumber = filePath.substring(filePath.lastIndexOf('/') + 1);

            const input = document.createElement('input');
            input.type = 'text';
            input.id = `${equipment.id}_mainFile`;
            input.name = 'equipment.files[0]';
            input.value = fileNumber;
            input.readOnly = true;

            fieldDiv.appendChild(label);
            fieldDiv.appendChild(input);
            form.appendChild(fieldDiv);

            // Hidden input for equipment ID
            const idInput = document.createElement('input');
            idInput.type = 'hidden';
            idInput.name = 'equipment.id';
            idInput.value = equipment.id || '';
            form.appendChild(idInput);

            // Add update coordinates button
            const updateCoordsButton = document.createElement('button');
            updateCoordsButton.type = 'button';
            updateCoordsButton.textContent = 'Update Coordinates';
            updateCoordsButton.onclick = () => updateCoordinates(currentShape);
            form.appendChild(updateCoordsButton);

            // Loto Points
            const lotoPointsContainer = document.createElement('div');
            lotoPointsContainer.id = `lotoPointsContainer_${equipment.id}`;
            lotoPointsContainer.classList.add('loto-points-container');
            
            const lotoPointsTitle = document.createElement('h3');
            lotoPointsTitle.textContent = 'Loto Points';
            lotoPointsContainer.appendChild(lotoPointsTitle);
            
            form.appendChild(lotoPointsContainer);

            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('button-container');

            const addLotoPointButton = document.createElement('button');
            addLotoPointButton.type = 'button';
            addLotoPointButton.textContent = 'Add Loto Point';
            addLotoPointButton.onclick = () => addLotoPointFields(equipment.id);
            buttonContainer.appendChild(addLotoPointButton);

            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.textContent = 'Update Equipment and Loto Points';
            buttonContainer.appendChild(submitButton);

            form.appendChild(buttonContainer);
        
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
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
                        // alert('Equipment and Loto Points updated successfully!');
                        form.remove();    
                        let forms = document.querySelectorAll('.equipment-form');
                        if (forms.length === 0) {
                            const dropdown = document.getElementById('api-dropdown');
                            if (dropdown.value) {
                                await getConflictList(dropdown.value);
                            }
                        }
                    } else {
                        throw new Error('Failed to update equipment and loto points');
                    }
                } catch (error) {
                    console.error('Error updating equipment and loto points:', error);
                    alert('Failed to update equipment and loto points. Please try again.');
                }
            });

            document.getElementById('equipmentFormsContainer').appendChild(form);

            if (equipment.lotoPoints && equipment.lotoPoints.length > 0) {
                equipment.lotoPoints.forEach((lotoPoint, index) => {
                    addLotoPointFields(equipment.id, lotoPoint, index);
                });
            }

            form.querySelectorAll('input, select').forEach(element => {
                addCopyListener(element);
            });
        }
        
        function addLotoPointFields(equipmentId, lotoPoint = {}, index = Date.now()) {
            const container = document.getElementById(`lotoPointsContainer_${equipmentId}`);
            const lotoPointDiv = document.createElement('div');
            lotoPointDiv.classList.add('loto-point');
        
            const fields = ['id', 'tagNumber', 'description', 'specificLocation', 'normalPosition', 'isolatedPosition'];
        
            fields.forEach(field => {
                if (field !== 'id') {
                    const fieldDiv = document.createElement('div');
                    fieldDiv.classList.add('loto-point-field');
        
                    const label = document.createElement('label');
                    label.htmlFor = `lotoPoint_${field}_${index}`;
                    label.textContent = field.charAt(0).toUpperCase() + field.slice(1) + ':';
        
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.id = `lotoPoint_${field}_${index}`;
                    input.name = `lotoPoints[${index}].${field}`;
                    input.value = lotoPoint[field] || '';
        
                    fieldDiv.appendChild(label);
                    fieldDiv.appendChild(input);
                    lotoPointDiv.appendChild(fieldDiv);
                } else {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = `lotoPoints[${index}].${field}`;
                    input.value = lotoPoint[field] || '';
                    lotoPointDiv.appendChild(input);
                }
            });
        
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.textContent = 'Remove';
            removeButton.onclick = () => lotoPointDiv.remove();
            lotoPointDiv.appendChild(removeButton);
        
            container.appendChild(lotoPointDiv);

            container.querySelectorAll('input, select').forEach(element => {
                addCopyListener(element);
            });
        }

        function updateCoordinates(){
            const shape = currentShape.shape;
            const id = shape.dataset.pointId;
            const coordinates = currentShape.coordinates;
            console.log('Updating coordinates for point ID:', id);
            const coordinatesString = JSON.stringify(coordinates).replace(/[{}"]/g, '');
            document.getElementById(`${id}_coordinates`).value = coordinatesString;
        }

        /*******************************************************************
         * CREATE NEW EQUIPMENT
         * ****************************************************************/



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
