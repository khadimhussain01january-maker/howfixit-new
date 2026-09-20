/**
 * GitHub OAuth relay for Decap CMS, meant to run on Cloudflare Workers (free tier).
 *
 * Requires two secrets set in the Worker's settings:
 *   GITHUB_CLIENT_ID
 *   GITHUB_CLIENT_SECRET
 * (from a GitHub OAuth App you create at https://github.com/settings/developers)
 *
 * Routes:
 *   GET /auth      -> redirects the user to GitHub to approve access
 *   GET /callback  -> exchanges the code for a token and hands it back to the CMS tab
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") {
      const redirectUri = `${url.origin}/callback`;
      const githubAuthUrl =
        `https://github.com/login/oauth/authorize` +
        `?client_id=${env.GITHUB_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=repo,user`;
      return Response.redirect(githubAuthUrl, 302);
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response("Missing code", { status: 400 });
      }

      const tokenResponse = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code: code,
          }),
        }
      );

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return new Response(
          `GitHub OAuth error: ${tokenData.error_description || tokenData.error}`,
          { status: 400 }
        );
      }

      const token = tokenData.access_token;
      const payloadSuccess = JSON.stringify({
        token: token,
        provider: "github",
      });

      // This page talks back to the admin/index.html popup window using the
      // handshake protocol Decap CMS (and the older Netlify CMS) expect.
      const html = `<!doctype html>
<html>
<body>
<script>
  (function() {
    function receiveMessage(e) {
      window.opener.postMessage(
        'authorization:github:success:${payloadSuccess.replace(/'/g, "\\'")}',
        e.origin
      );
      window.removeEventListener("message", receiveMessage, false);
    }
    window.addEventListener("message", receiveMessage, false);
    window.opener.postMessage("authorizing:github", "*");
  })();
</script>
Login successful, you can close this window.
</body>
</html>`;

      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("HowFixIt OAuth relay is running.", { status: 200 });
  },
};
