/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx) {

		// Get URL and path from search bar
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;
		console.log(`Request received: ${method} ${path}`);
		// Handle CORS preflight request
		if (method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
					"Access-Control-Max-Age": "86400"
				}
			});
		}

		// Authentication endpoint
		if (path.endsWith("/auth") && request.method === "POST") {
			console.log("Auth endpoint hit");
			return await authEndpoint(request, env);
		}

		else if(path.endsWith("/refresh") && request.method === "POST") {
			// Refresh token endpoint
			// pull user_id from request body using decontructuring
			return await refreshEndpoint(request, env);
		}
		// Test endpoint
		else if (path.endsWith("/test-kv")) {
			await env.TOKENS.put("test_key", "test_value");
			return new Response("KV write attempted", { status: 201 });
		}
		else if (path === "/") {
			// Handle root path request
			let data = { message: "Root Endpoint" };
			return new Response(JSON.stringify(data), { headers: { 'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 200, statusText: "OK" });
		}
		else {
			// Build response object
			// Return the response as JSON with CORS headers & status 200 options
			// Response object body, then an object with headers(optional: default empty), status(default 200), and statusText(optional: default "")
			let data = { message: "Endpoint Not Found" };
			return new Response(JSON.stringify(data), { headers: { 'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 404, statusText: "Not Found" });
		}
	},
};

// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// Spotify Authentication Endpoint Handler
// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
async function authEndpoint(request, env) {
	// pull code and code_verifier from request body using decontructuring
	const { code, code_verifier } = await request.json();
	console.log(`Auth request received with code: ${code} and verifier: ${code_verifier}`);
	// Exchange the authorization code for an access token
	const getToken = async (code, code_verifier) => {
		const url = new URL('https://accounts.spotify.com/api/token');
		const payload = {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: env.SPOTIFY_CLIENT_ID,
				grant_type: 'authorization_code',
				code: code,
				redirect_uri: 'http://127.0.0.1:5500/callback.html',
				code_verifier: code_verifier
			})
		};
		// send token request and log response
		const response = await fetch(url, payload).then(res => res.json());
		console.log("Token response:", response);
		/* check for access_token and refresh_token in response
		 if both exist, fetch user profile to get user id
		 store refresh_token in KV with user id as key
		return access_token and user id
		if not, return error message*/
		if (response.access_token && response.refresh_token) {
			// tokens exist, fetch user profile
			let user = await fetch('https://api.spotify.com/v1/me', {
				headers: { 'Authorization': `Bearer ${response.access_token}` }
			}).then(res => res.json());
			console.log("User response:", user);
			// check for user id
			if (user.id) {
				// id exists, store refresh token in KV using user id as key
				await env.TOKENS.put(user.id, response.refresh_token);
				console.log("Stored refresh token for user:", user.id);
				return { access_token: response.access_token, user_id: user.id, expires_in: response.expires_in};
			}
			else {
				// id doesn't exist, return error
				return { error: "Failed to get user id", details: user };
			}
		}
		else {
			// tokens don't exist, return error
			return { error: "Failed to get tokens", details: response };
		}
	};

	// call getToken and return result as JSON response with CORS headers to calling page
	const result = await getToken(code, code_verifier);
	return new Response(JSON.stringify(result), {
		headers: { 'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
		status: 200
	});

// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// Spotify Token Refresh Endpoint Handler
// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	async function refreshEndpoint(request, env) {
		// Get user id for refresh from request body
		const userId = (await request.json()).user_id;
		// Test if userId exists
		if(!userId)
		{
			// No user id provided, return error
			return new Response(JSON.stringify({error: "No user_id provided"}), {
				headers: { 'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
				status: 400
			});
		}
		// Get refresh token from KV using the user id as the key
		const refresh_token = await env.TOKENS.get(userId);
		// Test refresh token
		if(!refresh_token)
		{
			// No token found for userID, return error
			return new Response(JSON.stringify({error: "No refresh token found for user_id"}), {
				headers: {'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*'},
				status: 404
			});
		}
		// Build API request
		const url = new URL('https://accounts.spotify.com/api/token');
		const payload = {
			method: 'POST',
			headers: {'content-type': 'application/x-www-form-urlencoded'},
			body: new URLSearchParams({
				client_id: env.SPOTIFY_CLIENT_ID,
				grant_type: 'refresh_token',
				refresh_token: refresh_token
			})
		}
		// Send token request and log response
		const response = await fetch(url,payload).then(res => res.json());
		console.log("Refresh response:", response);
		if(response.refresh_token && response.refresh_token !== refresh_token)
		{
			await env.TOKENS.put(userId, response.refresh_token);
			console.log("Stored new refresh token for user:", userId);
		}

		// Build response object and return non-sensitive fields as JSON with CORS headers
		return new Response(JSON.stringify({access_token: response.access_token, expires_in: response.expires_in, token_type: response.token_type, scope: response.scope}), {
			headers: {'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*'},
			status: 200
		});
	};
}

