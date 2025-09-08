const baseUrl = 'http://localhost:8082/power-automate';

async function sendRequest(url, method = 'GET', body = null) {
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
}

async function getAllRequests() {
  try {
    const url = `${baseUrl}/get-all`;
    const result = await sendRequest(url);
    // Optionally do something with the result here before returning
    return result;
  } catch (error) {
    // Handle or display error for getAllRequests caller
    console.error("Failed to get all requests: ", error.message);
    // Return fallback value or re-throw based on design
    throw error;
  }
}

    async function getAllRequestsOld() {
        const url = 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b6c024f8020c42a4b697425a84a97653/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qWEExDdL83FWcObWTykEQEG01HKHWAnvKBzA-ttwvms';

        const body = {
            actionType: "getAllRequests"
        };

        try {
            const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
            });

            if (!response.ok) {
            throw new Error('HTTP error ' + response.status);
            }

            const data = await response.json();

            document.getElementById('responseOutput').textContent = '';
            const now = new Date();
            const formattedDateTime = now.toLocaleString();
            document.getElementById('responseOutput').textContent = `Last Update was performed: ${formattedDateTime}`;


            currentRequests = data;
            return data;
        } catch (error) {
            document.getElementById('responseOutput').textContent = 'Error: ' + error.message;
            return null;
        }
    }
