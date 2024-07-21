function dbClick(element, oneClickFunc, twoClickFunc) {
    let counter = 0;
    const clickCounter = () => {
        counter++;
        if (counter === 1) {
            setTimeout(() => {
                if (counter === 1) {
                    oneClickFunc();
                } else if (counter > 1) {
                    twoClickFunc();
                }
                counter = 0; // reset counter
            }, 300);
        }
    };
    element.addEventListener('click', clickCounter);
}

function toggleBoolean(booleanVariable){
    if(booleanVariable) booleanVariable = false;
    else booleanVariable = true;
}

function hide(element){
    element.classList.add('hide');
}

async function loadDataIntoContainer(container,data){
    let content = await data();
    container.innerHTML = content;
}

function firstLetterToUpperCase(sentence){
    let res = "";
    for (let word of sentence.split(",")) {
        let result = word.trim().toLowerCase();
        result = result.substring(0,1).toUpperCase()+result.substring(1);
        res +=result+" ";
    }
    return res.trim();
}

function copyToClipboard(inputElement,messageElement) {
    const inputValue = inputElement.value;

    // Use the Clipboard API to write the text
    navigator.clipboard.writeText(inputValue).then(() => {
        // Success message
        // messageElement.textContent = 'Value copied to clipboard: ' + inputValue;
        // messageElement.style.color = 'green';
    }).catch(err => {
        // Error message
        // messageElement.textContent = 'Failed to copy.';
        // messageElement.style.color = 'red';
        console.error('Error copying to clipboard:', err);
    });
}

async function checkClipboardAndPaste() {
    try {
        // Check if clipboard API is supported
        if (navigator.clipboard) {
            // Read text from clipboard
            const clipboardText = await navigator.clipboard.readText();

            // If clipboard has text, paste it into the input field
            if (clipboardText) {
                inputElement.value = clipboardText;

                // Highlight the content in the input field
                inputElement.select();

                // Clear the clipboard
                await navigator.clipboard.writeText('');

                // Success message
                messageElement.textContent = 'Content pasted and clipboard cleared!';
                messageElement.style.color = 'green';
            } else {
                // Message if clipboard is empty
                messageElement.textContent = 'Clipboard is empty.';
                messageElement.style.color = 'orange';
            }
        } else {
            // Error message if Clipboard API is not supported
            messageElement.textContent = 'Clipboard API not supported.';
            messageElement.style.color = 'red';
        }
    } catch (err) {
        // Error message if something goes wrong
        messageElement.textContent = 'Failed to read from clipboard.';
        messageElement.style.color = 'red';
        console.error('Error reading from clipboard:', err);
    }
}

async function checkClipboardAndPasteShort(inputElement) {

        if (navigator.clipboard) {
            const clipboardText = await navigator.clipboard.readText();
            if (clipboardText) {
                inputElement.value = clipboardText;
                inputElement.select();
                await navigator.clipboard.writeText('');
            }
        }
}

