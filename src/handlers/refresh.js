// ===============================================================================
// Spotify Token Refresh Endpoint Handler
// IMPROVEMENT: Move this to src/handlers/tokens.js
// ===============================================================================

import { successResponse, errorResponse } from "../utils/responses.js";
import { refreshAccessToken } from "../utils/spotify.js";
import { validateRefreshRequest, validateContentType, ValidationError } from "../utils/validation.js";

export async function refreshEndpoint(request, env) {
	try {
		// Validate content type
		validateContentType(request);

		// Parse and validate request body
		const body = await request.json();
		const { user_id: userId } = validateRefreshRequest(body);

		// Get refresh token from KV store
		const refresh_token = await env.TOKENS.get(userId);

		if (!refresh_token) {
			console.log(`Refresh token not found for user: ${userId}`);
			return errorResponse("Refresh token not found", 404, "TOKEN_NOT_FOUND");
		}

		// Refresh the access token
		const response = await refreshAccessToken(refresh_token, env);

		if (response.error) {
			console.log(`Spotify API error: ${response.error}`);
			return errorResponse("Token refresh failed", 400, "SPOTIFY_API_ERROR");
		}

		// Update refresh token if Spotify provided a new one
		if (response.refresh_token && response.refresh_token !== refresh_token) {
			await env.TOKENS.put(userId, response.refresh_token);
			console.log("Updated refresh token for user:", userId);
		}

		return successResponse({
			access_token: response.access_token,
			expires_in: response.expires_in,
			token_type: response.token_type,
			scope: response.scope
		});

	} catch (error) {
		// Handle validation errors
		if (error instanceof ValidationError) {
			return errorResponse(error.message, 400, error.code);
		}

		// Handle other errors
		console.error('Refresh endpoint error:', error);
		return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
	}
}