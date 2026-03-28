"use client";

import { useState, useEffect, useRef } from "react";

interface Query {
  id: string;
  label: string;
  icon: string;
  question: string;
  pureLLM: { response: string; verdict: string; color: string };
  rag: { retrieved: string[]; response: string; verdict: string; color: string };
}

const QUERIES: Query[] = [
  {
    id: "policy",
    label: "Company Policy",
    icon: "📋",
    question: "What is Acme Corp's policy on remote work for senior engineers?",
    pureLLM: {
      response: `Based on general industry trends, many tech companies allow senior engineers to work remotely 2-3 days per week. Some companies offer fully remote positions for senior roles given their demonstrated autonomy and output quality.

However, I don't have specific information about Acme Corp's remote work policy. I'd recommend checking your company's HR portal or employee handbook for the most accurate and up-to-date policy details.`,
      verdict: "Generic — no company-specific knowledge",
      color: "amber",
    },
    rag: {
      retrieved: [
        "📄 HR Policy v3.2 (§4.1 Remote Work): \"Senior engineers (IC4+) are approved for full-time remote work with quarterly in-person team summits. Remote workers must maintain core hours 10am-3pm in their declared timezone.\"",
        "📄 Engineering Handbook (§2.3): \"Remote senior engineers receive a $2,500 annual home office stipend and are required to use the corporate VPN for all code repository access.\"",
        "📄 Q4 Policy Update Memo: \"Effective January 2025, remote workers in different timezones than their team must attend at least one synchronous standup per week.\"",
      ],
      response: `According to Acme Corp's HR Policy v3.2, senior engineers (IC4 and above) are approved for full-time remote work, subject to these conditions:

1. **Quarterly summits**: Mandatory in-person team gathering each quarter
2. **Core hours**: Must be available 10am-3pm in your declared timezone
3. **VPN requirement**: All repository access must go through the corporate VPN
4. **Home office stipend**: $2,500/year for home office setup
5. **Cross-timezone teams** (per Q4 update): At least one synchronous standup per week if in a different timezone than your team

Sources: HR Policy v3.2 §4.1, Engineering Handbook §2.3, Q4 Policy Update Memo.`,
      verdict: "Grounded — cites specific internal documents",
      color: "emerald",
    },
  },
  {
    id: "bug",
    label: "Codebase Bug",
    icon: "🐛",
    question: "Why does our payment service return 500 errors when processing refunds over $10,000?",
    pureLLM: {
      response: `A 500 error on large refunds could be caused by several common issues:

1. **Integer overflow**: If the amount field uses a 32-bit integer in cents, $10,000 (1,000,000 cents) is within range, but check if there's multiplication happening
2. **Timeout**: Large refunds may trigger additional fraud checks that exceed your HTTP timeout
3. **Database constraint**: A CHECK constraint on the amount column might cap values
4. **Third-party API limit**: Your payment processor may have a single-transaction refund limit

I'd suggest checking your payment service logs and the processor's API documentation for specifics.`,
      verdict: "Reasonable guesses — but not YOUR bug",
      color: "amber",
    },
    rag: {
      retrieved: [
        "📄 payment-service/src/refund.ts (line 142): \"const amount = parseInt(req.body.amount)\" — Note: parseInt without radix, and amount is stored as string in the request body from the frontend.",
        "📄 JIRA-4521 (closed, won't fix): \"Refunds over $10k fail because the Stripe API key in production has a per-transaction limit of $10,000. Need to request elevated limits from Stripe.\"",
        "📄 incident-report-2024-11-03.md: \"Root cause: The refund endpoint catches Stripe StripeInvalidRequestError but re-throws it as a generic 500 instead of returning a 422 with the Stripe error message.\"",
      ],
      response: `This is a known issue. Here's what's happening:

1. **Root cause (JIRA-4521)**: Your production Stripe API key has a per-transaction refund limit of $10,000. Refunds exceeding this amount trigger a \`StripeInvalidRequestError\` from Stripe's API.

2. **Why it shows as 500**: The refund endpoint at \`payment-service/src/refund.ts:142\` catches the Stripe error but re-throws it as a generic 500 Internal Server Error instead of returning a 422 with the actual Stripe error message (per incident report from Nov 3, 2024).

3. **Fix**: Two changes needed:
   - Request elevated transaction limits from Stripe for your production key
   - Update the error handler in \`refund.ts\` to return the Stripe error detail as a 422

Sources: JIRA-4521, incident-report-2024-11-03.md, payment-service/src/refund.ts.`,
      verdict: "Pinpoints the exact issue with file references",
      color: "emerald",
    },
  },
  {
    id: "recent",
    label: "Recent Event",
    icon: "📰",
    question: "What were the key announcements from yesterday's board meeting?",
    pureLLM: {
      response: `I don't have access to information about your company's board meeting. Board meetings typically cover:

- Financial performance reviews
- Strategic initiatives and roadmap updates
- Executive leadership changes
- Budget approvals for upcoming quarters
- Risk and compliance updates

For specific details about yesterday's meeting, I'd recommend checking your company's internal communications channel or requesting the board meeting minutes from the corporate secretary.`,
      verdict: "No knowledge — falls back to generic template",
      color: "red",
    },
    rag: {
      retrieved: [
        "📄 board-minutes-2025-03-14.md: \"The board approved a $12M Series C extension led by Sequoia. Funds earmarked for: AI platform expansion (40%), team growth APAC (35%), security certifications (25%).\"",
        "📄 board-minutes-2025-03-14.md: \"CEO announced partnership with Databricks for enterprise data pipeline integration. GA target: Q3 2025.\"",
        "📄 ceo-slack-summary-2025-03-14: \"Three key takeaways: (1) Series C extension closed, (2) Databricks partnership signed, (3) Board approved opening Singapore engineering office.\"",
      ],
      response: `Yesterday's board meeting (March 14, 2025) had three key announcements:

1. **Series C Extension**: $12M extension approved, led by Sequoia. Allocation: 40% AI platform expansion, 35% APAC team growth, 25% security certifications.

2. **Databricks Partnership**: Strategic partnership for enterprise data pipeline integration. General availability target is Q3 2025.

3. **Singapore Office**: Board approved opening a new engineering office in Singapore as part of the APAC expansion.

Sources: Board minutes (2025-03-14), CEO Slack summary.`,
      verdict: "Current — retrieves today's internal documents",
      color: "emerald",
    },
  },
];

function useTypewriter(text: string, speed: number = 6) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);
  useEffect(() => {
    setDisplayed(""); idx.current = 0; setDone(false);
    const id = setInterval(() => {
      idx.current += 1;
      if (idx.current >= text.length) { setDisplayed(text); setDone(true); clearInterval(id); }
      else setDisplayed(text.slice(0, idx.current));
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { displayed, done };
}

export default function RAGDemo() {
  const [activeQuery, setActiveQuery] = useState("policy");
  const [mode, setMode] = useState<"pure" | "rag">("pure");

  const query = QUERIES.find((q) => q.id === activeQuery)!;
  const data = mode === "pure" ? query.pureLLM : query.rag;
  const { displayed, done } = useTypewriter(data.response, 5);

  return (
    <div className="my-8 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
      {/* Query tabs */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto">
        {QUERIES.map((q) => (
          <button key={q.id} onClick={() => { setActiveQuery(q.id); setMode("pure"); }}
            className={`flex-1 min-w-[120px] px-4 py-3 text-left transition-all cursor-pointer border-b-2 ${
              activeQuery === q.id ? "border-[var(--accent)] bg-[var(--bg)]" : "border-transparent hover:bg-[var(--bg)]"
            }`}>
            <div className={`text-xs font-bold ${activeQuery === q.id ? "text-[var(--accent)]" : "text-[var(--fg-muted)]"}`}>
              {q.icon} {q.label}
            </div>
          </button>
        ))}
      </div>

      {/* Mode toggle */}
      <div className="px-5 py-3 border-b border-[var(--border)]">
        <div className="flex gap-2">
          <button onClick={() => setMode("pure")}
            className={`flex-1 px-4 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              mode === "pure" ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--fg-subtle)]"
            }`}>Pure LLM — model knowledge only</button>
          <button onClick={() => setMode("rag")}
            className={`flex-1 px-4 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              mode === "rag" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--fg-subtle)]"
            }`}>RAG — retrieval-augmented</button>
        </div>
      </div>

      {/* Question */}
      <div className="px-5 py-3 border-b border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-2">User Question</p>
        <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
          <p className="text-sm text-[var(--fg)]">{query.question}</p>
        </div>
      </div>

      {/* Retrieved docs (RAG only) */}
      {mode === "rag" && (
        <div className="px-5 py-3 border-b border-[var(--border)] bg-emerald-500/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">Retrieved Documents (injected into context)</p>
          <div className="space-y-2">
            {query.rag.retrieved.map((doc, i) => (
              <div key={i} className="rounded-md border border-emerald-500/30 bg-[var(--bg)] px-4 py-2.5">
                <p className="text-xs font-mono text-[var(--fg)] leading-relaxed">{doc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Response */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)]">
            {mode === "pure" ? "Pure LLM Response" : "RAG-Augmented Response"}
          </p>
          {done && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
              data.color === "emerald" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : data.color === "red" ? "bg-red-500/20 text-red-300 border-red-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            }`}>
              {data.verdict}
            </span>
          )}
        </div>
        <div className={`rounded-lg border bg-[var(--bg)] p-5 min-h-[180px] ${
          done ? (data.color === "emerald" ? "border-emerald-500/40" : data.color === "red" ? "border-red-500/40" : "border-amber-500/40") : "border-[var(--border)]"
        }`}>
          <pre className="text-sm font-sans leading-relaxed whitespace-pre-wrap text-[var(--fg)]">
            {displayed}
            {!done && <span className="inline-block w-2 h-4 ml-0.5 bg-[var(--accent)] animate-pulse" />}
          </pre>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--bg)]">
        <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
          <span className="font-semibold text-[var(--fg)]">RAG gives the model knowledge it was never trained on.</span>{" "}
          A pure LLM can only answer from its training data — it has never seen your company's HR policies, codebase, or yesterday's board meeting. RAG retrieves relevant documents from your knowledge base and injects them into the context window. The model's reasoning ability is unchanged, but now it reasons over your data instead of guessing.
        </p>
      </div>
    </div>
  );
}
