// ===============================================================================
// Spotify Currently Playing Endpoint Handler
// TODO(human): Implement the core logic for fetching currently playing track
// ===============================================================================

import { successResponse, errorResponse } from "../utils/responses.js";
import { getCurrentlyPlaying, refreshAccessToken } from "../utils/spotify.js";
import { validateCurrentlyPlayingRequest, validateContentType, ValidationError } from "../utils/validation.js";

export async function currentlyPlayingEndpoint(request, env) {
    try {
        // Validate content type
        validateContentType(request);

        // Parse and validate request body
        const body = await request.json();
        const { access_token, user_id } = validateCurrentlyPlayingRequest(body);

        // TODO(human): Call getCurrentlyPlaying with the access_token
        // Store the result in a variable called 'currentTrack'
        let currentTrack = await getCurrentlyPlaying(access_token)

        // TODO(human): Handle token expiration
        // If currentTrack.error && currentTrack.status === 401:
        //   1. Get refresh token from env.TOKENS.get(user_id)
        //   2. Call refreshAccessToken if refresh token exists
        //   3. Retry getCurrentlyPlaying with new token
        //   4. Return success with new_access_token included if successful
        if(currentTrack.error && currentTrack.status === 401)
        {
            const refreshToken = await env.TOKENS.get(user_id);
            // If no refresh token found, return error response
            if(!refreshToken)
            {
                return errorResponse("Refresh token not found", 404, "TOKEN_NOT_FOUND");
            }
            
            const refreshResponse = await refreshAccessToken(refreshToken, env); // Call refreshAccessToken
            // If refreshResponse has an error, return appropriate error response
            if(refreshResponse.error) 
            {
                return errorResponse("Token refresh failed", 400, "SPOTIFY_API_ERROR");
            }
            currentTrack = await getCurrentlyPlaying(refreshResponse.access_token);
            // Update refresh token in KV if Spotify returned a new one
            if(refreshResponse.refresh_token && refreshResponse.refresh_token !== refreshToken)
            {
                await env.TOKENS.put(user_id, refreshResponse.refresh_token);
            }
            if(!currentTrack.error)
            {
                return successResponse({
                    ...currentTrack,
                    new_access_token: refreshResponse.access_token,
                    expires_in: refreshResponse.expires_in
                });
            }
        }

        // TODO(human): Handle API errors
        // If currentTrack has an error, return appropriate error response
        if(currentTrack.error)
        {
            return errorResponse("Error fetching currently playing track", 400, "SPOTIFY_API_ERROR");
        }

        // TODO(human): Return success response with track data
        return successResponse(currentTrack);

    } catch (error) {
        // Handle validation errors
        if (error instanceof ValidationError) {
            return errorResponse(error.message, 400, error.code);
        }

        // Handle other errors
        console.error('Currently playing endpoint error:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
    }
}