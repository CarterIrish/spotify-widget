
/**
 * Exchanges an authorization code for an access token.
 * @param {*} code 
 * @param {*} code_verifier 
 * @param {*} env 
 * @returns {Promise<Response>} The response from the token endpoint
 */
export async function exchangeCodeForToken(code, code_verifier, env) {

    const url = new URL('https://accounts.spotify.com/api/token');
    const payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: env.SPOTIFY_CLIENT_ID,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5500/callback.html',
            code_verifier: code_verifier
        })
    };
    const response = await fetch(url, payload).then(res => res.json());
    return response;
};

/**
 * Exchanges an access token for the user's profile information.
 * @param {*} access_token 
 * @returns {Promise<Response>} The response from the user profile endpoint
 */
export async function getUserProfile(access_token) {
    const response = await fetch('https://api.spotify.com/v1/me',
        {
            headers: { 'Authorization': `Bearer ${access_token}` }
        }
    ).then(res => res.json());
    return response;
}

/**
 * Exchanges a refresh token for a new access token.
 * @param {*} refresh_token 
 * @param {*} env 
 * @returns {Promise<Response>} The response from the token endpoint
 */
export async function refreshAccessToken(refresh_token, env) {
    const url = new URL('https://accounts.spotify.com/api/token');
    const payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: env.SPOTIFY_CLIENT_ID,
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        })
    };
    const response = await fetch(url, payload).then(res => res.json());
    return response;
};