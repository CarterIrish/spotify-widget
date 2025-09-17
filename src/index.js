/**
 * Spotify Widget API - Cloudflare Worker
 *
 * IMPROVEMENT OPPORTUNITIES:
 *
 * 1. CODE ORGANIZATION: This file is doing too much! Consider splitting into:
 *    - src/handlers/auth.js (authentication logic)
 *    - src/handlers/tokens.js (token refresh logic)
 *    - src/utils/spotify.js (Spotify API calls)
 *    - src/utils/responses.js (standardized response helpers)
 *    - src/middleware/cors.js (CORS handling)
 *
 * 2. ROUTING: Replace the if/else chain with a proper router:
 *    - Use URLPattern API or create a simple route matcher
 *    - Separate route definitions from handler logic
 *
 * 3. TYPESCRIPT: Convert to .ts for better type safety and IDE support
 *
 * 4. ERROR HANDLING: Add global error handling and consistent error responses
 */

export default {
	async fetch(request, env, ctx) {
		// IMPROVEMENT: Add try/catch for global error handling
		// IMPROVEMENT: Validate environment variables on startup
		// if (!env.SPOTIFY_CLIENT_ID) throw new Error('Missing SPOTIFY_CLIENT_ID');

		// Get URL and path from search bar
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;
		console.log(`Request received: ${method} ${path}`);

		// IMPROVEMENT: Add request logging with more details (IP, user-agent, etc.)
		// IMPROVEMENT: Add rate limiting here to prevent abuse

		// Handle CORS preflight request
		// IMPROVEMENT: Move CORS handling to a separate middleware function
		// IMPROVEMENT: Make CORS origins configurable instead of allowing "*"
		if (method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: {
					"Access-Control-Allow-Origin": "*", // TODO: Make this configurable
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
					"Access-Control-Max-Age": "86400"
				}
			});
		}

		// IMPROVEMENT: Replace this routing with a proper router pattern:
		// const routes = [
		//   { method: 'POST', path: '/auth', handler: authEndpoint },
		//   { method: 'POST', path: '/refresh', handler: refreshEndpoint },
		//   { method: 'GET', path: '/health', handler: healthEndpoint }
		// ];

		// Authentication endpoint
		if (path.endsWith("/auth") && request.method === "POST") {
			console.log("Auth endpoint hit");
			// IMPROVEMENT: Add input validation here before calling handler
			// IMPROVEMENT: Add rate limiting for auth attempts
			return await authEndpoint(request, env);
		}

		else if(path.endsWith("/refresh") && request.method === "POST") {
			// Refresh token endpoint
			// IMPROVEMENT: Add input validation for user_id
			return await refreshEndpoint(request, env);
		}
		// Test endpoint - SECURITY: Remove this in production!
		else if (path.endsWith("/test-kv")) {
			// IMPROVEMENT: Add authentication/authorization for test endpoints
			await env.TOKENS.put("test_key", "test_value");
			return new Response("KV write attempted", { status: 201 });
		}
		// IMPROVEMENT: Add a proper health check endpoint at /health
		else if (path === "/") {
			// Handle root path request
			// IMPROVEMENT: Return API documentation or redirect to docs
			let data = { message: "Spotify Widget API", version: "1.0.0", endpoints: ["/auth", "/refresh"] };
			return new Response(JSON.stringify(data), {
				headers: { 'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
				status: 200,
				statusText: "OK"
			});
		}
		else {
			// IMPROVEMENT: Create a standardized error response function
			// IMPROVEMENT: Log 404s for monitoring potential attacks
			let data = { error: "Endpoint Not Found", path: path };
			return new Response(JSON.stringify(data), {
				headers: { 'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
				status: 404,
				statusText: "Not Found"
			});
		}
	},
};

// ===============================================================================
// Spotify Authentication Endpoint Handler
// IMPROVEMENT: Move this to src/handlers/auth.js
// ===============================================================================
async function authEndpoint(request, env) {
	// IMPROVEMENT: Add try/catch for error handling
	// IMPROVEMENT: Validate request content-type is application/json
	// IMPROVEMENT: Add request body size limits

	// IMPROVEMENT: Add input validation:
	// if (!code || typeof code !== 'string' || code.length < 10) {
	//   return errorResponse('Invalid authorization code', 400);
	// }

	const { code, code_verifier } = await request.json();
	console.log(`Auth request received with code: ${code?.substring(0,10)}... and verifier: ${code_verifier?.substring(0,10)}...`); // Don't log full tokens!
	// IMPROVEMENT: Extract this function to src/utils/spotify.js
	// Exchange the authorization code for an access token
	const getToken = async (code, code_verifier) => {
		const url = new URL('https://accounts.spotify.com/api/token');

		// SECURITY ISSUE: Hardcoded redirect URI! Make this configurable:
		// redirect_uri: env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5500/callback.html'
		const payload = {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: env.SPOTIFY_CLIENT_ID,
				grant_type: 'authorization_code',
				code: code,
				redirect_uri: 'http://127.0.0.1:5500/callback.html', // TODO: Make configurable
				code_verifier: code_verifier
			})
		};

		// IMPROVEMENT: Add timeout to fetch request
		// IMPROVEMENT: Add retry logic for failed requests
		// const response = await fetchWithTimeout(url, payload, 5000);

		const response = await fetch(url, payload).then(res => res.json());
		console.log("Token response received"); // Don't log sensitive token data!
		// IMPROVEMENT: Better error handling with specific error types
		// IMPROVEMENT: Don't expose Spotify API errors directly to client

		if (response.access_token && response.refresh_token) {
			// IMPROVEMENT: Add timeout and error handling for user profile fetch
			// IMPROVEMENT: Cache user profile data to reduce API calls
			let user = await fetch('https://api.spotify.com/v1/me', {
				headers: { 'Authorization': `Bearer ${response.access_token}` }
			}).then(res => res.json());

			// IMPROVEMENT: Don't log user data in production
			console.log("User profile fetched for user:", user.id);

			if (user.id) {
				// IMPROVEMENT: Add error handling for KV operations
				// IMPROVEMENT: Consider adding expiration to KV entries
				await env.TOKENS.put(user.id, response.refresh_token);
				console.log("Stored refresh token for user:", user.id);

				// IMPROVEMENT: Return consistent response structure
				return {
					success: true,
					access_token: response.access_token,
					user_id: user.id,
					expires_in: response.expires_in
				};
			}
			else {
				// IMPROVEMENT: Provide more helpful error messages
				return {
					success: false,
					error: "Failed to get user profile",
					code: "USER_PROFILE_ERROR"
				};
			}
		}
		else {
			// IMPROVEMENT: Handle specific Spotify error codes
			return {
				success: false,
				error: "Authentication failed",
				code: "TOKEN_EXCHANGE_ERROR",
				details: response.error || "Unknown error"
			};
		}
	};

	// IMPROVEMENT: Extract response creation to helper function
	const result = await getToken(code, code_verifier);

	// IMPROVEMENT: Set appropriate HTTP status based on result
	const status = result.success ? 200 : 400;

	return new Response(JSON.stringify(result), {
		headers: { 'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
		status: status
	});
}

// ===============================================================================
// Spotify Token Refresh Endpoint Handler
// IMPROVEMENT: Move this to src/handlers/tokens.js
// ===============================================================================
async function refreshEndpoint(request, env) {
	// IMPROVEMENT: Add try/catch for error handling
	// IMPROVEMENT: Validate request content-type

	// IMPROVEMENT: Add proper input validation:
	// if (!request.headers.get('content-type')?.includes('application/json')) {
	//   return errorResponse('Content-Type must be application/json', 400);
	// }

	const userId = (await request.json()).user_id;

	// IMPROVEMENT: Better input validation
	if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
		return new Response(JSON.stringify({
			success: false,
			error: "Invalid user_id provided",
			code: "INVALID_USER_ID"
		}), {
			headers: { 'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
			status: 400
		});
	}

	// IMPROVEMENT: Add error handling for KV operations
	const refresh_token = await env.TOKENS.get(userId);

	if (!refresh_token) {
		// IMPROVEMENT: Log this for security monitoring
		console.log(`Refresh token not found for user: ${userId}`);
		return new Response(JSON.stringify({
			success: false,
			error: "Refresh token not found",
			code: "TOKEN_NOT_FOUND"
		}), {
			headers: {'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*'},
			status: 404
		});
	}
	// IMPROVEMENT: Extract this to src/utils/spotify.js
	const url = new URL('https://accounts.spotify.com/api/token');
	const payload = {
		method: 'POST',
		headers: {'content-type': 'application/x-www-form-urlencoded'},
		body: new URLSearchParams({
			client_id: env.SPOTIFY_CLIENT_ID,
			grant_type: 'refresh_token',
			refresh_token: refresh_token
		})
	};

	// IMPROVEMENT: Add timeout and retry logic
	// IMPROVEMENT: Better error handling for network failures
	const response = await fetch(url, payload).then(res => res.json());

	// IMPROVEMENT: Handle Spotify API errors properly
	if (response.error) {
		console.log(`Spotify API error: ${response.error}`);
		return new Response(JSON.stringify({
			success: false,
			error: "Token refresh failed",
			code: "SPOTIFY_API_ERROR"
		}), {
			headers: {'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*'},
			status: 400
		});
	}

	// Update refresh token if Spotify provided a new one
	if (response.refresh_token && response.refresh_token !== refresh_token) {
		// IMPROVEMENT: Add error handling for KV write operations
		await env.TOKENS.put(userId, response.refresh_token);
		console.log("Updated refresh token for user:", userId);
	}

	// IMPROVEMENT: Return consistent response structure
	return new Response(JSON.stringify({
		success: true,
		access_token: response.access_token,
		expires_in: response.expires_in,
		token_type: response.token_type,
		scope: response.scope
	}), {
		headers: {'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*'},
		status: 200
	});
}

