# Stripe Embedded Checkout API (Cloudflare Worker)

Aegis Labs is a **static site** on SiteGround. Stripe’s **secret key** cannot go in the browser, so this tiny Worker creates **Checkout Sessions** with `ui_mode: embedded`. The checkout UI is then mounted on [https://aegis-labs.pro/pay/](https://aegis-labs.pro/pay/) via `@stripe/stripe-js`.

## 1. Stripe Dashboard

1. Create a **Product** and **Price** (one-time payment), or reuse an existing **Price ID** (`price_...`).
2. Copy your **Publishable key** (`pk_live_...` / `pk_test_...`) and **Secret key** (`sk_live_...` / `sk_test_...`).

## 2. Deploy the Worker (Cloudflare)

1. Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) and log in.
2. From this folder:

```bash
cd orionedge/stripe-checkout-worker
wrangler secret put STRIPE_SECRET_KEY   # paste sk_test_... or sk_live_...
wrangler secret put STRIPE_PRICE_ID     # paste price_...
wrangler secret put RETURN_URL_ORIGIN   # https://aegis-labs.pro  (no trailing slash)
wrangler deploy
```

3. Note the Worker URL, e.g. `https://aegis-stripe-checkout.your-subdomain.workers.dev`.

## 3. GitHub Actions (Aegis build)

Add repository **Secrets**:

| Secret | Value |
|--------|--------|
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` |
| `STRIPE_CHECKOUT_API_URL` | Full Worker URL (e.g. `https://....workers.dev`) |

The workflow passes them as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_STRIPE_CHECKOUT_API_URL` at build time.

## 4. Stripe Dashboard → Domains

Under **Settings → Checkout**, add your site if Stripe asks for allowed domains for embedded checkout:

- `aegis-labs.pro`
- `www.aegis-labs.pro` (if used)

## Local testing

Run the Worker on `localhost` with Wrangler dev, set in `.env.local` in `orionedge/`:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_CHECKOUT_API_URL=http://127.0.0.1:8787
```

`wrangler dev` must send CORS headers for your dev origin (the template allows any origin for OPTIONS/POST responses).
