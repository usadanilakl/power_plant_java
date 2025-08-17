const referenceDataService = {
    getDataByTagNumber(tagNumber) {
        const cleanTagNumber = this.cleanString(tagNumber);
        return referenceData.filter(row => {
            return row.tagNumbers && Array.isArray(row.tagNumbers) && row.tagNumbers.length > 0 &&
                row.tagNumbers.some(tag => this.cleanString(tag) === cleanTagNumber);
        });
    },

    cleanString(str) {
        return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }
}