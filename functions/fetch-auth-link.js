exports.handler = async (event) => {
    const params = new URLSearchParams();
    params.append('client_id', process.env.STACK_CLIENT_ID);
    params.append('redirect_uri', process.env.STACK_REDIRECT_URI);

    const endpoint = `https://stackoverflow.com/oauth?${params}`;

    return {
        statusCode: 200,
        body: JSON.stringify({authLink: endpoint})
    };
};