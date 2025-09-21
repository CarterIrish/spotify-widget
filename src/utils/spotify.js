
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
            redirect_uri: 'https://lab.carterirish.net/portfolio/callback.html',
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

/**
 * Gets the user's currently playing track from Spotify.
 * @param {string} access_token - Valid Spotify access token
 * @returns {Promise<Object>} The currently playing track data or null if nothing playing
 */
export async function getCurrentlyPlaying(access_token) {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        }
    });

    // Handle different response scenarios
    if (response.status === 204 || response.status === 202) {
        // No content - nothing currently playing
        return { isPlaying: false, track: null };
    }

    if (!response.ok) {
        // API error
        const errorData = await response.json().catch(() => ({}));
        return {
            error: true,
            status: response.status,
            message: errorData.error?.message || 'Failed to fetch currently playing'
        };
    }

    const data = await response.json();

    // Return simplified track data
    return {
        isPlaying: data.is_playing,
        track: data.item ? {
            name: data.item.name,
            artist: data.item.artists.map(artist => artist.name).join(', '),
            album: data.item.album.name,
            image: data.item.album.images[0]?.url || null,
            external_url: data.item.external_urls.spotify,
            duration_ms: data.item.duration_ms,
            progress_ms: data.progress_ms
        } : null
    };
};