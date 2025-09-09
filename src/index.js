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
		const scope = "user-read-currently-playing";

		return new Response("Spotify widget");
	},
};
