"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface QueryPair {
  id: string;
  label: string;
  category: "grounded" | "hallucination-prone";
  query: string;
  response: string;
  analysis: { label: string; detail: string; flag: "safe" | "warning" | "danger" }[];
  verdict: "grounded" | "partially-hallucinated" | "fully-hallucinated";
  verdictNote: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const QUERIES: QueryPair[] = [
  {
    id: "python-sort",
    label: "Python sorting",
    category: "grounded",
    query: "How does Python's built-in sort work?",
    response: `Python's built-in sort uses Timsort, a hybrid sorting algorithm derived from merge sort and insertion sort. It was designed by Tim Peters in 2002 for CPython.

Timsort works by identifying pre-sorted subsequences ("runs") in the data and merging them efficiently. Its key characteristics:
- Worst-case time complexity: O(n log n)
- Best-case: O(n) when the data is already partially sorted
- Space complexity: O(n)
- It is a stable sort (preserves relative order of equal elements)

You invoke it with list.sort() for in-place sorting or sorted() for a new list.`,
    analysis: [
      { label: "Timsort attribution", detail: "Tim Peters, 2002, CPython — verifiable", flag: "safe" },
      { label: "Complexity claims", detail: "O(n log n) worst, O(n) best, O(n) space — correct", flag: "safe" },
      { label: "Stability claim", detail: "Timsort is stable — correct and documented in CPython source", flag: "safe" },
      { label: "API names", detail: "list.sort() and sorted() — correct Python API", flag: "safe" },
    ],
    verdict: "grounded",
    verdictNote: "Well-covered in training data. Thousands of Stack Overflow answers, CPython documentation, and textbooks confirm every claim.",
  },
  {
    id: "obscure-lib",
    label: "Obscure library",
    category: "hallucination-prone",
    query: "What are the main features of the Python library 'fastql' version 3.2?",
    response: `FastQL 3.2 is a Python library designed for high-performance GraphQL query execution. Its main features include:

- **Async-first architecture**: Built on asyncio with native support for concurrent query resolution
- **Schema stitching**: Combine multiple GraphQL schemas into a unified API layer
- **Automatic batching**: Uses DataLoader-style batching to minimize N+1 query problems
- **Type-safe resolvers**: Leverages Python type hints for automatic input validation
- **Built-in caching**: LRU cache for resolved fields with configurable TTL

It was created by Elena Marchetti at PyCon 2023 and is widely used in production at several European fintech companies.`,
    analysis: [
      { label: "Library existence", detail: "'fastql' with these features — not verifiable as a real package on PyPI", flag: "danger" },
      { label: "Version 3.2 features", detail: "Plausible-sounding feature list, but may be invented from patterns of similar libraries", flag: "danger" },
      { label: "Creator attribution", detail: "\"Elena Marchetti at PyCon 2023\" — fabricated biographical detail with high confidence phrasing", flag: "danger" },
      { label: "Usage claim", detail: "\"widely used in production\" — unverifiable and likely false", flag: "danger" },
    ],
    verdict: "fully-hallucinated",
    verdictNote: "The model has no reliable training data for this specific library/version. Instead of saying \"I don't know,\" it generated a plausible-sounding response by combining patterns from real GraphQL libraries. Every concrete detail may be fabricated.",
  },
  {
    id: "history",
    label: "Historical fact",
    category: "grounded",
    query: "When was the first email sent?",
    response: `The first network email was sent in 1971 by Ray Tomlinson, an engineer working on ARPANET. He is credited with introducing the @ symbol to separate user names from computer names in email addresses.

The exact content of the first message is unknown — Tomlinson later described it as something forgettable like "QWERTYUIOP" or a similar test string. The message was sent between two PDP-10 computers that were physically side by side, connected through ARPANET.`,
    analysis: [
      { label: "Date (1971)", detail: "Widely accepted — consistent with ARPANET history sources", flag: "safe" },
      { label: "Ray Tomlinson", detail: "Correct attribution — credited by multiple sources including Internet Hall of Fame", flag: "safe" },
      { label: "@ symbol claim", detail: "Correct — he chose @ for email addressing", flag: "safe" },
      { label: "Message content unknown", detail: "Honest uncertainty — Tomlinson himself said he didn't remember. Accuracy flag: safe", flag: "safe" },
    ],
    verdict: "grounded",
    verdictNote: "Well-documented historical event with extensive coverage in training data. The model correctly acknowledges uncertainty about the exact message content rather than fabricating it.",
  },
  {
    id: "fake-paper",
    label: "Fake research paper",
    category: "hallucination-prone",
    query: "Summarise the findings of the 2024 paper 'Recursive Attention Collapse in Deep Transformer Stacks' by Zhang et al.",
    response: `Zhang et al. (2024) examined a phenomenon they term "recursive attention collapse" (RAC) in transformer architectures with more than 48 layers. Their key findings:

1. **Attention entropy decay**: Beyond layer 40, attention heads increasingly converge to near-uniform distributions, effectively losing their discriminative capacity.

2. **The "echo chamber" effect**: In deep stacks, layers 32-48 begin replicating attention patterns from layers 8-16, creating redundant computation without additional representational power.

3. **Mitigation through skip-layer normalization**: The authors propose a modified LayerNorm that conditions on a running average of attention entropy, restoring head diversity in deep networks.

The paper was published at NeurIPS 2024 and received the Outstanding Paper award. The authors are affiliated with Tsinghua University and Google DeepMind.`,
    analysis: [
      { label: "Paper existence", detail: "This specific paper title and authors — not verifiable, likely fabricated", flag: "danger" },
      { label: "Technical claims", detail: "\"Recursive attention collapse\" sounds plausible but may be invented terminology", flag: "warning" },
      { label: "Specific findings", detail: "Layer numbers (40, 32-48, 8-16) and \"echo chamber effect\" — fabricated specifics", flag: "danger" },
      { label: "Publication venue", detail: "\"NeurIPS 2024 Outstanding Paper\" — fabricated award claim", flag: "danger" },
      { label: "Author affiliations", detail: "\"Tsinghua + DeepMind\" — plausible but likely invented", flag: "danger" },
    ],
    verdict: "fully-hallucinated",
    verdictNote: "The model generates a convincing academic summary because it has seen thousands of ML paper summaries during training. The fabricated paper has a plausible title, plausible findings, and plausible affiliations — but none of it can be verified. This is the most dangerous form of hallucination: confident, detailed, and wrong.",
  },
  {
    id: "mixed",
    label: "Recent event + detail",
    category: "hallucination-prone",
    query: "What exactly did Sam Altman say in his keynote at the OpenAI DevDay on October 17, 2024?",
    response: `At the October 2024 OpenAI DevDay, Sam Altman discussed several major announcements:

- The launch of the "Realtime API" for building voice-enabled AI applications
- A new model distillation feature allowing developers to create smaller, task-specific models from GPT-4o
- Vision fine-tuning capabilities for GPT-4o
- A new "Prompt Caching" feature for reduced API costs on repeated prefixes

He opened with remarks about the pace of AI progress, noting that what took a year of work in 2023 could now be accomplished in weeks. He also emphasized OpenAI's commitment to making their API more affordable and accessible to developers.`,
    analysis: [
      { label: "Event existence", detail: "OpenAI DevDay October 2024 — real event", flag: "safe" },
      { label: "Realtime API", detail: "Actually announced at DevDay 2024 — correct", flag: "safe" },
      { label: "Model distillation", detail: "Was discussed — likely correct", flag: "safe" },
      { label: "Exact quotes and phrasing", detail: "\"what took a year... in weeks\" — possibly paraphrased or fabricated", flag: "warning" },
      { label: "Specific details", detail: "Opening remarks phrasing and commitment statements — may be reconstructed, not recalled", flag: "warning" },
    ],
    verdict: "partially-hallucinated",
    verdictNote: "The broad facts are correct — the event happened and these products were announced. But the specific phrasing attributed to Altman and the exact sequence of remarks may be reconstructed from the model's general knowledge rather than recalled from a specific transcript. This partial hallucination is subtle and harder to catch than full fabrication.",
  },
];

// ─── Typewriter ──────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function HallucinationDemo() {
  const [activeQuery, setActiveQuery] = useState("python-sort");
  const [showAnalysis, setShowAnalysis] = useState(false);

  const query = QUERIES.find((q) => q.id === activeQuery)!;
  const { displayed, done } = useTypewriter(query.response, 6);

  useEffect(() => { setShowAnalysis(false); }, [activeQuery]);

  const verdictColor: Record<string, { bg: string; text: string; border: string }> = {
    "grounded":               { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/40" },
    "partially-hallucinated": { bg: "bg-amber-500/15",   text: "text-amber-300",   border: "border-amber-500/40" },
    "fully-hallucinated":     { bg: "bg-red-500/15",     text: "text-red-300",     border: "border-red-500/40" },
  };
  const flagColor: Record<string, string> = {
    safe: "text-emerald-400",
    warning: "text-amber-400",
    danger: "text-red-400",
  };
  const flagIcon: Record<string, string> = { safe: "✓", warning: "⚠", danger: "✗" };
  const vc = verdictColor[query.verdict];

  return (
    <div className="my-8 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">

      {/* Query selector */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-3">
          Select a Query
        </p>
        <div className="flex flex-wrap gap-2">
          {QUERIES.map((q) => (
            <button
              key={q.id}
              onClick={() => setActiveQuery(q.id)}
              className={`px-3 py-2 rounded-lg border text-xs transition-all cursor-pointer ${
                activeQuery === q.id
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] font-semibold"
                  : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--fg-subtle)]"
              }`}
            >
              {q.label}
              <span className={`ml-1.5 text-xs ${q.category === "grounded" ? "text-emerald-400" : "text-red-400"}`}>
                {q.category === "grounded" ? "●" : "●"}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-[var(--fg-muted)]">
          <span><span className="text-emerald-400">●</span> Likely grounded</span>
          <span><span className="text-red-400">●</span> Hallucination-prone</span>
        </div>
      </div>

      {/* Query + Response */}
      <div className="p-5 border-b border-[var(--border)]">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 mb-3">
          <p className="text-xs text-[var(--fg-muted)] mb-1 font-semibold">User:</p>
          <p className="text-sm text-[var(--fg)] font-medium">{query.query}</p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 min-h-[160px]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[var(--fg-muted)] font-semibold">Model:</p>
            {!done && <span className="text-xs text-[var(--accent)] animate-pulse">generating...</span>}
          </div>
          <pre className="text-sm font-sans leading-relaxed whitespace-pre-wrap text-[var(--fg)]">
            {displayed}
            {!done && <span className="inline-block w-2 h-4 ml-0.5 bg-[var(--accent)] animate-pulse" />}
          </pre>
        </div>
      </div>

      {/* Reveal analysis button */}
      {done && !showAnalysis && (
        <div className="px-5 py-4 flex justify-center">
          <button
            onClick={() => setShowAnalysis(true)}
            className="px-5 py-2.5 rounded-lg border border-[var(--accent)] text-[var(--accent)] text-sm font-semibold hover:bg-[var(--accent)]/10 transition-all cursor-pointer"
          >
            Analyse This Response — What's Real?
          </button>
        </div>
      )}

      {/* Analysis panel */}
      {showAnalysis && (
        <div className="p-5 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-3">
            Claim-by-Claim Analysis
          </p>
          <div className="space-y-2 mb-4">
            {query.analysis.map((a, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className={`mt-0.5 text-sm flex-shrink-0 ${flagColor[a.flag]}`}>{flagIcon[a.flag]}</span>
                <div>
                  <span className={`text-xs font-semibold ${flagColor[a.flag]}`}>{a.label}</span>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5 leading-snug">{a.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Verdict */}
          <div className={`rounded-lg p-4 ${vc.bg} border ${vc.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${vc.text}`}>
                Verdict: {query.verdict.replace("-", " ")}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--fg-muted)]">{query.verdictNote}</p>
          </div>
        </div>
      )}

      {/* Insight */}
      <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--bg)]">
        <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
          <span className="font-semibold text-[var(--fg)]">Hallucination triggers:</span>{" "}
          Niche libraries, specific version numbers, exact quotes, named individuals, recent events, and academic paper citations. The model is most dangerous when the question is specific enough to demand concrete details but obscure enough that training data is sparse — it fills the gap with statistically plausible fabrication rather than admitting uncertainty.
        </p>
      </div>
    </div>
  );
}
