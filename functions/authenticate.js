const axios = require('axios').default;
const cookie = require('cookie');

exports.handler = async (event) => {
    const {code} = JSON.parse(event.body);

    const endpoint = 'https://stackoverflow.com/oauth/access_token/json';

    const params = new URLSearchParams();
    params.append('client_id', process.env.STACK_CLIENT_ID);
    params.append('client_secret', process.env.STACK_CLIENT_SECRET);
    params.append('code', code);
    params.append('redirect_uri', process.env.STACK_REDIRECT_URI);

    try {
        const response = await axios({
            method: 'post',
            url: endpoint,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            data: params
        });

        if(response.statusText !== 'OK') {
            console.error('Auth response error', response);
            return {
                statusCode: 400,
                body: JSON.stringify(response.error)
            };
        }

        const responseJson = response.data;
        console.log('Auth response', responseJson);
        
        // The response can return a 200 success but still have an error message
        // so I'll return an error status from the function.
        if(responseJson.error_message || !responseJson.access_token) {
            return {
                statusCode: 400,
                body: JSON.stringify(responseJson)
            };
        }

        // Store the token in a cookie and return the 'expires' 
        // attribute to notify the client.
        const expires = new Date(Date.now() + responseJson.expires * 1000);

        const authCookie = cookie.serialize('dewy.auth', responseJson.access_token, {
            secure: true,
            httpOnly: true,
            path: '/',
            sameSite: 'strict',
            expires: expires
        });

        return {
            statusCode: 200,
            headers: {
                'Set-Cookie': authCookie
            },
            body: JSON.stringify({expires: expires})
        };

    } catch(error) {
        console.error('Error making auth request', error);
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        };
    }
};