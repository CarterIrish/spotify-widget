
/**
 * Creates a standardized JSON response.
 * @param {*} body Body object to be JSON.stringified
 * @param {*} status HTTP status code
 * @param {*} headers Additional headers to include
 * @returns {Response} The Response object
 */
export function createResponse(body, status = 200, headers = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    };
    return new Response(JSON.stringify(body), { status, headers: defaultHeaders });
}

/**
 * Creates a standardized success response.
 * @param {*} data Response data to include
 * @param {*} status HTTP status code
 * @returns {Response} The Response object
 */
export function successResponse(data, status = 200) {
    return createResponse({ success: true, ...data }, status);
}


/**
 * Creates a standardized error response.
 * @param {*} errorMessage Error message to include
 * @param {*} status HTTP status code
 * @param {*} code Error code
 * @returns {Response} The Response object
 */
export function errorResponse(errorMessage, status = 400, code = "ERROR") {
    return createResponse({ success: false, error: errorMessage, code: code }, status);
}

/**
 * Creates a standardized CORS preflight response.
 * @returns {Response} CORS preflight response
 */
export function corsResponse() {
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