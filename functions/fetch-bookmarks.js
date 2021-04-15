const fetch = require('node-fetch');
const cookie = require('cookie');

exports.handler = async (event) => {
    const {sort} = JSON.parse(event.body);

    const cookies = cookie.parse(event.headers.cookie);
    const token = cookies['dewy.auth'];

    const params = new URLSearchParams();
    params.append('order', 'desc');
    params.append('sort', sort);
    params.append('site', 'stackoverflow');
    params.append('filter', '!9_bDDxJY5');
    params.append('access_token', token);
    params.append('key', process.env.STACK_KEY);

    const endpoint = `https://api.stackexchange.com/2.2/me/favorites?${params}`;
    
    try {
        const response = await fetch(endpoint);
        const responseJson = await response.json();

        if(!response.ok) {
            console.error('Favorites response error', responseJson);
            return {
                statusCode: responseJson.error_id,
                body: JSON.stringify(responseJson)
            };
        }

        console.log('Favorites response', responseJson);
        return {
            statusCode: 200,
            body: JSON.stringify(responseJson)
        };

    } catch(error) {
        console.error('Error making favorites request', error);
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        }
    }
};