"use client";

import { useState, useCallback } from "react";

const TOKEN_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-orange-500",
];

// Simple BPE-style tokenizer approximation (no WASM needed)
// Simulates GPT-4 tokenization patterns for demo purposes
function tokenize(text: string): Array<{ text: string; id: number }> {
  if (!text.trim()) return [];

  // Common GPT token patterns: words, subwords, punctuation
  const tokens: Array<{ text: string; id: number }> = [];
  // Split on word boundaries while preserving spaces
  const parts = text.match(/\s*\S+|\s+/g) || [];

  let baseId = 1000;
  for (const part of parts) {
    const word = part.trimStart();
    const space = part.startsWith(" ") ? " " : "";
    if (!word) continue;

    // Simulate subword splitting for long/uncommon words
    if (word.length > 8) {
      // Break into subword chunks of ~4 chars
      let remaining = word;
      let first = true;
      while (remaining.length > 0) {
        const chunk = remaining.slice(0, 4);
        remaining = remaining.slice(4);
        tokens.push({ text: (first && space ? space : "") + chunk, id: (baseId += 17) });
        first = false;
      }
    } else {
      tokens.push({ text: space + word, id: (baseId += 13) });
    }
  }
  return tokens;
}

const EXAMPLES = [
  { label: "antidisestablishmentarianism", value: "antidisestablishmentarianism" },
  { label: "AI", value: "AI" },
  { label: "ChatGPT", value: "ChatGPT" },
  { label: "The quick brown fox", value: "The quick brown fox jumps over the lazy dog" },
];

const MAX_TOKENS = 4096;

export default function TokenizerDemo() {
  const [text, setText] = useState("The quick brown fox jumps");

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  const tokens = tokenize(text);
  const count = tokens.length;
  const fillPercent = Math.min(100, (count / MAX_TOKENS) * 100);

  return (
    <div className="sim-block not-prose">
      <div className="sim-label">Try it yourself</div>

      <textarea
        value={text}
        onChange={handleChange}
        rows={3}
        placeholder="Type any text to tokenize it..."
        className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--fg)] resize-none focus:outline-none focus:border-[var(--accent)] font-mono"
      />

      {/* Token blocks */}
      {tokens.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tokens.map((tok, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span
                className={`px-2 py-1 rounded text-white text-sm font-mono whitespace-pre ${TOKEN_COLORS[i % TOKEN_COLORS.length]}`}
              >
                {tok.text}
              </span>
              <span className="text-[9px] text-[var(--fg-subtle)] font-mono">{tok.id}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-3 flex items-center justify-between text-xs text-[var(--fg-muted)]">
        <span>
          <strong className="text-[var(--fg)]">{count}</strong> token{count !== 1 ? "s" : ""}
          {count > 0 && text.length > 0 && (
            <> · ~{(text.length / Math.max(1, count)).toFixed(1)} chars/token</>
          )}
        </span>
        <span className="font-mono text-[var(--fg-subtle)]">{count} / {MAX_TOKENS}</span>
      </div>

      {/* Token budget bar */}
      <div className="mt-2 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${fillPercent > 90 ? "bg-rose-500" : fillPercent > 70 ? "bg-amber-500" : "bg-[var(--accent)]"}`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      {/* Quick examples */}
      <div className="mt-3">
        <span className="text-[10px] text-[var(--fg-subtle)] uppercase tracking-wider font-semibold mr-2">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.value}
            onClick={() => setText(ex.value)}
            className="mr-2 mb-1 px-2.5 py-0.5 text-xs rounded-full border border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
