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

		if (request.method === "OPTIONS") {
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
		const url = new URL(request.url);
		const path = url.pathname;

		// Authentication endpoint
		if (path.endsWith("/auth") && request.method === "POST") {
			return await authEndpoint(request, env);
		}
		// Test KV storage endpoint
		if (path.endsWith("/test-kv")) {
			await env.TOKENS.put("test_key", "test_value");
			return new Response("KV write attempted", { status: 200 });
		}


		// Process the parameters
		//return new Response(`Received param1: ${param1}, param2: ${param2}`);

		const data = { message: "Hello Frontend!" };
		return new Response(JSON.stringify(data), { headers: { 'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 200 });
	},
};

// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// Spotify Authentication Endpoint Handler
// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
async function authEndpoint(request, env) {
	const { code, code_verifier } = await request.json();
	// Exchange the authorization code for an access token
	const getToken = async (code, code_verifier) => {
		const url = new URL('https://accounts.spotify.com/api/token');
		const payload = {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: env.SPOTIFY_CLIENT_ID,
				grant_type: 'authorization_code',
				code,
				redirect_uri: 'https://carterirish.net/callback',
				code_verifier
			})
		};
		const response = await fetch(url, payload).then(res => res.json());
		console.log("Token response:", response);

		if (response.access_token && response.refresh_token) {
			let user = await fetch('https://api.spotify.com/v1/me', {
				headers: { 'Authorization': `Bearer ${response.access_token}` }
			}).then(res => res.json());
			console.log("User response:", user);

			if (user.id) {
				await env.TOKENS.put(user.id, response.refresh_token);
				return { access_token: response.access_token, user_id: user.id };
			} 
			else {
				return { error: "Failed to get user id", details: user };
			}
		} 
		else {
			return { error: "Failed to get tokens", details: response };
		}
	};

	const result = await getToken(code, code_verifier);
	return new Response(JSON.stringify(result), {
		headers: { 'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
		status: 200
	});
}

