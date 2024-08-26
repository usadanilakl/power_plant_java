
class Controller{
    static async request(url,metadata,responseType){
        try {
            console.log("This is the url: " +url)
            const response = await fetch(url, metadata);
        
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
        
            if(responseType) return await response.text();
            return await response.json();
          } catch (error) {
            if (error.name === 'TypeError') {
              // Handle network errors (e.g., no internet connection)
              console.error('Network error:', error);
            } else {
              // Handle other types of errors (e.g., server errors)
              console.error('Fetch error:', error);
            }
            throw error;
          }

    }

}

export default Controller;