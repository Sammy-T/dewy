const axios = require('axios').default;
const cookie = require('cookie');

exports.handler = async (event) => {
    const {sort, page, fullPages} = JSON.parse(event.body);

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
    params.append('order', 'desc');
    params.append('sort', sort);
    params.append('site', 'stackoverflow');
    params.append('filter', '!9_bDDxJY5'); //// TODO: I don't remember what this does
    params.append('access_token', token);
    params.append('key', process.env.STACK_KEY);
    if(fullPages) params.append('pagesize', 100);
    if(page > 1) params.append('page', page);

    const endpoint = `https://api.stackexchange.com/2.3/me/favorites?${params}`;
    
    try {
        const response = await axios(endpoint);
        const responseJson = response.data;

        // console.log('Favorites response', responseJson);
        return {
            statusCode: 200,
            body: JSON.stringify(responseJson)
        };
    } catch(error) {
        console.error('Error making favorites request', error);
        const statusCode = error.response?.data?.error_id || 500;
        const errorDetails = error.response?.data || error;

        return {
            statusCode: statusCode,
            body: JSON.stringify(errorDetails)
        }
    }
};