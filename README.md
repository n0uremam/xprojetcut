# Netlify function sanity check

Netlify Functions only run JavaScript/TypeScript/Go. This repository ships a minimal Node.js function (`netlify/functions/app.js`) plus a loading page that forwards users to the function URL so you can confirm the deployment works end-to-end.

## Folder layout
```
.
├── Homepage.html        # Root landing page -> redirects to /.netlify/functions/app
├── _redirects           # Sends / to Homepage.html
├── netlify.toml         # Points Netlify at functions/ and the publish root
└── netlify
    └── functions
        └── app.js       # Minimal confirmation handler
```

## Deploying to Netlify
1. Ensure the build settings use `publish = .` and `functions = netlify/functions` (already set in `netlify.toml`).
2. Deploy the repo.
3. After the deploy finishes, open these URLs (replace YOUR-SITE with your domain):
   - `https://YOUR-SITE.netlify.app/` → shows the loading page briefly
   - `https://YOUR-SITE.netlify.app/Homepage.html` → same loading page
   - `https://YOUR-SITE.netlify.app/.netlify/functions/app` → displays **“Netlify Function is working ✅”**

If the last URL 404s, Netlify did not find `netlify/functions/app.js` during the build (check the Functions tab and deploy logs).

## Using a different backend
Netlify does **not** run Python/Flask functions. If you need Flask, host it on a Python-friendly provider (Render, Railway, etc.) and call it from the frontend. To keep everything on Netlify, rewrite the backend in Node.js as additional functions alongside `netlify/functions/app.js`.
