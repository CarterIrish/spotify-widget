# Spotify Widget - Improvement Guide

This guide outlines step-by-step improvements you can make to learn and enhance your Spotify widget project.

## 🎯 Learning Path

### Phase 1: Code Organization & Structure (Beginner)

#### 1.1 Split into Modules
**Goal**: Break up the large `src/index.js` file into focused modules.

**Steps**:
1. Create `src/handlers/auth.js` and move `authEndpoint` function there
2. Create `src/handlers/tokens.js` and move `refreshEndpoint` function there
3. Create `src/utils/responses.js` for standardized response helpers
4. Create `src/utils/spotify.js` for Spotify API utilities

**Learning Resources**:
- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Cloudflare Workers Module System](https://developers.cloudflare.com/workers/learning/modules/)

#### 1.2 Implement Proper Routing
**Goal**: Replace the if/else chain with a clean router.

**Example Implementation**:
```javascript
// src/router.js
export class Router {
  constructor() {
    this.routes = [];
  }

  add(method, path, handler) {
    this.routes.push({ method, path, handler });
  }

  async handle(request, env) {
    const { pathname } = new URL(request.url);
    const route = this.routes.find(r =>
      r.method === request.method && r.path === pathname
    );

    if (route) {
      return await route.handler(request, env);
    }

    return this.notFound();
  }
}
```

### Phase 2: Security & Configuration (Intermediate)

#### 2.1 Move Secrets to Wrangler Secrets
**Current Issue**: Client ID is in `.dev.vars` file.

**Steps**:
1. Remove `SPOTIFY_CLIENT_ID` from `.dev.vars`
2. Add it as a Wrangler secret:
   ```bash
   wrangler secret put SPOTIFY_CLIENT_ID
   ```
3. Add `SPOTIFY_REDIRECT_URI` as configurable environment variable

#### 2.2 Add Input Validation
**Goal**: Validate all request inputs to prevent errors and attacks.

**Example Validation Function**:
```javascript
// src/utils/validation.js
export function validateAuthRequest(body) {
  const { code, code_verifier } = body;

  if (!code || typeof code !== 'string' || code.length < 10) {
    throw new ValidationError('Invalid authorization code');
  }

  if (!code_verifier || typeof code_verifier !== 'string') {
    throw new ValidationError('Invalid code verifier');
  }

  return { code, code_verifier };
}
```

#### 2.3 Implement Rate Limiting
**Goal**: Prevent abuse of your API endpoints.

**Learning Resources**:
- [Cloudflare Rate Limiting](https://developers.cloudflare.com/workers/examples/security-headers/)
- [Rate Limiting Patterns](https://developers.cloudflare.com/workers/examples/auth-with-headers/)

### Phase 3: Error Handling & Reliability (Intermediate)

#### 3.1 Add Global Error Handling
**Goal**: Catch and handle all errors gracefully.

**Example Implementation**:
```javascript
export default {
  async fetch(request, env, ctx) {
    try {
      // Your existing code here
    } catch (error) {
      console.error('Unhandled error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
```

#### 3.2 Add Timeout Handling
**Goal**: Prevent hanging requests to external APIs.

**Example Fetch with Timeout**:
```javascript
// src/utils/fetch.js
export async function fetchWithTimeout(url, options, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}
```

#### 3.3 Add Retry Logic
**Goal**: Handle temporary failures gracefully.

**Example Retry Function**:
```javascript
// src/utils/retry.js
export async function withRetry(fn, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}
```

### Phase 4: Testing & Quality (Advanced)

#### 4.1 Write Proper Tests
**Goal**: Replace placeholder tests with real endpoint tests.

**Priority Test Cases**:
1. Root endpoint returns correct API info
2. CORS handling works correctly
3. Auth endpoint validates inputs
4. Refresh endpoint handles missing tokens
5. Error scenarios return appropriate responses

#### 4.2 Add TypeScript
**Goal**: Better type safety and IDE support.

**Steps**:
1. Rename `src/index.js` to `src/index.ts`
2. Add type definitions for your data structures
3. Configure TypeScript in `tsconfig.json`

**Example Types**:
```typescript
// src/types.ts
export interface SpotifyTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface AuthRequest {
  code: string;
  code_verifier: string;
}
```

#### 4.3 Add Linting
**Goal**: Maintain consistent code quality.

**Setup ESLint**:
```bash
npm install --save-dev eslint @eslint/js
```

### Phase 5: Documentation & Monitoring (Advanced)

#### 5.1 Create API Documentation
**Goal**: Document all your endpoints for other developers.

**Create `docs/API.md`**:
```markdown
# Spotify Widget API

## POST /auth
Exchanges Spotify authorization code for access token.

**Request Body**:
```json
{
  "code": "AQC...",
  "code_verifier": "abc123..."
}
```

**Response**:
```json
{
  "success": true,
  "access_token": "BQD...",
  "user_id": "user123",
  "expires_in": 3600
}
```
```

#### 5.2 Add Health Check Endpoint
**Goal**: Monitor your API status.

**Example Health Check**:
```javascript
// src/handlers/health.js
export async function healthCheck(request, env) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      kv: await testKV(env),
      spotify: await testSpotifyConnection(env)
    }
  };

  return new Response(JSON.stringify(checks), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

#### 5.3 Improve Logging
**Goal**: Better debugging and monitoring.

**Structured Logging Example**:
```javascript
// src/utils/logger.js
export function log(level, message, data = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  }));
}
```

## 🚀 Quick Wins (Start Here!)

1. **Fix the hardcoded redirect URI** - Make it configurable
2. **Add proper input validation** - Prevent errors from bad requests
3. **Improve error messages** - Help developers debug issues
4. **Write basic tests** - Start with the root endpoint test
5. **Remove the test endpoint** - Security risk in production

## 📚 Learning Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [OAuth 2.0 PKCE Flow](https://tools.ietf.org/html/rfc7636)
- [JavaScript Testing with Vitest](https://vitest.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🔧 Commands to Remember

```bash
# Run tests
npm test

# Deploy to Cloudflare
npm run deploy

# Start development server
npm run dev

# Add environment variables
wrangler secret put VARIABLE_NAME

# View logs
wrangler tail
```

## 🎯 Success Metrics

- [ ] Code is split into logical modules
- [ ] All inputs are validated
- [ ] Errors are handled gracefully
- [ ] Tests cover main functionality
- [ ] Security best practices followed
- [ ] API is documented
- [ ] Monitoring/health checks in place

Start with Phase 1 and work your way through. Each improvement will make your code more maintainable, secure, and professional!