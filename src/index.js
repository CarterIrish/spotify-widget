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

import { authEndpoint } from './handlers/auth.js';
import { refreshEndpoint } from './handlers/refresh.js';
import { currentlyPlayingEndpoint } from './handlers/currently-playing.js';
import { corsResponse, createResponse, successResponse, errorResponse } from './utils/responses.js';
import { refreshAccessToken, exchangeCodeForToken, getUserProfile } from './utils/spotify.js';

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
			return corsResponse();
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

		else if (path.endsWith("/refresh") && request.method === "POST") {
			// Refresh token endpoint
			// IMPROVEMENT: Add input validation for user_id
			return await refreshEndpoint(request, env);
		}
		// TODO(human): Add currently playing endpoint
		// Use path.endsWith("/currently-playing") && request.method === "POST"
		// Call currentlyPlayingEndpoint(request, env)
		else if(path.endsWith("/currently-playing") && request.method === 'POST')
		{
			return await currentlyPlayingEndpoint(request,env)
		}

		// IMPROVEMENT: Add a proper health check endpoint at /health
		else if (path === "/") {
			// Handle root path request
			// IMPROVEMENT: Return API documentation or redirect to docs
			let data = { message: "Spotify Widget API", version: "1.0.0", endpoints: ["/auth", "/refresh", "/currently-playing"] };
			return successResponse(data, 200);
		}
		else {
			// IMPROVEMENT: Create a standardized error response function
			// IMPROVEMENT: Log 404s for monitoring potential attacks
			return errorResponse('Endpoint Not Found', 404, 'NOT_FOUND');
		}
	},
};





