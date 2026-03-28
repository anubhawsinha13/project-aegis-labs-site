"use client";

import { useState, useEffect, useRef } from "react";

interface Scenario {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  freeText: string;
  jsonOutput: string;
  parseDemo: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "extract",
    label: "Contact Extraction",
    icon: "👤",
    prompt: "Extract contact information from: \"Hi, I'm Sarah Chen, senior engineer at Datadog. Reach me at sarah.chen@datadog.com or 415-555-0142.\"",
    freeText: `From the provided text, I can identify the following contact information:

The person's name is Sarah Chen. She works as a senior engineer at Datadog. Her email address is sarah.chen@datadog.com, and her phone number is 415-555-0142.

She appears to be based in the San Francisco Bay Area based on the 415 area code, though this is an inference rather than explicitly stated.`,
    jsonOutput: `{
  "name": "Sarah Chen",
  "title": "senior engineer",
  "company": "Datadog",
  "email": "sarah.chen@datadog.com",
  "phone": "415-555-0142"
}`,
    parseDemo: `// Free text requires regex or NLP to extract fields
// Fragile — breaks when phrasing changes
const nameMatch = text.match(/name is (.+?)\\./);  // ❌ brittle

// JSON mode — direct parse, deterministic keys
const contact = JSON.parse(response);
console.log(contact.name);    // "Sarah Chen"
console.log(contact.email);   // "sarah.chen@datadog.com"
console.log(contact.company); // "Datadog"  ✅ immediate use`,
  },
  {
    id: "classify",
    label: "Multi-Label Classification",
    icon: "🏷",
    prompt: "Classify this support ticket: \"My payment failed but I was still charged. I've tried three times and now I'm locked out of my account. This is urgent.\"",
    freeText: `This support ticket involves multiple issues. The primary concern is a failed payment that still resulted in a charge, which suggests a billing or payment processing error. The customer has also been locked out of their account, likely due to multiple failed authentication attempts triggered by the payment retries. The urgency is explicitly stated.

I would categorize this as both a billing issue and an account access issue, with high priority given the customer's explicit urgency and the potential financial impact.`,
    jsonOutput: `{
  "categories": ["billing", "account-access"],
  "priority": "high",
  "sentiment": "frustrated",
  "requires_escalation": true,
  "key_issues": [
    "payment_charged_but_failed",
    "account_locked"
  ]
}`,
    parseDemo: `// Free text: how do you route this ticket programmatically?
// "I would categorize this as both a billing issue and..."
// → requires NLP just to parse the classification  ❌

// JSON mode: immediate routing logic
const ticket = JSON.parse(response);
if (ticket.requires_escalation) {
  routeToManager(ticket);
}
if (ticket.categories.includes("billing")) {
  notifyBillingTeam(ticket);
}
// priority === "high" → SLA timer starts  ✅`,
  },
  {
    id: "review",
    label: "Code Review Findings",
    icon: "🔍",
    prompt: "Review this code for issues:\n\napp.get('/user/:id', (req, res) => {\n  const query = `SELECT * FROM users WHERE id = ${req.params.id}`;\n  db.execute(query).then(r => res.json(r));\n});",
    freeText: `There are several issues with this code:

First, there's a SQL injection vulnerability. The user ID from the URL parameter is directly interpolated into the SQL query string without any sanitization or parameterization. An attacker could send a malicious ID like "1; DROP TABLE users" to execute arbitrary SQL.

Second, there's no error handling. If the database query fails, the promise rejection is unhandled, which could crash the server or leak error details to the client.

Third, using SELECT * is generally considered bad practice as it returns all columns, potentially including sensitive data that shouldn't be exposed through the API.

I'd recommend using parameterized queries, adding try/catch error handling, and specifying the exact columns needed.`,
    jsonOutput: `{
  "findings": [
    {
      "severity": "critical",
      "type": "sql-injection",
      "line": 2,
      "description": "User input interpolated directly into SQL query",
      "fix": "Use parameterized query: db.execute('SELECT * FROM users WHERE id = ?', [req.params.id])"
    },
    {
      "severity": "high",
      "type": "missing-error-handling",
      "line": 3,
      "description": "Unhandled promise rejection on db.execute failure",
      "fix": "Add .catch() handler or wrap in try/catch with async/await"
    },
    {
      "severity": "medium",
      "type": "over-fetching",
      "line": 2,
      "description": "SELECT * returns all columns including potentially sensitive data",
      "fix": "Specify required columns: SELECT id, name, email FROM users"
    }
  ],
  "summary": {
    "critical": 1,
    "high": 1,
    "medium": 1,
    "low": 0,
    "pass": false
  }
}`,
    parseDemo: `// Free text: how do you block a PR automatically?
// "First, there's a SQL injection vulnerability..."
// → parse severity from prose? Count issues?  ❌

// JSON mode: CI/CD integration in 3 lines
const review = JSON.parse(response);
const hasCritical = review.findings.some(f =>
  f.severity === "critical"
);
if (hasCritical) blockMerge(review.findings);
// summary.pass === false → fail the pipeline  ✅`,
  },
];

function useTypewriter(text: string, speed: number = 8) {
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

export default function StructuredOutputDemo() {
  const [activeScenario, setActiveScenario] = useState("extract");
  const [mode, setMode] = useState<"free" | "json">("free");

  const scenario = SCENARIOS.find((s) => s.id === activeScenario)!;
  const response = mode === "free" ? scenario.freeText : scenario.jsonOutput;
  const { displayed, done } = useTypewriter(response, 6);

  return (
    <div className="my-8 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
      {/* Scenario tabs */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto">
        {SCENARIOS.map((s) => (
          <button key={s.id} onClick={() => { setActiveScenario(s.id); setMode("free"); }}
            className={`flex-1 min-w-[130px] px-4 py-3 text-left transition-all cursor-pointer border-b-2 ${
              activeScenario === s.id ? "border-[var(--accent)] bg-[var(--bg)]" : "border-transparent hover:bg-[var(--bg)]"
            }`}>
            <div className={`text-xs font-bold ${activeScenario === s.id ? "text-[var(--accent)]" : "text-[var(--fg-muted)]"}`}>
              {s.icon} {s.label}
            </div>
          </button>
        ))}
      </div>

      {/* Mode toggle */}
      <div className="px-5 py-3 border-b border-[var(--border)]">
        <div className="flex gap-2">
          <button onClick={() => setMode("free")}
            className={`flex-1 px-4 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              mode === "free" ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--fg-subtle)]"
            }`}>Free Text Mode</button>
          <button onClick={() => setMode("json")}
            className={`flex-1 px-4 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              mode === "json" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--fg-subtle)]"
            }`}>JSON / Structured Mode</button>
        </div>
      </div>

      {/* Prompt */}
      <div className="px-5 py-3 border-b border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-2">Prompt (identical in both modes)</p>
        <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
          <pre className="text-xs font-mono text-[var(--fg)] leading-relaxed whitespace-pre-wrap">{scenario.prompt}</pre>
        </div>
      </div>

      {/* Response + Parse side by side */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)]">Model Output</p>
            {!done && <span className="text-xs text-[var(--accent)] animate-pulse">generating...</span>}
          </div>
          <div className={`rounded-lg border bg-[var(--code-bg)] p-4 min-h-[180px] ${
            mode === "json" ? "border-emerald-500/40" : "border-amber-500/40"
          }`}>
            <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-[var(--fg)]">
              {displayed}
              {!done && <span className="inline-block w-2 h-4 ml-0.5 bg-[var(--accent)] animate-pulse" />}
            </pre>
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-3">Using This in Code</p>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--code-bg)] p-4 min-h-[180px]">
            <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-[var(--fg-muted)]">
              {scenario.parseDemo}
            </pre>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--bg)]">
        <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
          <span className="font-semibold text-[var(--fg)]">Free text is for humans. Structured output is for systems.</span>{" "}
          When LLM output feeds into code — routing tickets, blocking PRs, populating databases — free text requires fragile regex parsing that breaks when phrasing changes. JSON mode constrains the model to output valid structured data with deterministic keys. The information is identical. The usability for downstream systems is not.
        </p>
      </div>
    </div>
  );
}
