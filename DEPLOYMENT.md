# Frontend Deployment Guide

## Platform
Netlify — auto-deploys from `main` branch via GitHub Actions

## GitHub Secrets Required

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `NETLIFY_AUTH_TOKEN` | Personal access token from netlify.com → User settings → Applications |
| `NETLIFY_SITE_ID` | Site ID from netlify.com → Site settings → General (API ID) |

## GitHub Actions Environment Variables (Build-time)

Set these in **Settings → Secrets and variables → Actions → Variables** (not secrets — these are public build vars baked into the JS bundle):

| Variable | Example value |
|----------|---------------|
| `VUE_APP_API_BASE_URL` | `https://api.soltechtrade.com` |
| `VUE_APP_WS_URL` | `wss://api.soltechtrade.com` |
| `VUE_APP_FIREBASE_API_KEY` | Firebase web API key |
| `VUE_APP_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VUE_APP_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VUE_APP_FIREBASE_APP_ID` | Firebase app ID |
| `VUE_APP_HELIUS_API_KEY` | Helius API key (used for client-side RPC calls) |
| `VUE_APP_JUPITER_API_KEY` | Jupiter API key (optional, for higher rate limits) |

> **Note**: All `VUE_APP_*` variables are embedded in the compiled JS and visible to end users.
> Never put private keys or server-side secrets here.

## Deploy Flow

1. Push to `main` branch
2. GitHub Actions installs dependencies and runs `vue-cli-service build`
3. Built `dist/` is deployed to Netlify via `nwtgck/actions-netlify`
4. Netlify CDN serves the SPA; `_redirects` file handles client-side routing

## Netlify Configuration

`public/_redirects` should contain:
```
/*  /index.html  200
```
This ensures Vue Router's history mode works for direct URL access.

## Local Development

```bash
cp .env.example .env.local
# Fill in all VUE_APP_ variables
npm install
npm run serve
```

## Environment File Reference

See `.env.example` for all required variables.
