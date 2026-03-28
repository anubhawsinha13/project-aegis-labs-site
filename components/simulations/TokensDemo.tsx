"use client";

import { useState, useMemo } from "react";

const COLORS = [
  "bg-blue-500/25 border-blue-500/40 text-blue-300",
  "bg-emerald-500/25 border-emerald-500/40 text-emerald-300",
  "bg-amber-500/25 border-amber-500/40 text-amber-300",
  "bg-purple-500/25 border-purple-500/40 text-purple-300",
  "bg-red-500/25 border-red-500/40 text-red-300",
  "bg-cyan-500/25 border-cyan-500/40 text-cyan-300",
  "bg-pink-500/25 border-pink-500/40 text-pink-300",
  "bg-orange-500/25 border-orange-500/40 text-orange-300",
];

function simpleTokenize(text: string): string[] {
  if (!text) return [];
  const tokens: string[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === " ") {
      tokens.push(" ");
      i++;
      continue;
    }
    if (text[i] === "\n") {
      tokens.push("\n");
      i++;
      continue;
    }
    if (/[^a-zA-Z0-9]/.test(text[i])) {
      tokens.push(text[i]);
      i++;
      continue;
    }
    let word = "";
    while (i < text.length && /[a-zA-Z0-9]/.test(text[i])) {
      word += text[i];
      i++;
    }
    if (word.length <= 4) {
      tokens.push(word);
    } else {
      const chunks: string[] = [];
      for (let j = 0; j < word.length; j += 3 + (j === 0 ? 1 : 0)) {
        const end = j === 0 ? Math.min(j + 4, word.length) : Math.min(j + 3, word.length);
        chunks.push(word.slice(j, end));
        if (j === 0 && end < word.length) j = end - (3 + 1);
      }
      tokens.push(...chunks);
    }
  }
  return tokens;
}

const EXAMPLES = [
  { id: "hello", label: "Hello World", text: "Hello, world!" },
  { id: "sentence", label: "English Sentence", text: "The quick brown fox jumps over the lazy dog." },
  { id: "code", label: "Code Snippet", text: "function calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}" },
  { id: "emoji", label: "With Emojis", text: "I love AI! 🤖🚀 It's transforming how we build software." },
  { id: "multilingual", label: "Multilingual", text: "Hello world. Bonjour le monde. こんにちは世界。" },
];

export default function TokensDemo() {
  const [text, setText] = useState("Hello, world!");
  const [showBytes, setShowBytes] = useState(false);

  const tokens = useMemo(() => simpleTokenize(text), [text]);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const tokenCount = tokens.filter((t) => t !== " " && t !== "\n").length;
  const ratio = wordCount > 0 ? (tokenCount / wordCount).toFixed(2) : "0";

  return (
    <div className="my-8 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
      {/* Presets */}
      <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-[var(--border)]">
        {EXAMPLES.map((ex) => (
          <button key={ex.id} onClick={() => setText(ex.text)}
            className={`px-3 py-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
              text === ex.text
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] font-semibold"
                : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--fg-subtle)]"
            }`}>{ex.label}</button>
        ))}
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-b border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-2">Type anything — watch it tokenise in real time</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-24 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm font-mono text-[var(--fg)] resize-none focus:outline-none focus:border-[var(--accent)]"
          placeholder="Type something..."
        />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 divide-x divide-[var(--border)] border-b border-[var(--border)]">
        {[
          { label: "Characters", value: charCount, color: "text-[var(--fg)]" },
          { label: "Words", value: wordCount, color: "text-blue-400" },
          { label: "Tokens", value: tokenCount, color: "text-emerald-400" },
          { label: "Token/Word Ratio", value: ratio, color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="px-4 py-3 text-center">
            <div className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Token visualisation */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)]">Tokenised Output</p>
          <button onClick={() => setShowBytes(!showBytes)}
            className="text-xs px-3 py-1 rounded-full border border-[var(--border)] text-[var(--fg-muted)] cursor-pointer hover:border-[var(--fg-subtle)] transition-all">
            {showBytes ? "Hide" : "Show"} byte values
          </button>
        </div>
        <div className="flex flex-wrap gap-1 min-h-[50px] rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
          {tokens.length === 0 && <span className="text-sm text-[var(--fg-muted)] italic">empty</span>}
          {tokens.map((token, i) => {
            if (token === " ") return <span key={i} className="w-2" />;
            if (token === "\n") return <span key={i} className="w-full h-0" />;
            const colorClass = COLORS[i % COLORS.length];
            return (
              <span key={i} className={`inline-flex flex-col items-center rounded border px-2 py-1 ${colorClass} transition-all`}>
                <span className="text-sm font-mono">{token}</span>
                {showBytes && (
                  <span className="text-[9px] font-mono opacity-60 mt-0.5">
                    {Array.from(new TextEncoder().encode(token)).map((b) => b.toString(16).padStart(2, "0")).join(" ")}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div className="px-5 py-4 bg-[var(--bg)]">
        <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
          <span className="font-semibold text-[var(--fg)]">LLMs don't see words — they see tokens.</span>{" "}
          Tokens are subword chunks that the model's tokeniser (like BPE) splits text into. Common words stay whole; rare words, code identifiers, and non-English text get split into smaller pieces. This matters because you are billed per token, context windows are measured in tokens, and the model processes each token as an atomic unit. A single emoji might cost multiple tokens; a common English word might be one. Understanding tokenisation is understanding the model's real input.
        </p>
      </div>
    </div>
  );
}
