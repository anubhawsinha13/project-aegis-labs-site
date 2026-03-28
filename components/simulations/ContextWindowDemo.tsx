"use client";

import { useState, useCallback } from "react";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  tokens: number;
}

const PRESET_CONVERSATIONS: Message[] = [
  { id: 1, role: "user", text: "My name is Alex and I'm building a todo app in React.", tokens: 14 },
  { id: 2, role: "assistant", text: "Great, Alex! A React todo app is a perfect project. What features are you planning?", tokens: 18 },
  { id: 3, role: "user", text: "I want add, delete, and a filter by status — done, pending, all.", tokens: 15 },
  { id: 4, role: "assistant", text: "Solid plan. I'd suggest using useState for the list and filter state. Want me to scaffold the component?", tokens: 22 },
  { id: 5, role: "user", text: "Yes, but use TypeScript with proper interfaces for the Todo type.", tokens: 13 },
  { id: 6, role: "assistant", text: "Here's a typed TodoItem interface with id, text, and completed fields, plus the main component with filter logic.", tokens: 20 },
  { id: 7, role: "user", text: "Can you add localStorage persistence so todos survive a page refresh?", tokens: 14 },
  { id: 8, role: "assistant", text: "I'll add a useEffect that saves to localStorage on change and loads on mount. Here's the updated code with the persistence hook.", tokens: 25 },
  { id: 9, role: "user", text: "Now add drag-and-drop reordering with react-beautiful-dnd.", tokens: 11 },
  { id: 10, role: "assistant", text: "I'll wrap the list in DragDropContext with a Droppable container and Draggable items. The onDragEnd callback reorders the array and persists to localStorage.", tokens: 30 },
  { id: 11, role: "user", text: "Actually, can we switch from localStorage to a Supabase backend with real-time sync?", tokens: 16 },
  { id: 12, role: "assistant", text: "Sure — I'll set up a Supabase client, create a todos table, and use the real-time subscription API for live updates. The local state becomes a cache synced via the Supabase channel.", tokens: 35 },
  { id: 13, role: "user", text: "Add authentication so each user sees only their own todos.", tokens: 12 },
  { id: 14, role: "assistant", text: "I'll integrate Supabase Auth with email/password. Row Level Security policies on the todos table will ensure users can only CRUD their own rows. The client passes the auth token automatically.", tokens: 32 },
  { id: 15, role: "user", text: "Great. Now remind me, what's my name and what framework are we using?", tokens: 15 },
];

const CONTEXT_LIMIT = 128;

export default function ContextWindowDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [showOverflow, setShowOverflow] = useState(false);

  const totalTokens = messages.reduce((s, m) => s + m.tokens, 0);
  const fillPct = Math.min((totalTokens / CONTEXT_LIMIT) * 100, 100);
  const overLimit = totalTokens > CONTEXT_LIMIT;

  const visibleMessages = useCallback(() => {
    if (!overLimit) return messages.map((m) => ({ ...m, faded: false }));
    let budget = CONTEXT_LIMIT;
    const result: (Message & { faded: boolean })[] = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      budget -= messages[i].tokens;
      result.unshift({ ...messages[i], faded: budget < 0 });
    }
    return result;
  }, [messages, overLimit]);

  const addNext = () => {
    if (stepIndex >= PRESET_CONVERSATIONS.length) return;
    setMessages((prev) => [...prev, PRESET_CONVERSATIONS[stepIndex]]);
    setStepIndex((i) => i + 1);
  };

  const fillAll = () => {
    setMessages(PRESET_CONVERSATIONS);
    setStepIndex(PRESET_CONVERSATIONS.length);
  };

  const reset = () => {
    setMessages([]);
    setStepIndex(0);
    setShowOverflow(false);
  };

  const vis = visibleMessages();
  const fadedCount = vis.filter((m) => m.faded).length;

  return (
    <div className="my-8 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
      {/* Token meter */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)]">
            Context Window Usage
          </p>
          <p className={`text-xs font-mono font-bold ${overLimit ? "text-red-400" : "text-emerald-400"}`}>
            {totalTokens} / {CONTEXT_LIMIT} tokens
          </p>
        </div>
        <div className="w-full h-5 rounded-full bg-[var(--bg)] border border-[var(--border)] overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              fillPct > 90 ? "bg-red-500" : fillPct > 70 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(fillPct, 100)}%` }}
          />
          {overLimit && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white drop-shadow">OVERFLOW — oldest messages lost</span>
            </div>
          )}
        </div>
        {fadedCount > 0 && (
          <p className="text-xs text-red-400 mt-2">
            {fadedCount} message{fadedCount > 1 ? "s" : ""} pushed out of the context window — the model can no longer see {fadedCount > 1 ? "them" : "it"}.
          </p>
        )}
      </div>

      {/* Chat window */}
      <div className="px-5 py-4 border-b border-[var(--border)] min-h-[220px] max-h-[380px] overflow-y-auto space-y-3">
        {vis.length === 0 && (
          <p className="text-sm text-[var(--fg-muted)] italic text-center py-8">Click "Add Message" to start the conversation...</p>
        )}
        {vis.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} transition-opacity duration-500 ${m.faded ? "opacity-20" : "opacity-100"}`}>
            <div className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm leading-relaxed relative ${
              m.role === "user"
                ? "bg-[var(--accent)]/15 text-[var(--fg)] border border-[var(--accent)]/30"
                : "bg-[var(--bg)] text-[var(--fg)] border border-[var(--border)]"
            }`}>
              {m.faded && (
                <div className="absolute -top-2.5 left-2 text-[9px] font-bold uppercase tracking-widest text-red-400 bg-[var(--bg-secondary)] px-1.5 rounded">out of window</div>
              )}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">{m.role}</span>
                <span className="text-[10px] text-[var(--fg-muted)] font-mono">{m.tokens} tok</span>
              </div>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="px-5 py-4 border-b border-[var(--border)] flex flex-wrap gap-2">
        <button onClick={addNext} disabled={stepIndex >= PRESET_CONVERSATIONS.length}
          className="px-4 py-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-[var(--accent)]/20">
          Add Message ({stepIndex + 1}/{PRESET_CONVERSATIONS.length})
        </button>
        <button onClick={fillAll}
          className="px-4 py-2 rounded-lg border border-amber-500/50 bg-amber-500/10 text-amber-400 text-xs font-semibold cursor-pointer transition-all hover:bg-amber-500/20">
          Fill Conversation
        </button>
        <button onClick={reset}
          className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--fg-muted)] text-xs font-semibold cursor-pointer transition-all hover:bg-[var(--bg)]">
          Reset
        </button>
        {overLimit && (
          <button onClick={() => setShowOverflow(!showOverflow)}
            className="px-4 py-2 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400 text-xs font-semibold cursor-pointer transition-all">
            {showOverflow ? "Hide" : "Show"} Model's Perspective
          </button>
        )}
      </div>

      {/* Model's perspective */}
      {showOverflow && overLimit && (
        <div className="px-5 py-4 border-b border-[var(--border)] bg-red-500/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-2">What the model actually sees</p>
          <div className="rounded-lg border border-red-500/30 bg-[var(--bg)] p-4 space-y-2">
            {vis.filter((m) => !m.faded).map((m) => (
              <div key={m.id} className="text-xs font-mono text-[var(--fg)]">
                <span className="text-[var(--fg-muted)]">[{m.role}]</span> {m.text}
              </div>
            ))}
            <div className="pt-2 border-t border-red-500/20 text-xs text-red-400">
              The model has no memory of the first {fadedCount} messages. If asked "what's my name?" — it can't answer because that message is gone.
            </div>
          </div>
        </div>
      )}

      <div className="px-5 py-4 bg-[var(--bg)]">
        <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
          <span className="font-semibold text-[var(--fg)]">LLMs have no memory — only context.</span>{" "}
          Every "conversation" is actually re-sent from scratch on each turn. When the conversation exceeds the context window (here simplified to {CONTEXT_LIMIT} tokens), oldest messages are truncated. The model doesn't "forget" — those messages were never sent. This is why long conversations degrade: early instructions, names, and constraints silently vanish as new messages push them out.
        </p>
      </div>
    </div>
  );
}
