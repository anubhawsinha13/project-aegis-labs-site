# Stripe Embedded Checkout API (Cloudflare Worker)

Aegis Labs is a **static site** on SiteGround. Stripe’s **secret key** cannot go in the browser, so this tiny Worker creates **Checkout Sessions** with `ui_mode: embedded`. The checkout UI is then mounted on [https://aegis-labs.pro/pay/](https://aegis-labs.pro/pay/) via `@stripe/stripe-js`.

## 1. Stripe Dashboard

1. Create a **Product** and **Price** (one-time payment), or reuse an existing **Price ID** (`price_...`).
2. Copy your **Publishable key** (`pk_live_...` / `pk_test_...`) and **Secret key** (`sk_live_...` / `sk_test_...`).

## 2. Deploy the Worker (Cloudflare)

GitHub secrets (`STRIPE_PUBLISHABLE_KEY`, `STRIPE_CHECKOUT_API_URL`) only affect the **static site build**. The Worker itself needs **separate** secrets on Cloudflare, or every checkout POST returns `500` and Stripe shows “Something went wrong”.

1. Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) and log in.
2. From this folder:

```bash
cd stripe-checkout-worker
npx wrangler@3 secret put STRIPE_SECRET_KEY   # paste sk_test_... or sk_live_...
npx wrangler@3 secret put STRIPE_PRICE_ID     # paste price_...
npx wrangler@3 secret put RETURN_URL_ORIGIN   # https://aegis-labs.pro  (no trailing slash)
npx wrangler@3 deploy
```

**Verify the Worker (replace with your URL):**

```bash
curl -sS -X POST "https://aegis-stripe-checkout.YOUR_SUBDOMAIN.workers.dev" \
  -H "Origin: https://aegis-labs.pro" -H "Content-Type: application/json" -d "{}"
```

- If you see `{"error":"Worker missing STRIPE_SECRET_KEY or STRIPE_PRICE_ID"}`, the Cloudflare secrets are still missing — run the three `secret put` commands again for **this** Worker.
- Success looks like `{"clientSecret":"..."}` (long string).

3. Note the Worker URL printed after deploy. It always includes **your** account subdomain, e.g.  
   `https://aegis-stripe-checkout.<your-subdomain>.workers.dev`  
   (The Worker name in [`wrangler.toml`](wrangler.toml) is `aegis-stripe-checkout` — the URL is **not** `aegis-labs.workers.dev` unless you created a Worker with that exact name on that route.)

**Sanity check before GitHub:** the URL must resolve:

```bash
curl -sI "https://YOUR_WORKER_URL" | head -3
```

You should see `HTTP/2 405` or `404` from the Worker (not `Could not resolve host`).

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

Run the Worker on `localhost` with Wrangler dev, set in `.env.local` in the **repo root** (see `../.env.example`):

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_CHECKOUT_API_URL=http://127.0.0.1:8787
```

`wrangler dev` must send CORS headers for your dev origin (the template allows any origin for OPTIONS/POST responses).
