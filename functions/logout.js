const cookie = require('cookie');

exports.handler = async () => {
    // Set the expiration to now so the cookie becomes invalid and is removed
    const expires = new Date();

    const authCookie = cookie.serialize('dewy.auth', 'logged_out', {
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