# Aegis Labs site (`aegis-labs.pro`)

Self-contained static Next.js app for [aegis-labs.pro](https://aegis-labs.pro). Posts (`content/posts/`) and interactive demos (`components/simulations/`) live in **this** repository.

If you also maintain the **anuva.blog** project with the same articles, you have **two copies** of MDX and demo components until you add a submodule, package, or sync process. Pick one place as source of truth when editing.

## Develop

```bash
npm install && npm run dev
```

## Pay / Stripe

- **`/pay/`** uses **Stripe Embedded Checkout** (checkout UI on your site).
- Backend: **`stripe-checkout-worker/`** (Cloudflare Worker). Deploy it first, then copy the Worker URL.
- **Required GitHub secrets** (without these, `/pay/` stays broken and CI will fail the build on purpose):

  | Secret | What to paste |
  |--------|----------------|
  | `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys → **Publishable** key (`pk_live_…` or `pk_test_…`) |
  | `STRIPE_CHECKOUT_API_URL` | Full Worker URL after `wrangler deploy`, e.g. `https://aegis-stripe-checkout.xxx.workers.dev` (no trailing slash) |

  From your machine (after `gh auth login`):  
  `gh secret set STRIPE_PUBLISHABLE_KEY -R anubhawsinha13/project-aegis-labs-site`  
  `gh secret set STRIPE_CHECKOUT_API_URL -R anubhawsinha13/project-aegis-labs-site`

- Local dev: copy [`.env.example`](.env.example) to `.env.local` and run the Worker with `wrangler dev` (see `stripe-checkout-worker/README.md`).

## Deploy

GitHub Actions **Build & Deploy Aegis Labs** (`.github/workflows/deploy.yml`) builds `out/` and publishes via FTP to SiteGround.

### Site looks unstyled (no CSS)

Two common causes:

1. **Stale HTML at the CDN** — the new `index.html` points at new hashed CSS files, but the edge still serves an **old** `index.html` that references **old** chunk names (those files may be gone), so every stylesheet 404s. Fix: **SiteGround → Speed → Caching / SuperCacher → purge everything** for `aegis-labs.pro`, then hard-refresh (Shift+reload).

2. **FTP out of sync** — less common now that the workflow checks `out/` before upload. If purging cache does not help, open **Site Tools → Site → File Manager** and confirm `_next/static/chunks/` sits next to `index.html` and contains many `.js` / `.css` files.
