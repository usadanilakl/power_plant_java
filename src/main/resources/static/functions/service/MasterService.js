
getAllFiles().then(() => {
    getVendor("PD-040").then(vendorFiles => {
        vendorFiles.forEach(e => console.log(JSON.stringify(e)));
    });
});
