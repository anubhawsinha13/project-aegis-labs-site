/**
 * Creates Stripe Checkout Sessions (embedded) for aegis-labs.pro/pay/
 * Deploy: wrangler deploy (see README.md)
 */
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "*";
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const secret = env.STRIPE_SECRET_KEY;
    const priceId = env.STRIPE_PRICE_ID;
    const returnOrigin = (env.RETURN_URL_ORIGIN || "https://aegis-labs.pro").replace(/\/$/, "");

    if (!secret || !priceId) {
      return new Response(
        JSON.stringify({ error: "Worker missing STRIPE_SECRET_KEY or STRIPE_PRICE_ID" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("ui_mode", "embedded");
    params.set(
      "return_url",
      `${returnOrigin}/pay/success/?session_id={CHECKOUT_SESSION_ID}`
    );
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await stripeRes.json();

    if (!stripeRes.ok) {
      return new Response(
        JSON.stringify({
          error: data.error?.message || "Stripe API error",
        }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (!data.client_secret) {
      return new Response(JSON.stringify({ error: "No client_secret in Stripe response" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ clientSecret: data.client_secret }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  },
};
