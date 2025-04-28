function checkServerStatus() {
    fetch('http://localhost:8082/server/ping')
        .then(response => {
            if (response.ok) {
                document.getElementById('status').textContent = 'Server is up and running!';
                document.getElementById('status').style.color = 'green';
            } else {
                throw new Error('Server is offline');
            }
        })
        .catch(error => {
            document.getElementById('status').textContent = 'Server is not responding. Please wait...';
            document.getElementById('status').style.color = 'red';
            setTimeout(checkServerStatus, 2000);  // Try again after 2 seconds
        });


}

function stopServer() {
    fetch('http://localhost:8082/server/stop', {
        method: 'POST',
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
    });
}