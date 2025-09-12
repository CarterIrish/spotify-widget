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

		const url = new URL(request.url);
		const param1 = url.searchParams.get('param1');
		const param2 = url.searchParams.get('param2');
		// Process the parameters
		//return new Response(`Received param1: ${param1}, param2: ${param2}`);


		const data = { message: "Hello Frontend!" };
		return new Response(JSON.stringify(data), { headers: { 'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 200, body: JSON.stringify({ 'params': { param1, param2 } }) });
	},
};

