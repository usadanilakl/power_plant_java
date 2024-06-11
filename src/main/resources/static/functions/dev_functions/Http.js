function postRequest(url){
fetch(url, {
                method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': csrfToken,
                            'Content-Type': 'application/json'
                        }

            })
                .then(()=>console.log("success"))
                .catch((error) => {
                    console.error('Error:', error);
                });
        };
