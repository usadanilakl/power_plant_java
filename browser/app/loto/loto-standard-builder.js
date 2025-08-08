class LotoStandardBuilder {
    constructor() {
        this.lotoPoints = null;
        this.description = null;
        this.name = null;
        this.popup = null;
    }

    showLotoStandard() {
        // Create form element
        const form = document.createElement('form');
        form.style.display = 'flex';
        form.style.flexDirection = 'column';
        form.style.gap = '10px';
        form.style.minWidth = '300px';

        // Name input
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Name:';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.name = 'name';
        nameInput.required = true;

        // Description input
        const descLabel = document.createElement('label');
        descLabel.textContent = 'Description:';
        const descInput = document.createElement('textarea');
        descInput.name = 'description';
        descInput.rows = 3;
        descInput.required = true;

        // Loto Points input (could be a textarea or other input, simplified here)
        const pointsLabel = document.createElement('label');
        pointsLabel.textContent = 'Loto Points (comma separated):';
        const pointsInput = document.createElement('input');
        pointsInput.type = 'text';
        pointsInput.name = 'lotoPoints';

        // Submit button
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.textContent = 'Save';

        // Append elements to the form
        form.appendChild(nameLabel);
        form.appendChild(nameInput);
        form.appendChild(descLabel);
        form.appendChild(descInput);
        form.appendChild(pointsLabel);
        form.appendChild(pointsInput);
        form.appendChild(submitBtn);

        // Create the Popup with form as content, no auto close (duration=0)
        this.popup = new Popup(form, { duration: 0, type: 'info', position: 'top-right' });

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // prevent normal form submit
            const name = nameInput.value.trim();
            const description = descInput.value.trim();
            const lotoPointsStr = pointsInput.value.trim();

            if (!name || !description) {
                alert('Name and Description are required!');
                return;
            }

            // Convert lotoPoints string to an array (split by comma and trim)
            const lotoPoints = lotoPointsStr 
                ? lotoPointsStr.split(',').map(p => p.trim()).filter(p => p.length > 0)
                : [];

            // Save or update internal class properties
            this.name = name;
            this.description = description;
            this.lotoPoints = lotoPoints;

            // Here you could:
            // - Call a service to save it
            // - Update UI
            // - Show success message

            // For demo, just log and close popup
            console.log('Loto Standard saved:', { name, description, lotoPoints });

            // Close popup
            this.popup.close();
        });
    }
}
