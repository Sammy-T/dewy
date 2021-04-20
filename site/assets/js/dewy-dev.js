async function devCheckAuth(testToken) {
	try {
		const response = await fetch('/.netlify/functions/authenticate-dev', {
			method: 'POST',
            body: JSON.stringify({testToken: testToken})
		});

        const responseJson = await response.json();
        console.log(responseJson);

        if(!response.ok) return;

		localStorage.setItem('dewy.accessExpires', Date.parse(responseJson.expires));
    } catch(error) {
		console.error(error);
        return;
    }
	
	fetchBookmarks();
}