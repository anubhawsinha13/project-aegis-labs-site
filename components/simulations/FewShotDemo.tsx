"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExamplePair {
  input: string;
  output: string;
}

interface TaskScenario {
  id: string;
  label: string;
  icon: string;
  instruction: string;
  examples: ExamplePair[];
  testInput: string;
  responses: string[]; // index = number of examples given (0 = zero-shot, 1 = one-shot, etc.)
}

// ─── Data ────────────────────────────────────────────────────────────────────

const SCENARIOS: TaskScenario[] = [
  {
    id: "sentiment",
    label: "Sentiment Labels",
    icon: "🏷",
    instruction: "Classify the sentiment of the following text.",
    examples: [
      { input: "The battery life on this phone is incredible, lasts two full days.", output: "Positive" },
      { input: "Shipping took three weeks and the box arrived damaged.", output: "Negative" },
      { input: "It works as described. Nothing special, nothing wrong.", output: "Neutral" },
    ],
    testInput: "The camera quality is amazing but the software is buggy and crashes often.",
    responses: [
      `The sentiment of this text is somewhat mixed. On one hand, the user expresses positive feelings about the camera quality ("amazing"), while on the other hand they express frustration with the software being "buggy" and crashing. Overall, I would characterize this as having both positive and negative elements, leaning slightly negative due to the reliability concerns...

(Note: No consistent label format. The model rambles because it has no template to match.)`,
      `Positive

(Note: With one example, the model learned "output a single word" but only saw a positive example — it defaults to the only label it was shown.)`,
      `Mixed

(Note: After seeing both Positive and Negative examples, the model now knows the label vocabulary and correctly identifies mixed sentiment. But "Mixed" wasn't in the examples — it inferred the pattern.)`,
      `Mixed

(Note: Three examples established the full label set. The model confidently outputs a single label matching the format exactly. If you need "Mixed" as a label, add it as a fourth example.)`,
    ],
  },
  {
    id: "json",
    label: "JSON Extraction",
    icon: "📦",
    instruction: "Extract structured data from the following text.",
    examples: [
      { input: "John Smith, age 34, works at Google as a senior engineer.", output: '{"name": "John Smith", "age": 34, "company": "Google", "role": "senior engineer"}' },
      { input: "Maria Garcia is a 28-year-old product manager at Stripe.", output: '{"name": "Maria Garcia", "age": 28, "company": "Stripe", "role": "product manager"}' },
      { input: "45-year-old CTO David Park joined Meta last March.", output: '{"name": "David Park", "age": 45, "company": "Meta", "role": "CTO"}' },
    ],
    testInput: "Senior data scientist Alice Chen, 31, recently moved to Anthropic from DeepMind.",
    responses: [
      `From the text, I can extract the following information:
- Name: Alice Chen
- Age: 31
- Current company: Anthropic
- Previous company: DeepMind
- Role: Senior data scientist

She recently transitioned between two major AI research organisations...

(Note: Correct information, but free-text format. Not parseable. You'd need post-processing to use this.)`,
      `{"name": "Alice Chen", "age": 31, "company": "Anthropic", "role": "Senior data scientist"}

(Note: One example was enough to snap the output into JSON. The model matched the exact key names and structure from the single example.)`,
      `{"name": "Alice Chen", "age": 31, "company": "Anthropic", "role": "senior data scientist"}

(Note: Two examples reinforced the pattern. Notice "senior" is now lowercase — the model learned the casing convention from the examples, not just the structure.)`,
      `{"name": "Alice Chen", "age": 31, "company": "Anthropic", "role": "senior data scientist"}

(Note: Rock solid. Three examples make the format virtually deterministic. The model will reproduce this schema reliably across thousands of inputs.)`,
    ],
  },
  {
    id: "sql",
    label: "Natural Language → SQL",
    icon: "🗄",
    instruction: "Convert the following natural language query to SQL.",
    examples: [
      { input: "Show me all active users who signed up this year", output: "SELECT * FROM users WHERE status = 'active' AND created_at >= '2026-01-01';" },
      { input: "How many orders were placed last month?", output: "SELECT COUNT(*) FROM orders WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND order_date < DATE_TRUNC('month', CURRENT_DATE);" },
      { input: "Find the top 5 customers by total spend", output: "SELECT customer_id, SUM(amount) AS total_spend FROM orders GROUP BY customer_id ORDER BY total_spend DESC LIMIT 5;" },
    ],
    testInput: "Show me the average order value per country for the last 90 days",
    responses: [
      `To find the average order value per country for the last 90 days, you would need to join the orders table with a customers or addresses table that contains country information. Here's a general approach:

First, identify the relevant tables...
Then join them on the appropriate foreign key...
Filter by date range...
Group by country and calculate the average...

Would you like me to write the actual SQL? I'd need to know your schema.

(Note: Explains the approach but doesn't write SQL. No format to follow.)`,
      `SELECT country, AVG(amount) AS avg_order_value FROM orders WHERE order_date >= CURRENT_DATE - INTERVAL '90 days' GROUP BY country;

(Note: Writes SQL immediately. One example taught it "output SQL, not explanation." Assumes column names from the example pattern.)`,
      `SELECT c.country, AVG(o.amount) AS avg_order_value
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY c.country
ORDER BY avg_order_value DESC;

(Note: Two examples taught it to use proper joins and formatting. Added ORDER BY because example 2 showed filtered aggregations. More production-ready.)`,
      `SELECT c.country, AVG(o.amount) AS avg_order_value
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY c.country
ORDER BY avg_order_value DESC;

(Note: Three examples established the full pattern: aliased joins, descriptive column aliases, sensible ordering. The output is now reliably production-quality SQL.)`,
    ],
  },
];

// ─── Typewriter ──────────────────────────────────────────────────────────────

function useTypewriter(text: string, speed: number = 10) {
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function FewShotDemo() {
  const [activeScenario, setActiveScenario] = useState("sentiment");
  const [exampleCount, setExampleCount] = useState(0);

  const scenario = SCENARIOS.find((s) => s.id === activeScenario)!;
  const visibleExamples = scenario.examples.slice(0, exampleCount);
  const response = scenario.responses[exampleCount];
  const { displayed, done } = useTypewriter(response, 6);

  const shotLabel = exampleCount === 0 ? "Zero-shot" : exampleCount === 1 ? "One-shot" : `${exampleCount}-shot`;

  return (
    <div className="my-8 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">

      {/* Scenario tabs */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => { setActiveScenario(s.id); setExampleCount(0); }}
            className={`flex-1 min-w-[120px] px-4 py-3 text-left transition-all cursor-pointer border-b-2 ${
              activeScenario === s.id
                ? "border-[var(--accent)] bg-[var(--bg)]"
                : "border-transparent hover:bg-[var(--bg)]"
            }`}
          >
            <div className={`text-xs font-bold ${activeScenario === s.id ? "text-[var(--accent)]" : "text-[var(--fg-muted)]"}`}>
              {s.icon} {s.label}
            </div>
          </button>
        ))}
      </div>

      {/* Example count control */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)]">
            Examples in Prompt
          </p>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
            exampleCount === 0
              ? "bg-red-500/20 text-red-300 border border-red-500/30"
              : exampleCount === 1
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : exampleCount === 2
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          }`}>
            {shotLabel}
          </span>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => setExampleCount(n)}
              className={`flex-1 px-3 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                exampleCount === n
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--fg-subtle)]"
              }`}
            >
              {n === 0 ? "Zero" : n} {n === 1 ? "example" : "examples"}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt construction */}
      <div className="p-5 border-b border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-3">Prompt Sent to Model</p>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
          {/* System instruction */}
          <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--code-bg)]">
            <span className="text-xs font-mono text-[var(--fg-muted)]">{scenario.instruction}</span>
          </div>

          {/* Examples */}
          {visibleExamples.map((ex, i) => (
            <div key={i} className="px-4 py-2.5 border-b border-[var(--border)] bg-emerald-500/5">
              <div className="text-xs text-[var(--fg-muted)] mb-1">
                <span className="font-semibold text-emerald-400">Example {i + 1}:</span>
              </div>
              <div className="text-xs font-mono text-[var(--fg)] mb-1">Input: {ex.input}</div>
              <div className="text-xs font-mono text-emerald-400">Output: {ex.output}</div>
            </div>
          ))}

          {/* Test input */}
          <div className="px-4 py-2.5 bg-amber-500/5">
            <div className="text-xs text-[var(--fg-muted)] mb-1">
              <span className="font-semibold text-amber-400">Now classify:</span>
            </div>
            <div className="text-xs font-mono text-[var(--fg)]">{scenario.testInput}</div>
          </div>
        </div>
      </div>

      {/* Response */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)]">Model Output</p>
          {!done && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 animate-pulse">
              generating...
            </span>
          )}
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 min-h-[140px]">
          <pre className="text-sm font-sans leading-relaxed whitespace-pre-wrap text-[var(--fg)]">
            {displayed}
            {!done && <span className="inline-block w-2 h-4 ml-0.5 bg-[var(--accent)] animate-pulse" />}
          </pre>
        </div>
      </div>

      {/* Insight */}
      <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--bg)]">
        <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
          <span className="font-semibold text-[var(--fg)]">Examples teach format, not knowledge.</span>{" "}
          The model already knows about sentiment, JSON, and SQL. The examples do not add information — they constrain the output distribution. Zero-shot leaves the model to choose its own format. One-shot snaps the output to the demonstrated structure. Three-shot makes it nearly deterministic. The value of few-shot prompting is format control, not knowledge injection.
        </p>
      </div>
    </div>
  );
}
