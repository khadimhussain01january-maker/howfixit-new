# HowFixIt — source project

This replaces the old plain-HTML repo. The site is now built automatically by
GitHub Actions every time something changes, and new guides can be published
through a simple form at `/admin` instead of editing files by hand.

## How it fits together

- `src/` — the actual content and templates (Nunjucks + Markdown)
- `src/guides/*.md` — one file per published guide (this is what the CMS writes to)
- `.eleventy.js` — build configuration
- `.github/workflows/deploy.yml` — builds the site and publishes it to GitHub
  Pages on every push to `main`
- `admin/` — the Decap CMS content-editing panel, served at `/admin`
- `oauth-worker/worker.js` — a small relay that lets `/admin` log in with GitHub
  (needs to be deployed separately, once — see below)

## One-time setup still needed

1. **Create a GitHub OAuth App** at
   https://github.com/settings/developers → "New OAuth App"
   - Homepage URL: `https://howfixit.publicvm.com`
   - Authorization callback URL: `https://<your-worker-name>.workers.dev/callback`
     (fill this in after step 2, once you know the Worker's URL)
   - Copy the **Client ID** and generate a **Client Secret** — you'll need both.

2. **Deploy `oauth-worker/worker.js` to Cloudflare Workers** (free)
   - Sign up at https://dash.cloudflare.com if you don't have an account
   - Workers & Pages → Create → Create Worker → paste in the contents of
     `oauth-worker/worker.js` → Deploy
   - In the Worker's Settings → Variables, add two **secret** variables:
     `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (from step 1)
   - Note the Worker's URL, e.g. `https://howfixit-oauth.yourname.workers.dev`

3. **Update `admin/config.yml`**
   - Replace `https://REPLACE-WITH-YOUR-OAUTH-WORKER.workers.dev` with your
     actual Worker URL from step 2

4. **Push everything to GitHub** (replacing the old repo contents)

5. **Visit `https://howfixit.publicvm.com/admin`**, click "Login with GitHub",
   approve access, and you'll see the Guides form.

## Publishing an article (day to day)

1. Go to `https://howfixit.publicvm.com/admin`
2. Click **New Guide**
3. Fill in: Title, Category, Color Tone (matches the Category), Short
   Description, Date, and the Article Body (Markdown — headings, lists, bold
   text all work)
4. Click **Publish now**

GitHub Actions picks up the change automatically and the new guide is live
within 1-2 minutes, already showing up on the homepage and the Our Work page.
