/**
 * Input validation utilities for API endpoints
 */

/**
 * Validates authorization request body
 * @param {Object} body Request body object
 * @returns {Object} Validated data or throws error
 */
export function validateAuthRequest(body) {
    const { code, code_verifier } = body;

    if (!code || typeof code !== 'string' || code.length < 10) {
        throw new ValidationError('Invalid authorization code', 'INVALID_CODE');
    }

    if (!code_verifier || typeof code_verifier !== 'string' || code_verifier.length < 43) {
        throw new ValidationError('Invalid code verifier', 'INVALID_CODE_VERIFIER');
    }

    return { code, code_verifier };
}

/**
 * Validates refresh token request body
 * @param {Object} body Request body object
 * @returns {Object} Validated data or throws error
 */
export function validateRefreshRequest(body) {
    const { user_id } = body;

    if (!user_id || typeof user_id !== 'string' || user_id.trim().length === 0) {
        throw new ValidationError('Invalid user_id provided', 'INVALID_USER_ID');
    }

    return { user_id: user_id.trim() };
}

/**
 * Validates request content type
 * @param {Request} request The request object
 * @throws {ValidationError} If content type is invalid
 */
export function validateContentType(request) {
    const contentType = request.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
        throw new ValidationError('Content-Type must be application/json', 'INVALID_CONTENT_TYPE');
    }
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'ValidationError';
        this.code = code;
    }
}