const axios = require('axios').default;
const cookie = require('cookie');

exports.handler = async (event) => {
    const cookies = cookie.parse(event.headers.cookie);
    const token = cookies['dewy.auth'];

    if(!token) {
        return {
            statusCode: 401,
            body: JSON.stringify({
                error_id: 401,
                error_message: 'No logged in user.'
            })
        };
    }

    const params = new URLSearchParams();
    params.append('access_token', token);
    params.append('key', process.env.STACK_KEY);

    const endpoint = `https://api.stackexchange.com/2.3/me/associated?${params}`;

    try {
        const response = await axios(endpoint);
        const responseJson = response.data;

        return {
            statusCode: 200,
            body: JSON.stringify(responseJson)
        };
    } catch(error) {
        console.error('Error making associated accounts request', error);
        const statusCode = error.response?.data?.error_id || 500;
        const errorDetails = error.response?.data || error;

        return {
            statusCode: statusCode,
            body: JSON.stringify(errorDetails)
        }
    }
};