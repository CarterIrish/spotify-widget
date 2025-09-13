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
		const path = url.pathname;
		if (path.endsWith("/auth") && request.method === "POST") {
			const { code, code_verifier } = await request.json();
			// Exchange the authorization code for an access token
			const getToken = async (code, code_verifier) =>
			{
				const url = new URL('https://accounts.spotify.com/api/token');
				const payload = {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({
						client_id: env.SPOTIFY_CLIENT_ID,
						grant_type: 'authorization_code',
						code,
						redirect_uri: 'https://carterirish.net/callback',
						code_verifier
					})
				};
				const response = await fetch(url,payload).then(res => res.json());
				console.log(response);
				if(response.status === 200)
				{
					let user_id = await fetch('https://api.spotify.com/v1/me', {
						headers: {
							'Authorization': `Bearer ${response.access_token}`
						}
					}).then(res => res.json());
					console.log(user_id);
				}
			}
		}
		// Process the parameters
		//return new Response(`Received param1: ${param1}, param2: ${param2}`);

		const data = { message: "Hello Frontend!", body: { message } };
		return new Response(JSON.stringify(data), { headers: { 'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 200 });
	},
};

