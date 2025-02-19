async function createFileMenu() {
    const files = await getFilesToVerify();
    const menu = document.createElement('div');
    menu.id = 'file-menu';
    menu.className = 'file-menu-class';

    const vendorMap = new Map();

    for (const file of files) {
        if (!vendorMap.has(file.vendor.name)) {
            const vendorTab = createVendorTab(file.vendor);
            menu.appendChild(vendorTab);
            vendorMap.set(file.vendor.name, vendorTab.querySelector('.vendor-files-container'));
        }

        const fileButton = createFileButton(file);
        vendorMap.get(file.vendor.name).appendChild(fileButton);
    }

    return menu;
}

function createVendorTab(vendor) {
    const vendorTab = document.createElement('div');
    vendorTab.id = `${vendor.name}_id`;
    vendorTab.className = 'vendor-tab';
    
    const vendorName = document.createElement('span');
    vendorName.textContent = vendor.name;
    vendorTab.appendChild(vendorName);

    vendorTab.addEventListener('click', () => {
        vendorTab.classList.toggle('active');
    });

    const vendorFilesContainer = document.createElement('div');
    vendorFilesContainer.classList.add('vendor-files-container');
    vendorTab.appendChild(vendorFilesContainer);

    return vendorTab;
}

function createFileButton(file) {
    const btn = document.createElement('button');
    btn.textContent = file.name;
    btn.addEventListener('click', () => loadFileFromMenu(file.id));
    return btn;
}

async function loadFileFromMenu(fileId) {
    const file = await getFileWithConflictedPoints(fileId);
    loadPictureWithFile(file);
}