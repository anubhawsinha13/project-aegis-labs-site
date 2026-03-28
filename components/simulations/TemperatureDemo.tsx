"use client";

import { useState, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaskType {
  id: string;
  label: string;
  icon: string;
  optimalMin: number;
  optimalMax: number;
  description: string;
  outputs: Record<string, string>; // temperature zone → example output
  tokens: { text: string; logit: number }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function softmax(logits: number[], temperature: number): number[] {
  const t = Math.max(temperature, 0.01);
  const scaled = logits.map((l) => l / t);
  const maxVal = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - maxVal));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function getTempZone(t: number): "frozen" | "cool" | "warm" | "hot" | "molten" {
  if (t <= 0.2) return "frozen";
  if (t <= 0.5) return "cool";
  if (t <= 0.9) return "warm";
  if (t <= 1.4) return "hot";
  return "molten";
}

const ZONE_META: Record<string, { label: string; color: string; textColor: string; border: string; bg: string; desc: string }> = {
  frozen:  { label: "Greedy / Frozen",  color: "bg-blue-500",   textColor: "text-blue-400",   border: "border-blue-500/50",   bg: "bg-blue-500/10",   desc: "Always picks the highest-probability token. Deterministic." },
  cool:    { label: "Low / Precise",    color: "bg-cyan-500",   textColor: "text-cyan-400",   border: "border-cyan-500/50",   bg: "bg-cyan-500/10",   desc: "Strongly favours likely tokens. Minimal variation." },
  warm:    { label: "Balanced",         color: "bg-emerald-500",textColor: "text-emerald-400",border: "border-emerald-500/50",bg: "bg-emerald-500/10","desc": "Natural-feeling outputs. Best for most production use." },
  hot:     { label: "Creative",         color: "bg-amber-500",  textColor: "text-amber-400",  border: "border-amber-500/50",  bg: "bg-amber-500/10",  desc: "Broader exploration. Good for brainstorming and ideation." },
  molten:  { label: "High / Chaotic",   color: "bg-red-500",    textColor: "text-red-400",    border: "border-red-500/50",    bg: "bg-red-500/10",    desc: "Distribution nearly flat. High creativity, high error risk." },
};

// ─── Task data ────────────────────────────────────────────────────────────────

const TASKS: TaskType[] = [
  {
    id: "code",
    label: "Code Generation",
    icon: "💻",
    optimalMin: 0.0,
    optimalMax: 0.4,
    description: "Syntax must be correct. Variance is a bug.",
    tokens: [
      { text: "return", logit: 3.8 },
      { text: "result", logit: 2.4 },
      { text: "output", logit: 1.6 },
      { text: "value",  logit: 1.1 },
      { text: "data",   logit: 0.5 },
      { text: "final",  logit: -0.2 },
    ],
    outputs: {
      frozen:  "def validate_email(email):\n    import re\n    pattern = r'^[\\w.-]+@[\\w.-]+\\.\\w+$'\n    return bool(re.match(pattern, email))\n\n# Identical every run. No surprises.",
      cool:    "def validate_email(email: str) -> bool:\n    import re\n    # Occasionally varies: email_pattern vs pattern\n    email_pattern = r'^[\\w.+-]+@[\\w-]+\\.[\\w.]+$'\n    return re.match(email_pattern, email) is not None",
      warm:    "def validate_email(email):\n    # May switch between regex and string methods\n    if '@' not in email or email.count('@') != 1:\n        return False\n    local, domain = email.split('@')\n    return bool(local) and '.' in domain",
      hot:     "def validate_email(email):\n    # Starts exploring unusual approaches\n    try:\n        from email.utils import parseaddr\n        name, addr = parseaddr(email)\n        return '@' in addr and addr != email.strip()\n    except Exception:\n        return False",
      molten:  "# ⚠ Risky — may produce broken code\ndef validate_email(e):\n    # Unexpected: uses DNS lookup, may timeout\n    import socket\n    domain = e.split('@')[-1] if '@' in e else ''\n    try: socket.gethostbyname(domain); return True\n    except: return len(e) > 5  # fallback logic (?)",
    },
  },
  {
    id: "classification",
    label: "Classification",
    icon: "🏷",
    optimalMin: 0.0,
    optimalMax: 0.3,
    description: "Identical inputs must produce identical labels.",
    tokens: [
      { text: "Positive", logit: 4.1 },
      { text: "Neutral",  logit: 1.8 },
      { text: "Negative", logit: 0.9 },
      { text: "Mixed",    logit: 0.3 },
      { text: "Unclear",  logit: -0.5 },
      { text: "N/A",      logit: -1.2 },
    ],
    outputs: {
      frozen:  'Input: "This product exceeded my expectations."\n\nLabel: Positive\nConfidence: 0.97\n\n// Runs 1000x — identical every time.\n// Essential for A/B testing and audit trails.',
      cool:    'Input: "This product exceeded my expectations."\n\nLabel: Positive\n\n// Stable across runs. Rare: may output\n// "Very Positive" vs "Positive" on edge cases.',
      warm:    'Input: "This product exceeded my expectations."\n\nLabel: Positive\nReasoning: Strong positive sentiment indicated\nby "exceeded expectations".\n\n// Adds explanation. Occasional label drift\n// on ambiguous inputs.',
      hot:     'Input: "This product exceeded my expectations."\n\nLabel: Positive (with nuance)\nNote: Could be interpreted as satisfaction\nor implied prior low expectations.\n\n// Over-explains. Label inconsistency rises.',
      molten:  '⚠ Input: "This product exceeded my expectations."\n\nLabel: Transformative\nContext: The phrase suggests a paradigm\nshift in consumer expectation frameworks...\n\n// Invented categories. Unreliable for prod.',
    },
  },
  {
    id: "chat",
    label: "Chatbot / Conversation",
    icon: "💬",
    optimalMin: 0.6,
    optimalMax: 0.9,
    description: "Natural variation. Avoid robotic repetition.",
    tokens: [
      { text: "Sure",     logit: 2.9 },
      { text: "Absolutely",logit: 2.4 },
      { text: "Of",       logit: 2.1 },
      { text: "Happy",    logit: 1.7 },
      { text: "Great",    logit: 1.3 },
      { text: "Certainly",logit: 0.8 },
    ],
    outputs: {
      frozen:  'User: "Can you help me plan a trip to Japan?"\n\nBot: "Sure, I can help you plan a trip to Japan. What dates are you considering?"\n\n// Every user gets this exact response.\n// Feels scripted after the second conversation.',
      cool:    'User: "Can you help me plan a trip to Japan?"\n\nBot: "Absolutely! Japan is a fantastic destination. To get started, could you tell me when you\'re planning to go and what interests you most — cities, nature, or cuisine?"\n\n// Natural but slightly repetitive over time.',
      warm:    'User: "Can you help me plan a trip to Japan?"\n\nBot: "Of course — Japan has something for everyone. Are you drawn more to Tokyo\'s energy, Kyoto\'s temples, or would you like a mix? And how long are you thinking?"\n\n// Feels genuinely conversational. ✓ Production sweet spot.',
      hot:     'User: "Can you help me plan a trip to Japan?"\n\nBot: "Japan! Great choice. One underrated approach: build your itinerary around a seasonal event — cherry blossom in April, the Gion Matsuri in July. What time of year works for you?"\n\n// More personality. Good for travel or lifestyle bots.',
      molten:  'User: "Can you help me plan a trip to Japan?"\n\nBot: "Japan\'s layered history makes itinerary planning philosophically rich — the tension between Edo-period aesthetics and hyper-modern Shibuya creates a dialectic that your travel choices can engage with directly..."\n\n// ⚠ Derailed. Not useful for support contexts.',
    },
  },
  {
    id: "creative",
    label: "Creative Writing",
    icon: "✍️",
    optimalMin: 1.0,
    optimalMax: 1.5,
    description: "Novel combinations matter more than reliability.",
    tokens: [
      { text: "darkness",  logit: 2.2 },
      { text: "silence",   logit: 2.0 },
      { text: "light",     logit: 1.8 },
      { text: "shadows",   logit: 1.5 },
      { text: "echoes",    logit: 1.1 },
      { text: "fractures", logit: 0.6 },
    ],
    outputs: {
      frozen:  '"The darkness fell across the city like a curtain. The streets were empty. She walked alone."\n\n// Grammatically fine. Statistically average.\n// Every writer in the training set wrote this sentence.',
      cool:    '"The city went quiet in the way that cities only do just before something breaks. She kept walking, hands in pockets, watching the shadows pool at the base of the streetlights."\n\n// Better. Still safe. Avoids cliché but predictable structure.',
      warm:    '"Three blocks from the hotel, she noticed the silence had texture — not the absence of sound, but something laid over it, deliberate, like a hand pressed flat against a window."\n\n// Interesting imagery. Feels authored. Good starting point.',
      hot:     '"The city folded itself up around midnight the way origami does: visible geometry in the creases, intention in the collapse. She had twelve minutes before the first train and a sentence she couldn\'t finish."\n\n// Unexpected metaphor. Might need editing. Worth the exploration.',
      molten:  '"Luminous fractures — the echoic dark pressed against her temporal concerns like syntax refusing metaphor, city-geometry cascading through the threshold of forgotten angles—"\n\n// ⚠ Interesting fragments but loses coherence.\n// Useful for harvesting phrases, not full prose.',
    },
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function TemperatureDemo() {
  const [temperature, setTemperature] = useState(0.7);
  const [activeTask, setActiveTask] = useState("chat");

  const task = TASKS.find((t) => t.id === activeTask)!;
  const zone = getTempZone(temperature);
  const meta = ZONE_META[zone];
  const probs = useMemo(
    () => softmax(task.tokens.map((t) => t.logit), temperature),
    [temperature, activeTask]
  );

  const isOptimal =
    temperature >= task.optimalMin && temperature <= task.optimalMax;

  return (
    <div className="my-8 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">

      {/* Task selector */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto">
        {TASKS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTask(t.id)}
            className={`flex-1 min-w-[110px] px-4 py-3 text-left transition-all cursor-pointer border-b-2 ${
              activeTask === t.id
                ? "border-[var(--accent)] bg-[var(--bg)]"
                : "border-transparent hover:bg-[var(--bg)]"
            }`}
          >
            <div className={`text-xs font-bold ${activeTask === t.id ? "text-[var(--accent)]" : "text-[var(--fg-muted)]"}`}>
              {t.icon} {t.label}
            </div>
            <div className="text-xs text-[var(--fg-muted)] mt-0.5 hidden sm:block leading-tight">
              {t.description}
            </div>
          </button>
        ))}
      </div>

      {/* Temperature slider */}
      <div className={`px-5 py-4 border-b border-[var(--border)] ${meta.bg} transition-all duration-300`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className={`text-sm font-bold ${meta.textColor}`}>{meta.label}</span>
            <span className="text-xs text-[var(--fg-muted)] ml-2">{meta.desc}</span>
          </div>
          <div className={`text-lg font-mono font-bold ${meta.textColor}`}>
            {temperature.toFixed(1)}
          </div>
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              #3b82f6 0%,
              #06b6d4 10%,
              #10b981 35%,
              #f59e0b 60%,
              #ef4444 100%)`,
          }}
        />

        {/* Scale labels */}
        <div className="flex justify-between mt-1.5 text-xs text-[var(--fg-muted)] font-mono">
          <span>0.0 Greedy</span>
          <span>0.5</span>
          <span>1.0</span>
          <span>1.5</span>
          <span>2.0 Chaos</span>
        </div>

        {/* Optimal range indicator */}
        <div className={`mt-3 px-3 py-2 rounded-md text-xs border transition-all duration-300 ${
          isOptimal
            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
            : "bg-[var(--bg)] border-[var(--border)] text-[var(--fg-muted)]"
        }`}>
          {isOptimal
            ? `✓ Optimal range for ${task.label}: ${task.optimalMin}–${task.optimalMax}`
            : `Recommended range for ${task.label}: ${task.optimalMin}–${task.optimalMax} — current: ${temperature.toFixed(1)}`}
        </div>
      </div>

      {/* Main panels */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">

        {/* Left: Probability distribution */}
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-4">
            Token Probability Distribution
          </p>
          <div className="space-y-3">
            {task.tokens.map((tok, i) => {
              const pct = probs[i] * 100;
              return (
                <div key={tok.text}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-[var(--fg)]">{tok.text}</span>
                    <span className={`text-xs font-mono font-semibold ${meta.textColor}`}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-[var(--bg)] rounded-full border border-[var(--border)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${meta.color}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-[var(--fg-muted)] leading-relaxed">
            Logits are divided by temperature before softmax. Lower temperature sharpens the distribution (top token dominates). Higher temperature flattens it (all tokens become more equally likely).
          </p>
        </div>

        {/* Right: Example output */}
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-4">
            Example Output at {temperature.toFixed(1)}
          </p>
          <div className={`rounded-lg border ${meta.border} overflow-hidden`}>
            <div className={`px-3 py-2 border-b ${meta.border} flex items-center justify-between`}>
              <span className={`text-xs font-mono font-semibold ${meta.textColor}`}>
                temperature = {temperature.toFixed(1)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${meta.bg} ${meta.textColor} border ${meta.border}`}>
                {meta.label}
              </span>
            </div>
            <pre className={`p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto ${meta.bg} text-[var(--fg-muted)]`}>
              {task.outputs[zone]}
            </pre>
          </div>
        </div>
      </div>

      {/* Bottom: quick reference */}
      <div className="border-t border-[var(--border)] px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-3">
          Quick Reference
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(Object.entries(ZONE_META) as [string, typeof ZONE_META[string]][]).map(([key, z]) => (
            <button
              key={key}
              onClick={() => {
                const midpoints: Record<string, number> = { frozen: 0.0, cool: 0.3, warm: 0.7, hot: 1.2, molten: 1.8 };
                setTemperature(midpoints[key]);
              }}
              className={`px-3 py-2 rounded-md border text-xs text-left cursor-pointer transition-all ${
                zone === key ? `${z.border} ${z.bg}` : "border-[var(--border)] hover:bg-[var(--bg)]"
              }`}
            >
              <div className={`font-semibold ${z.textColor} mb-0.5`}>{z.label}</div>
              <div className="text-[var(--fg-muted)] leading-tight">
                {key === "frozen" && "0.0 — Classification, legal, finance"}
                {key === "cool" && "0.1–0.5 — Code, extraction, SQL"}
                {key === "warm" && "0.5–0.9 — Chat, docs, general code"}
                {key === "hot" && "1.0–1.4 — Brainstorm, ideation"}
                {key === "molten" && "1.5–2.0 — Experimental only"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
