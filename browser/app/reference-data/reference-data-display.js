class ReferenceDataDisplay {
    // showData(tagNumber) {
    //     // Create a formatted HTML content for the popup
    //     const data = referenceDataService.getDataByTagNumber(tagNumber);
    //     const content = this.createFormattedContent(data);

    //     // Create and show the popup
    //     new Popup(content, {
    //         duration: 0,  // Set to 0 to keep it open until manually closed
    //         type: 'info',
    //         position: 'top-right'
    //     });
    // }
    showData(tagNumber) {
        // Get the data for the tag number
        const data = referenceDataService.getDataByTagNumber(tagNumber);

        if (data.length === 0) {
            // No data found for the tag number
            new FloatingWindow('No data found for this tag number.', 'Reference Data', `reference-data-${tagNumber}`);
            return;
        }

        // Create a formatted HTML content for the floating window
        const content = this.createFormattedContent(data);

        // Create and show the floating window
        new FloatingWindow(
            content,
            `Reference Data for ${tagNumber}`,
            `reference-data-${tagNumber}`
        );
    }

    createFormattedContent(dataArray) {
        const data = dataArray[0];
        const container = document.createElement('div');
        container.style.maxWidth = '400px';
        container.style.maxHeight = '80vh';
        container.style.overflowY = 'auto';

        const title = document.createElement('h3');
        title.textContent = data.description;
        container.appendChild(title);

        const files = this.getFiles(data.fileNumbers);

        const details = [
            { label: 'ID', value: data.id },
            { label: 'Reference Type', value: data.referenceType },
            { label: 'Reference Group', value: data.referenceGroup },
            { label: 'Tag Numbers', value: data.tagNumbers.join(', ') },
            // { label: 'File Numbers', value: data.fileNumbers.join(', ') }
        ];

        details.forEach(detail => {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${detail.label}:</strong> ${detail.value}`;
            container.appendChild(p);
        });

        // Create file buttons
        if(files.length > 0){
            const fileButtonsContainer = document.createElement('div');
            fileButtonsContainer.innerHTML = '<strong>Files:</strong> ';
            files.forEach(file => {
                const button = document.createElement('button');
                button.textContent = file.fileNumber;
                button.dataset.fileLink = file.fileLink;
                button.style.marginRight = '5px';
                button.style.marginBottom = '5px';
                fileButtonsContainer.appendChild(button);
            });
            fileButtonsContainer.addEventListener('click', (event) => {
                if (event.target.tagName === 'BUTTON') {
                    event.stopPropagation();
                    const fileLink = event.target.dataset.fileLink.replace('file//', '');
                    new PdfViewer(fileLink).open();
                }
            });
            container.appendChild(fileButtonsContainer);
        }

        if (data.characteristics) {
            const charTitle = document.createElement('h4');
            charTitle.textContent = 'Characteristics';
            container.appendChild(charTitle);

            const charList = document.createElement('ul');
            for (const [key, value] of Object.entries(data.characteristics)) {
                const li = document.createElement('li');
                li.textContent = `${key}: ${value}`;
                charList.appendChild(li);
            }
            container.appendChild(charList);
        }

        if (data.references) {
            const refTitle = document.createElement('h4');
            refTitle.textContent = 'References';
            container.appendChild(refTitle);

            const refList = document.createElement('ul');
            for (const [key, value] of Object.entries(data.references)) {
                const li = document.createElement('li');
                li.textContent = `${key}: ${value}`;
                refList.appendChild(li);
            }
            container.appendChild(refList);
        }

        return container;
    }

    getFiles(fileNumbers) {
        const files = [];
        fileNumbers.forEach(fileNumber => {
            try {
                const matchingFiles = fileService.getFilesByNumberContaining(fileNumber);
                if (matchingFiles && matchingFiles.length > 0) {
                    files.push(...matchingFiles); // Spread operator to flatten the array
                } else {
                    console.warn(`No files found for number: ${fileNumber}`);
                }
            } catch (error) {
                console.error(`Error retrieving files for number ${fileNumber}:`, error);
            }
        });
        return files;
    }
}

const referenceDataDisplay = new ReferenceDataDisplay();