"use client";

import { useState, useEffect, useRef } from "react";

interface CodeSample {
  id: string;
  label: string;
  icon: string;
  description: string;
  code: string;
  agentDiff: string;
  judgeReview: JudgeReview;
}

interface Finding {
  severity: "critical" | "high" | "medium" | "low" | "pass";
  category: string;
  line: string;
  detail: string;
}

interface JudgeReview {
  findings: Finding[];
  verdict: "reject" | "request_changes" | "approve";
  summary: string;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "bg-red-500/15", text: "text-red-400", label: "CRITICAL" },
  high: { bg: "bg-orange-500/15", text: "text-orange-400", label: "HIGH" },
  medium: { bg: "bg-amber-500/15", text: "text-amber-400", label: "MEDIUM" },
  low: { bg: "bg-blue-500/15", text: "text-blue-400", label: "LOW" },
  pass: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "PASS" },
};

const VERDICT_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  reject: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/40", icon: "🚫" },
  request_changes: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/40", icon: "⚠️" },
  approve: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/40", icon: "✅" },
};

const SAMPLES: CodeSample[] = [
  {
    id: "sql",
    label: "Database Query",
    icon: "🗄",
    description: "Agent was asked to add a user search endpoint",
    code: `// Original: no search endpoint exists`,
    agentDiff: `+ app.get('/api/users/search', async (req, res) => {
+   const { name, email } = req.query;
+   const query = \`SELECT * FROM users 
+     WHERE name LIKE '%\${name}%' 
+     OR email LIKE '%\${email}%'\`;
+   const results = await db.execute(query);
+   res.json(results);
+ });`,
    judgeReview: {
      findings: [
        { severity: "critical", category: "SQL Injection", line: "3-4", detail: "User input from req.query interpolated directly into SQL string. Attacker can execute arbitrary SQL via name or email parameters." },
        { severity: "high", category: "Over-fetching", line: "2", detail: "SELECT * returns all columns including password_hash, internal_id, and other sensitive fields. Specify only needed columns." },
        { severity: "high", category: "Missing Auth", line: "1", detail: "No authentication middleware on the route. Any unauthenticated caller can search the entire user database." },
        { severity: "medium", category: "Missing Pagination", line: "5", detail: "No LIMIT clause. A broad search could return the entire users table, causing memory exhaustion and potential DoS." },
      ],
      verdict: "reject",
      summary: "Critical SQL injection vulnerability. This diff MUST NOT be merged. The agent must use parameterised queries, add authentication middleware, restrict selected columns, and implement pagination.",
    },
  },
  {
    id: "env",
    label: "Config Change",
    icon: "⚙️",
    description: "Agent was asked to add Stripe integration",
    code: `// Original .env.example
DATABASE_URL=postgres://localhost:5432/app
NODE_ENV=development`,
    agentDiff: `  DATABASE_URL=postgres://localhost:5432/app
  NODE_ENV=development
+ STRIPE_SECRET_KEY=sk_live_51Hf8...actual_key_here
+ STRIPE_WEBHOOK_SECRET=whsec_actual_secret
+ AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
+ AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/actual`,
    judgeReview: {
      findings: [
        { severity: "critical", category: "Secret in Code", line: "3", detail: "Live Stripe secret key committed to repository. This key grants full API access to the Stripe account including charge creation and refunds." },
        { severity: "critical", category: "Secret in Code", line: "5-6", detail: "AWS credentials committed to repository. These grant access to AWS services and could result in cloud resource abuse or data exfiltration." },
        { severity: "high", category: "Secret in Code", line: "4", detail: "Stripe webhook secret committed. Attacker could forge webhook events to trigger business logic (e.g., fake payment confirmations)." },
      ],
      verdict: "reject",
      summary: "Multiple live secrets committed to repository. Immediate action: rotate ALL exposed keys. This diff must not be merged. Secrets must be injected via environment variables or a secrets manager, never committed to source control.",
    },
  },
  {
    id: "good",
    label: "Clean Diff",
    icon: "✨",
    description: "Agent was asked to add input validation to a form",
    code: `// Original: no validation
function handleSubmit(data) {
  return fetch('/api/submit', { method: 'POST', body: JSON.stringify(data) });
}`,
    agentDiff: `+ import { z } from 'zod';
+ 
+ const FormSchema = z.object({
+   name: z.string().min(1).max(100),
+   email: z.string().email(),
+   age: z.number().int().min(0).max(150),
+ });
+ 
  function handleSubmit(data) {
+   const parsed = FormSchema.safeParse(data);
+   if (!parsed.success) {
+     return { error: parsed.error.flatten() };
+   }
-   return fetch('/api/submit', { method: 'POST', body: JSON.stringify(data) });
+   return fetch('/api/submit', {
+     method: 'POST',
+     headers: { 'Content-Type': 'application/json' },
+     body: JSON.stringify(parsed.data),
+   });
  }`,
    judgeReview: {
      findings: [
        { severity: "pass", category: "Input Validation", line: "3-7", detail: "Zod schema provides runtime type validation with sensible constraints. Prevents type confusion and oversized inputs." },
        { severity: "pass", category: "Safe Data Flow", line: "11", detail: "Uses parsed.data (validated output) rather than raw input for the fetch call. Ensures only validated data reaches the API." },
        { severity: "low", category: "Missing Server Validation", line: "-", detail: "Client-side validation is present but server-side validation should also exist. Not a blocker since the agent's task was client-side only." },
      ],
      verdict: "approve",
      summary: "Clean, well-structured diff. Adds proper input validation using Zod with appropriate constraints. Uses validated data for the API call. Minor note: ensure corresponding server-side validation exists.",
    },
  },
];

export default function LLMJudgeDemo() {
  const [activeSample, setActiveSample] = useState("sql");
  const [reviewing, setReviewing] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [revealedFindings, setRevealedFindings] = useState(0);

  const sample = SAMPLES.find((s) => s.id === activeSample)!;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startReview = () => {
    setReviewing(true);
    setShowReview(false);
    setRevealedFindings(0);
    setTimeout(() => {
      setReviewing(false);
      setShowReview(true);
      let count = 0;
      timerRef.current = setInterval(() => {
        count++;
        setRevealedFindings(count);
        if (count >= sample.judgeReview.findings.length) {
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 600);
    }, 1500);
  };

  useEffect(() => {
    setShowReview(false);
    setReviewing(false);
    setRevealedFindings(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [activeSample]);

  const vStyle = VERDICT_STYLES[sample.judgeReview.verdict];

  return (
    <div className="my-8 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto">
        {SAMPLES.map((s) => (
          <button key={s.id} onClick={() => setActiveSample(s.id)}
            className={`flex-1 min-w-[130px] px-4 py-3 text-left transition-all cursor-pointer border-b-2 ${
              activeSample === s.id ? "border-[var(--accent)] bg-[var(--bg)]" : "border-transparent hover:bg-[var(--bg)]"
            }`}>
            <div className={`text-xs font-bold ${activeSample === s.id ? "text-[var(--accent)]" : "text-[var(--fg-muted)]"}`}>
              {s.icon} {s.label}
            </div>
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="px-5 py-3 border-b border-[var(--border)]">
        <p className="text-sm text-[var(--fg)]">{sample.description}</p>
      </div>

      {/* Agent diff */}
      <div className="px-5 py-3 border-b border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-2">Agent-Generated Diff</p>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--code-bg)] p-4 overflow-x-auto">
          <pre className="text-xs font-mono leading-relaxed whitespace-pre text-[var(--fg)]">
            {sample.agentDiff.split("\n").map((line, i) => {
              const color = line.startsWith("+") ? "text-emerald-400" : line.startsWith("-") ? "text-red-400" : "text-[var(--fg-muted)]";
              return <div key={i} className={color}>{line}</div>;
            })}
          </pre>
        </div>
      </div>

      {/* Review button */}
      {!showReview && (
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <button onClick={startReview} disabled={reviewing}
            className="w-full px-4 py-3 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-semibold cursor-pointer transition-all hover:bg-[var(--accent)]/20 disabled:opacity-60">
            {reviewing ? "🔍 Judge LLM analysing diff..." : "🔍 Run LLM-as-Judge Review"}
          </button>
        </div>
      )}

      {/* Judge review */}
      {showReview && (
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-3">Judge LLM Findings</p>
          <div className="space-y-2 mb-4">
            {sample.judgeReview.findings.map((f, i) => {
              if (i >= revealedFindings) return null;
              const sev = SEVERITY_STYLES[f.severity];
              return (
                <div key={i} className={`rounded-lg border border-[var(--border)] ${sev.bg} px-4 py-3 animate-[fadeIn_0.3s_ease-in]`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${sev.bg} ${sev.text} border border-current/20`}>
                      {sev.label}
                    </span>
                    <span className="text-xs font-semibold text-[var(--fg)]">{f.category}</span>
                    {f.line !== "-" && <span className="text-[10px] text-[var(--fg-muted)] font-mono">line {f.line}</span>}
                  </div>
                  <p className="text-xs text-[var(--fg)] leading-relaxed">{f.detail}</p>
                </div>
              );
            })}
          </div>

          {revealedFindings >= sample.judgeReview.findings.length && (
            <div className={`rounded-lg border ${vStyle.border} ${vStyle.bg} p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{vStyle.icon}</span>
                <span className={`text-sm font-bold uppercase ${vStyle.text}`}>
                  Verdict: {sample.judgeReview.verdict.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-[var(--fg)] leading-relaxed">{sample.judgeReview.summary}</p>
            </div>
          )}
        </div>
      )}

      <div className="px-5 py-4 bg-[var(--bg)]">
        <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
          <span className="font-semibold text-[var(--fg)]">The agent writes code. A separate LLM judges it.</span>{" "}
          LLM-as-Judge uses a second model (or the same model with a different system prompt) to review agent-generated diffs before they reach the codebase. The judge checks for security vulnerabilities, leaked secrets, correctness, and adherence to project conventions. This separation of concerns mirrors human code review — the author and reviewer should not be the same person. When the judge rejects a diff, the agent iterates before any code is committed.
        </p>
      </div>
    </div>
  );
}
