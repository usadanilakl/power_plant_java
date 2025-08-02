import BradySdk from 'brady-web-sdk'
let bradySdk = new BradySdk(printerUpdatesCallback)

console.log("BradySdk initialized:", bradySdk);
if (!bradySdk) {
    console.error("Failed to initialize BradySdk");
}

async function scanForPrinters() {
    const statusLabel = document.getElementById('statusLabel');
    try {
        console.log("Scanninbg for printers...");

        // if ('bluetooth' in navigator && 'requestDevice' in navigator.bluetooth) {
        //     try {
        //         await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
        //     } catch (bleError) {
        //         console.error("Error requesting Bluetooth access:", bleError);
        //         statusLabel.innerText = "Bluetooth access denied";
        //         statusLabel.style.color = "red";
        //         return;
        //     }
        // } else {
        //     console.error("Web Bluetooth API is not supported in this browser");
        //     statusLabel.innerText = "Bluetooth not supported in this browser";
        //     statusLabel.style.color = "red";
        //     return;
        // }

        const sessionId = localStorage.getItem("ownership_guid");
        console.log("Session ID:", sessionId);

        console.log("Attempting to show discovered BLE devices...");
        const ownershipGuid = await bradySdk.showDiscoveredBleDevices(sessionId);
        console.log("Ownership GUID:", ownershipGuid);

        if (bradySdk.isConnected && ownershipGuid != null && ownershipGuid !== "") {
            console.log("Storing ownership GUID in localStorage");
            localStorage.setItem("ownership_guid", ownershipGuid);
        } else {
            console.log("Not storing ownership GUID. isConnected:", bradySdk.isConnected);
        }

        if (bradySdk.isConnected()) {
            console.log("Successfully connected to the printer");
            statusLabel.innerText = "Successfully Connected!";
            statusLabel.style.color = "green";
        } else {
            console.log("Failed to connect to the printer");
            statusLabel.innerText = "Failed to connect...";
            statusLabel.style.color = "red";
        }

        // Log the current state of bradySdk
        console.log("BradySdk state:", {
            isConnected: bradySdk.isConnected(),
            status: bradySdk.status,
            printerName: bradySdk.printerName,
            printerModel: bradySdk.printerModel
        });

    } catch (error) {
        console.error("Error in scan button click handler:", error);
        statusLabel.innerText = "Error: " + error.message;
        statusLabel.style.color = "red";
    }

}

async function autoScan(){
    if (bradySdk.isConnected){
        printerUpdatesCallback();
    }else{
        scanForPrinters();
    }
}

function printerUpdatesCallback(changedProperties) {
    const statusLabel = document.getElementById('statusLabel');
    statusLabel.style.color = "black";
    let detailsString = "";
    detailsString += "PrinterStatus: " + bradySdk.status + "\n";
    detailsString += "PrinterName: " + bradySdk.printerName + "\n";
    detailsString += "PrinterModel: " + bradySdk.printerModel + "\n";
    statusLabel.innerText = detailsString;

    if (changedProperties != null && changedProperties.length !== 0) {
        console.log("Changed Properties:", changedProperties);
    }

    if (!bradySdk.printerDiscovery.isConnected) {
        statusLabel.innerText = "Failed to connect...";
        statusLabel.style.color = "red";
    }
}

async function createImageFromStringsSingle(string1, string2) {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 250; // 3 inches at 100 DPI
    canvas.height = 100; // 1 inch at 100 DPI

    // Get the 2D rendering context
    const ctx = canvas.getContext('2d');

    // Set background to white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Function to fit text
    function fitText(text, maxWidth, maxHeight) {
        let fontSize = 100;
        ctx.font = `${fontSize}px Arial`;

        while (true) {
            const lines = getLines(ctx, text, maxWidth);
            const totalHeight = fontSize * lines.length;

            if (totalHeight <= maxHeight && ctx.measureText(lines[0]).width <= maxWidth) {
                return { fontSize, lines };
            }

            fontSize--;
            ctx.font = `${fontSize}px Arial`;

            if (fontSize <= 1) break;
        }

        return { fontSize: 1, lines: [text] };
    }

    // Function to get lines of text
    function getLines(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    // Fit text for both strings
    const { fontSize: fontSize1, lines: lines1 } = fitText(string1, canvas.width, canvas.height / 2);
    const { fontSize: fontSize2, lines: lines2 } = fitText(string2, canvas.width, canvas.height / 2);

    // Adjust these values to control the vertical positioning
    const topTextOffset = 0.3; // Move top text down (0.2 means 20% from the top)
    const bottomTextOffset = 0.7; // Move bottom text up (0.8 means 80% from the top)

    // Draw the first string
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fontSize1}px Arial`;
    lines1.forEach((line, i) => {
        const y = (canvas.height * topTextOffset) + (i - (lines1.length - 1) / 2) * fontSize1;
        ctx.fillText(line, canvas.width / 2, y);
    });

    // Draw the second string
    ctx.font = `${fontSize2}px Arial`;
    lines2.forEach((line, i) => {
        const y = (canvas.height * bottomTextOffset) + (i - (lines2.length - 1) / 2) * fontSize2;
        ctx.fillText(line, canvas.width / 2, y);
    });

    return canvas;
}

async function createImageFromStrings(string1, string2) {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const dpi = 100; // Assuming 100 DPI
    const singleWidth = 2.5 * dpi; // 2.5 inches at 100 DPI
    const spacing = 0.6 * dpi; // 0.6 inches spacing
    canvas.width = singleWidth * 2 + spacing; // Two labels plus spacing
    canvas.height = 1 * dpi; // 1 inch at 100 DPI

    // Get the 2D rendering context
    const ctx = canvas.getContext('2d');

    // Set background to white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Function to fit text
    function fitText(text, maxWidth, maxHeight) {
        let fontSize = 100;
        ctx.font = `${fontSize}px Arial`;
    
        while (true) {
            const lines = getLines(ctx, text, maxWidth);
            const totalHeight = fontSize * lines.length;
    
            // Check if all lines fit within maxWidth and the total height is within maxHeight
            const allLinesFit = lines.every(line => ctx.measureText(line).width <= maxWidth);
            if (totalHeight <= maxHeight && allLinesFit) {
                return { fontSize, lines };
            }
    
            fontSize--;
            ctx.font = `${fontSize}px Arial`;
    
            if (fontSize <= 1) break;
        }
    
        // If we can't fit the text, return the smallest possible font size and split lines
        return { fontSize: 1, lines: getLines(ctx, text, maxWidth) };
    }

    // Function to get lines of text
    function getLines(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    // Function to draw a single label
    function drawLabel(x, width, string1, string2) {
        const { fontSize: fontSize1, lines: lines1 } = fitText(string1, width, canvas.height / 2);
        const { fontSize: fontSize2, lines: lines2 } = fitText(string2, width, canvas.height / 2);

        const topTextOffset = 0.4;
        const bottomTextOffset = 0.8;

        // Draw the first string
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${fontSize1}px Arial`;
        lines1.forEach((line, i) => {
            const y = (canvas.height * topTextOffset) + (i - (lines1.length - 1) / 2) * fontSize1;
            ctx.fillText(line, x + width / 2, y);
        });

        // Draw the second string
        ctx.font = `${fontSize2}px Arial`;
        lines2.forEach((line, i) => {
            const y = (canvas.height * bottomTextOffset) + (i - (lines2.length - 1) / 2) * fontSize2;
            ctx.fillText(line, x + width / 2, y);
        });
    }

    // Draw two independent labels
    drawLabel(0, singleWidth, string1, string2);
    drawLabel(singleWidth + spacing, singleWidth, string1, string2);

    // Draw a separator line between the labels
    ctx.beginPath();
    ctx.moveTo(singleWidth + spacing / 2, 0);
    ctx.lineTo(singleWidth + spacing / 2, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();

    return canvas;
}

function createPrinterControls() {
    const statusLabel = document.getElementById('statusLabel');
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'printer-controls';

    const scanBtn = document.createElement('button');
    scanBtn.id = 'scanBtn';
    scanBtn.textContent = 'Scan for Printers';
    scanBtn.onclick = async () => {
        scanForPrinters();
    };

    const numCopies = document.createElement('input');
    numCopies.type = 'number';
    numCopies.id = 'numCopies';
    numCopies.value = '1';
    numCopies.min = '1';

    const cutOptions = document.createElement('select');
    cutOptions.id = 'cutOptions';
    const cutOptionValues = ['EndOfJob', 'EndOfLabel', 'Never'];
    const cutOptionTexts = ['Cut at End of Job', 'Cut at End of Label', 'Never Cut'];
    cutOptionValues.forEach((value, index) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = cutOptionTexts[index];
        cutOptions.appendChild(option);
    });

    const disconnectBtn = document.createElement('button');
    disconnectBtn.id = 'disconnectBtn';
    disconnectBtn.textContent = 'Disconnect';
    disconnectBtn.onclick = async () => {
        const disconnectStatus = await bradySdk.disconnect();
        if (disconnectStatus) {
            statusLabel.innerText = "Disconnected Successfully!";
            statusLabel.style.color = "green";
        } else {
            statusLabel.innerText = "Disconnection Failed...";
            statusLabel.style.color = "red";
        }
    };

    controlsContainer.appendChild(scanBtn);
    controlsContainer.appendChild(numCopies);
    controlsContainer.appendChild(cutOptions);
    controlsContainer.appendChild(disconnectBtn);

    return controlsContainer;
}

function printPopup(textTop = '', textBottom = '') {
    // Create popup container
    const popup = document.createElement('div');
    popup.id = 'printPopup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        max-width: 80%;
        max-height: 80%;
        overflow-y: auto;
    `;

    const statusLabel = document.createElement('div');
    statusLabel.id = 'statusLabel';

    // Create input fields
    const input1 = document.createElement('input');
    input1.type = 'text';
    input1.value = textTop;
    input1.placeholder = 'Top Text';

    const input2 = document.createElement('input');
    input2.type = 'text';
    input2.value = textBottom;
    input2.placeholder = 'Bottom Text';

    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.id = 'popupPreviewContainer';
    previewContainer.style.marginTop = '10px';

    // Create printer controls
    const printerControls = createPrinterControls();

    // Create buttons
    const printButton = document.createElement('button');
    printButton.textContent = 'Print';
    printButton.onclick = async () => {
        if (!bradySdk.isConnected()) {
            statusLabel.innerText = "Please connect to a printer first.";
            statusLabel.style.color = "red";
            return;
        }
    
        const string1 = input1.value;
        const string2 = input2.value;
        const numCopies = document.getElementById('numCopies').value;
        const cutOption = document.getElementById('cutOptions').value;
    
        if (!string1 && !string2) {
            statusLabel.innerText = "Please enter at least one string.";
            statusLabel.style.color = "red";
            return;
        }
    
        try {
            const canvas = await createImageFromStrings(string1, string2);
            const imageToPrint = await new Promise(resolve => {
                canvas.toBlob(blob => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.src = URL.createObjectURL(blob);
                });
            });
    
            const printingStatus = await bradySdk.printBitmap(imageToPrint);
            if (printingStatus) {
                statusLabel.innerText = "Printed Successfully!";
                statusLabel.style.color = "green";
            } else {
                statusLabel.innerText = "Failed to print...";
                statusLabel.style.color = "red";
            }
        } catch (error) {
            console.error("Error in print button click handler:", error);
            statusLabel.innerText = "Error: " + error.message;
            statusLabel.style.color = "red";
        }

    };

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.onclick = () => {
        document.body.removeChild(popup);
    };

    // Assemble popup
    popup.appendChild(statusLabel);
    popup.appendChild(input1);
    popup.appendChild(document.createElement('br'));
    popup.appendChild(input2);
    popup.appendChild(document.createElement('br'));
    popup.appendChild(previewContainer);
    popup.appendChild(document.createElement('br'));
    popup.appendChild(printerControls);
    popup.appendChild(document.createElement('br'));
    popup.appendChild(printButton);
    popup.appendChild(closeButton);

    // Add popup to body
    document.body.appendChild(popup);

    // Function to update preview
    function updatePopupPreview() {
        const string1 = input1.value;
        const string2 = input2.value;
        createImageFromStrings(string1, string2).then(canvas => {
            previewContainer.innerHTML = '';
            previewContainer.appendChild(canvas);
            canvas.style.width = '100%';
            canvas.style.height = 'auto';
        });
    }

    // Add event listeners to update preview when input changes
    input1.addEventListener('input', updatePopupPreview);
    input2.addEventListener('input', updatePopupPreview);

    // Initial preview
    updatePopupPreview();
    autoScan();
}


// Export the necessary functions
export { printPopup, scanForPrinters, createImageFromStrings };
