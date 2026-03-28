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

Usually the homepage references `/_next/static/chunks/*.css` but those files are missing on the server (HTML and `_next` got out of sync). The workflow uses **incremental FTP** (`dangerous-clean-slate: false`) so a new deploy adds files without deleting everything first. After a successful deploy, in **SiteGround → Speed → Caching** (or **SuperCacher**), **purge all caches** for `aegis-labs.pro`, then hard-refresh the browser.
