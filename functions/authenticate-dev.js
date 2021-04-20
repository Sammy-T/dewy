const cookie = require('cookie');

exports.handler = async (event) => {
    const {testToken} = JSON.parse(event.body);

    const responseJson = {
        access_token: testToken,
        expires: 86400
    };

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
};