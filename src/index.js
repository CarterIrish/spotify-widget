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
		// This is the entry point for my worker. This is where interaction with API starts
		// Following two lines are testing if the environment variable is accessible
		const callback = env.SPOTIFY_CALLBACK_URI;
		const clientID = env.SPOTIFY_CLIENT_ID;
		// ***secret*** = env.SPOTIFY_CLIENT_SECRET; // secret should not be exposed to client side
		const authEndpoint = "https://accounts.spotify.com/authorize";
		const tokenEndpoint = "https://accounts.spotify.com/api/token";
		const baseURL = "https://api.spotify.com/v1";
		const scope = "user-read-currently-playing";



		return new Response("Spotify widget");
	},
};

function generateRandomString(length) {
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const values = crypto.getRandomValues(new Uint8Array(length));
	return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function sha256(plain) {
	const encoder = new TextEncoder()
	const data = encoder.encode(plain)
	return window.crypto.subtle.digest('SHA-256', data)
}

function base64encode(input) {
	return btoa(String.fromCharCode(...new Uint8Array(input)))
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');
}



// const hashed = await sha256(codeVerifier)
// const codeChallenge = base64encode(hashed);

