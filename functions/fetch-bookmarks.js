const fetch = require('node-fetch');
const cookie = require('cookie');

exports.handler = async (event) => {
    const {sort, page, fullPages} = JSON.parse(event.body);

    const cookies = cookie.parse(event.headers.cookie);
    const token = cookies['dewy.auth'];

    if(!token) {
        return {
            statusCode: 401,
            body: JSON.stringify({message: 'No logged in user.'})
        };
    }

    const params = new URLSearchParams();
    params.append('order', 'desc');
    params.append('sort', sort);
    params.append('site', 'stackoverflow');
    params.append('filter', '!9_bDDxJY5');
    params.append('access_token', token);
    params.append('key', process.env.STACK_KEY);
    if(fullPages) params.append('pagesize', 100);
    if(page > 1) params.append('page', page);

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

        // console.log('Favorites response', responseJson);
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