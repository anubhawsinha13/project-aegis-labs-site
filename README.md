# Aegis Labs site (`aegis-labs.pro`)

Self-contained static Next.js app for [aegis-labs.pro](https://aegis-labs.pro). Posts (`content/posts/`) and interactive demos (`components/simulations/`) live in **this** repository.

If you also maintain the **anuva.blog** project with the same articles, you have **two copies** of MDX and demo components until you add a submodule, package, or sync process. Pick one place as source of truth when editing.

## Develop

```bash
npm install && npm run dev
```

## Pay / Stripe

- **`/pay/`** uses **Stripe Embedded Checkout** (checkout UI on your site).
- Backend: **`stripe-checkout-worker/`** (Cloudflare Worker). See `stripe-checkout-worker/README.md`.
- GitHub Actions needs secrets **`STRIPE_PUBLISHABLE_KEY`** and **`STRIPE_CHECKOUT_API_URL`** for production builds.

## Deploy

GitHub Actions **Build & Deploy Aegis Labs** (`.github/workflows/deploy.yml`) builds `out/` and publishes via FTP to SiteGround.
