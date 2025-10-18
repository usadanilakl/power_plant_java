const workRequestService = {

baseUrl : 'http://localhost:8082/ng/work-requests',

async sendRequest(url, method = 'GET', body = null) {
  try {
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : null
    });

    if (!response.ok) {
      // HTTP status outside 200-299
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Assume the response is JSON and parse it
    const data = await response.json();
    return data;
  } catch (error) {
    // Log or handle network errors or thrown above HTTP errors
    console.error("Fetch failed: ", error.message);
    throw error; // optionally re-throw to handle further up
  }
},

async getAllRequests() {
  try {
    const url = `${this.baseUrl}/get-all-by-status/active`;
    const result = await this.sendRequest(url);
    
        document.getElementById('responseOutput').textContent = '';
        const now = new Date();
        const formattedDateTime = now.toLocaleString();
        document.getElementById('responseOutput').textContent = `Last Update was performed: ${formattedDateTime}`;

    return result;
  } catch (error) {
    // Handle or display error for getAllRequests caller
    console.error("Failed to get all requests: ", error.message);
    document.getElementById('responseOutput').textContent = 'Error: ' + error.message;
    throw error;
  }
},

async openBuilder(id){ 
  await this.setStatus(id,'processed');
        if (window.javaScriptBridge) {
            try {
                if(id){
                  await this.setStatus(id,'processed');
                  window.javaScriptBridge.openInBrowser('http://localhost:8082/app/permit-builder/daily-packages/'+id);
                }else {
                  window.javaScriptBridge.openInBrowser('http://localhost:8082/app/permit-builder/daily-packages');
                }
                console.log('openApplication called successfully');
            } catch (error) {
                console.error('Error calling openApplication:', error);
            }
        } else {
            console.error('JavaFX bridge not available');
        }
},

async archive(id){
  try {
    const url = `${this.baseUrl}/process/${id}`;
    const result = await this.sendRequest(url);
    return result;
  } catch (error) {
    // Handle or display error for getAllRequests caller
    console.error("Failed to archive: ", error.message);
    document.getElementById('responseOutput').textContent = 'Error: ' + error.message;
    // throw error;
  }
},

async setStatus(id, status){
  try {
    const url = `${this.baseUrl}/change-status/${id}/${status}`;
    const result = await this.sendRequest(url);
    return result;
  } catch (error) {
    // Handle or display error for getAllRequests caller
    console.error("Failed to archive: ", error.message);
    document.getElementById('responseOutput').textContent = 'Error: ' + error.message;
    // throw error;
  }
}

}