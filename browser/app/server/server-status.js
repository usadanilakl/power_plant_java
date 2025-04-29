let attemptCount = 0;
let isServerRunning = false;
const attemptsLimit = 30;  // Maximum number of attempts to connect to the server

function checkServerStatus() {
    fetch(properties.serverUrl+'/server/ping')
        .then(response => {
            if (response.ok) {
                document.getElementById('status').textContent = 'Server is up and running!';
                document.getElementById('status').style.color = 'green';
                isServerRunning = true;
                attemptCount = 0;
                update.checkForUpdates();
            } else {
                throw new Error('Server is offline');
            }
        })
        .catch(error => {
            console.log('Failed to connect to server: ' + error.message);
            document.getElementById('status').textContent = 'Connecting to server. Please wait...';
            document.getElementById('status').style.color = 'red';
            if(attemptCount<attemptsLimit)setTimeout(checkServerStatus, 2000);  // Try again after 2 seconds
            else document.getElementById('status').textContent = 'Failed to connect to server after '+ attemptCount + ' attempts. You can try to close this window and reopen the app.';
            attemptCount++;
        });


}

function stopServer() {
    fetch(properties.serverUrl+'/server/stop', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (response.ok) {
            document.getElementById('status').textContent = 'Server is shutting down...';
            document.getElementById('status').style.color = 'orange';
            // Start checking server status to confirm it's offline
            setTimeout(checkServerStatus, 2000);
        } else {
            throw new Error('Failed to stop server');
        }
    })
    .catch(error => {
        document.getElementById('status').textContent = 'Failed to stop server: ' + error.message;
        document.getElementById('status').style.color = 'red';
        
        // window.close();
        window.location.href = 'about:blank';
    });
}

checkServerStatus();