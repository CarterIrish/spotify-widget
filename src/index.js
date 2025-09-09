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
		const callback = await env.SPOTIFY_CALLBACK_URI.get();
		console.log('Callback URL:', callback);
		return new Response('Callback URL:', callback);
	},
};
