async function displayEquipmentWithConflict(eqId){
    const data = await getConflict(eqId);
    for(let conflict in data){
        const equipment = data[conflict];
        for(let point of equipment){
            buildEquipmentForm(conflict, point);
        }
    }
}

        /*******************************************************************
         * EQUIPMENT POINT FORM
         * ****************************************************************/

        function buildEquipmentForm(conflict, equipment) {
            const form = document.createElement('form');
            form.id = 'equipmentForm_' + equipment.id;
            form.classList.add('equipment-form');

            const title = document.createElement('h2');
            title.textContent = conflict;
            form.appendChild(title);

            const equipmentFields = ['tagNumber', 'description', 'specificLocation'];

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
                    const response = await fetch('/conflict/update-equipment/'+document.getElementById('api-dropdown').value, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrfToken
                        },
                        body: JSON.stringify(updatedEquipment)
                    });
        
                    if (response.ok) {
                        const result = await response.json();
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
        }