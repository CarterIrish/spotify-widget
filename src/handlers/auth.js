// ===============================================================================
// Spotify Authentication Endpoint Handler
// IMPROVEMENT: Move this to src/handlers/auth.js
// ===============================================================================

import { successResponse, errorResponse } from "../utils/responses.js";
import { exchangeCodeForToken, getUserProfile } from "../utils/spotify.js";
import { validateAuthRequest, validateContentType, ValidationError } from "../utils/validation.js";

export async function authEndpoint(request, env) {
    try {
        // Validate content type
        validateContentType(request);

        // Parse and validate request body
        const body = await request.json();
        const { code, code_verifier } = validateAuthRequest(body);

        // Exchange code for tokens
        const tokenResult = await exchangeCodeForToken(code, code_verifier, env);
        if (tokenResult.error) {
            return errorResponse('Authentication failed', 401, 'TOKEN_EXCHANGE_ERROR');
        }

        // Get user profile
        const userProfile = await getUserProfile(tokenResult.access_token);
        if (userProfile.error) {
            return errorResponse('Failed to get user profile', 401, 'USER_PROFILE_ERROR');
        }

        const userId = userProfile.id;
        if (!userId) {
            return errorResponse('User ID not found in profile', 502, 'USER_ID_NOT_FOUND');
        }

        // Store refresh token
        await env.TOKENS.put(userId, tokenResult.refresh_token);
        console.log("Stored refresh token for user:", userId);

        return successResponse({
            access_token: tokenResult.access_token,
            user_id: userId,
            expires_in: tokenResult.expires_in
        });

    } catch (error) {
        // Handle validation errors
        if (error instanceof ValidationError) {
            return errorResponse(error.message, 400, error.code);
        }

        // Handle other errors
        console.error('Auth endpoint error:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
    }
}