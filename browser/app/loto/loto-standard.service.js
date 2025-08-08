class LotoStandardService {
    constructor() {
        this.url = properties.serverUrl + '/browser/loto';
    }

    async saveLotoStandard(standard) {
        try {
            const response = await fetch(this.url + '/create-standard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(standard)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error saving loto standard:', error);
            throw error;
        }
    }

    async getAllLotoStandards(){
        try{
            const resp = await fetch(this.url+'/get-all')
            if(!resp.ok){
                throw new Error(`HTTP error! status: ${response.status}`); 
            }
            const data = await response.json();
            return data;
        }catch(error){
            console.error('Error getting loto standards', error);
            throw error;
        }
    }

    async getStandardPoints(standardId){
        try{
            const resp = await fetch(this.url+'/get-standard-points')
        }catch(error){
            console.error('Error getting loto standards', error);
            throw error;
        }
    }


}

const lotoStandardService = new LotoStandardService();
