   
const TOKEN_KEY = 'auth_token';
const TOKEN_SET_TIME_KEY = 'auth_token_set_time';
const USER_ID = 'user_id';
const USER = 'user';
const COMPANY = 'company';
const NAME = 'name';
const TOKEN_EXPIRATION_MS = 60 * 60 * 1000 * 24; // 24 hour expiration as example
 const url = 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/832a87fa6bd042459fbb042c2163f25a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=CskQMxLQfynMFCI7AxUQtQWVIzVmkTydg9dxDN1-1M4';

// Check token existence and expiration
function checkAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  const tokenSetTime = localStorage.getItem(TOKEN_SET_TIME_KEY);

  if (!token || !tokenSetTime) return false;

  const now = Date.now();
  const elapsed = now - parseInt(tokenSetTime, 10);

  // Returns true if token is present and not expired
  return elapsed < TOKEN_EXPIRATION_MS;
}

// Authenticate by sending username, password to your Power Automate endpoint
async function authenticate(email, password) {

  const body = {
    "actionType": "authenticate",
    "email": email,
    "password": password
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();

    // Assume token is in data.token (adjust based on your API)
    if (data.token) {
        const cleanToken = data.token.replace(/[\r\n]+/g, '').trim();
      localStorage.setItem(TOKEN_KEY, cleanToken);
      localStorage.setItem(TOKEN_SET_TIME_KEY, Date.now().toString());
      localStorage.setItem(USER_ID, data.userId);
      localStorage.setItem(USER, JSON.stringify(data.user));
      localStorage.setItem(NAME, JSON.stringify(data.name));
      localStorage.setItem(COMPANY, JSON.stringify(data.company));
      console.log(data)
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Authentication failed:', error);
    return false;
  }
}

async function getProtectedContent(token,contentType) {
  const url = 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/832a87fa6bd042459fbb042c2163f25a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=CskQMxLQfynMFCI7AxUQtQWVIzVmkTydg9dxDN1-1M4';

  const body = {
    "actionType": "getProtectedContent",
    "token": token,
    "contentType": contentType
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();

    // Assume token is in data.token (adjust based on your API)
    if (data) {
      return data;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Authentication failed:', error);
    return false;
  }
}

async function getRequests(){
    if(!checkAuth()) openFile("./login.html");
    const cleanToken = localStorage.getItem(TOKEN_KEY).replace(/[\r\n]+/g, '').trim();
    return await getProtectedContent(cleanToken,'requests');
}

async function logOut(){
    if(!checkAuth()) return;
      const body = {
    "actionType": "logout",
    "userId": localStorage.getItem(USER_ID)
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
  }catch(error){
    console.log(error);
  }

  
      localStorage.setItem(TOKEN_KEY, null);
      localStorage.setItem(TOKEN_SET_TIME_KEY, null);
      localStorage.setItem(USER_ID, null);
      localStorage.clear();


}

function prefillRequestForm(){
    if(!checkAuth()) return;
    const name = localStorage.getItem(NAME);
    const company = localStorage.getItem(COMPANY);

    console.log(name,company)

    nameInput.value = name.replaceAll('"','');
    companyInput.value = company.replaceAll('"','');

      const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // months are zero-based
    const dd = String(today.getDate()+1).padStart(2, '0');
    
    dateInput.value = `${yyyy}-${mm}-${dd}`;
}

    async function checkIfUserNameAlreadyExists(userName,password) {
        const url = 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b6c024f8020c42a4b697425a84a97653/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qWEExDdL83FWcObWTykEQEG01HKHWAnvKBzA-ttwvms';

        const body = {
            actionType: "checkIfUserNameAlreadyExists",
            userName: userName,
            password: password
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
            console.log("User was found: " + data)
            return data;
        } catch (error) {
            console.log(error);
        }
    }
    
    async function getPreviouslySubmittedForms(userName,password) {
        const url = 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b6c024f8020c42a4b697425a84a97653/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qWEExDdL83FWcObWTykEQEG01HKHWAnvKBzA-ttwvms';

        const body = {
            actionType: "getPreviouslySubmittedForms",
            userName: userName,
            password: password
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
            console.log("found previously submitted forms: " + data)
            return data;
        } catch (error) {
            console.log(error);
        }
    }