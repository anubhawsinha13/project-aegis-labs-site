"use client";

import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DesktopTool {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  appearsAt: number; // stage index (0-based)
}

interface CheckItem {
  text: string;
  appearsAt: number;
  category: "habit" | "gate" | "tool";
}

interface StageData {
  id: number;
  label: string;
  tool: string;
  tagline: string;
  role: string;
  blastLabel: string;
  blastRings: number;   // 1-4
  blastColor: string;
  color: string;
  borderColor: string;
  textColor: string;
  bgColor: string;
  badgeColor: string;
  isLeap?: boolean;
  leapWarning?: string;
  summary: string;
  riskNote: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const STAGES: StageData[] = [
  {
    id: 1,
    label: "Stage 1",
    tool: "Autocomplete",
    tagline: "GitHub Copilot inline · Tabnine",
    role: "Passive reviewer",
    blastLabel: "One line",
    blastRings: 1,
    blastColor: "bg-emerald-500",
    color: "emerald",
    borderColor: "border-emerald-500/60",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/8",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    summary: "The IDE predicts the next token based on surrounding code. You decide whether to accept each suggestion. Nothing happens without a keypress from you.",
    riskNote: "Zero autonomous action. The agent decides nothing. You review every character before it lands in the file.",
  },
  {
    id: 2,
    label: "Stage 2",
    tool: "Copilot Chat / Cursor Chat",
    tagline: "Conversational · Single-file context",
    role: "Active prompter",
    blastLabel: "One file",
    blastRings: 2,
    blastColor: "bg-amber-500",
    color: "amber",
    borderColor: "border-amber-500/60",
    textColor: "text-amber-400",
    bgColor: "bg-amber-500/8",
    badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    summary: "You describe intent, the model responds across the whole file. You still manually apply every suggestion — nothing changes in the repo without your explicit action.",
    riskNote: "Still no autonomous action. You shift from predicting completions to evaluating intent. The new skill required is writing clear prompts, not reviewing keystrokes.",
  },
  {
    id: 3,
    label: "Stage 3",
    tool: "Cursor Agent / Copilot Workspace",
    tagline: "Multi-file · In-IDE · Supervised",
    role: "Diff reviewer",
    blastLabel: "Multiple files",
    blastRings: 3,
    blastColor: "bg-orange-500",
    color: "orange",
    borderColor: "border-orange-500/60",
    textColor: "text-orange-400",
    bgColor: "bg-orange-500/8",
    badgeColor: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
    summary: "A single prompt can modify a feature end-to-end across multiple files. The agent reads UserService.java, understands CustomerRepository is downstream, and modifies both. You are still watching — but watching now means reviewing a diff across 8 files.",
    riskNote: "Blast radius appears for the first time. The agent can touch files you didn't intend. Scope drift, unintended edits to shared utilities, and deleted code the agent judged 'dead' all happen here without guardrails.",
  },
  {
    id: 4,
    label: "Stage 4",
    tool: "Background Agent Scaffold",
    tagline: "Autonomous · Unsupervised · Fleet-scale",
    role: "System designer",
    blastLabel: "Full repo + multi-repo",
    blastRings: 4,
    blastColor: "bg-red-500",
    color: "red",
    borderColor: "border-red-500/60",
    textColor: "text-red-400",
    bgColor: "bg-red-500/8",
    badgeColor: "bg-red-500/20 text-red-300 border border-red-500/30",
    isLeap: true,
    leapWarning: "This is the categorical leap. The developer is no longer watching. Everything below becomes non-optional.",
    summary: "The agent runs in a container, takes tasks from a queue, makes changes, and opens PRs — all without the developer present. You queue twenty dependency updates across five repos, go to lunch, and return to twenty reviewed PRs.",
    riskNote: "An unsupervised agent without constraints can delete tests to make verify() pass, leak secrets into generated code, modify CI/CD to widen its own permissions, and open PRs that look correct but are functionally broken.",
  },
];

const DESKTOP_TOOLS: DesktopTool[] = [
  { id: "ide", label: "IDE / Editor", sublabel: "always active", icon: "💻", appearsAt: 0 },
  { id: "terminal", label: "Terminal", sublabel: "always active", icon: "⬛", appearsAt: 0 },
  { id: "chat", label: "Copilot / Cursor Chat", sublabel: "appears at Stage 2", icon: "💬", appearsAt: 1 },
  { id: "skills", label: "Skills Library", sublabel: "appears at Stage 3", icon: "📚", appearsAt: 2 },
  { id: "agent", label: "Agent Runner", sublabel: "appears at Stage 4", icon: "🤖", appearsAt: 3 },
  { id: "verify", label: "Verification Loop", sublabel: "appears at Stage 4", icon: "🔄", appearsAt: 3 },
  { id: "platform", label: "Platform Connection", sublabel: "appears at Stage 4", icon: "🌐", appearsAt: 3 },
];

const CHECK_ITEMS: CheckItem[] = [
  // Stage 3 habits
  { text: "Check file scope before accepting any agent change", appearsAt: 2, category: "habit" },
  { text: "Commit before each agent run — clean git reset point", appearsAt: 2, category: "habit" },
  { text: "Scope tasks tightly — one change type per prompt", appearsAt: 2, category: "habit" },
  { text: "Add .cursor/rules or Skills to encode codebase conventions", appearsAt: 2, category: "tool" },
  // Stage 4 gates
  { text: "Gate 2: Tool constraints — deny list + change budget enforced at tool level", appearsAt: 3, category: "gate" },
  { text: "Gate 3: Diff validation — secret scan, test count delta, prohibited patterns", appearsAt: 3, category: "gate" },
  { text: "Gate 4: LLM Judge — different model family, structured JSON verdict + confidence gate", appearsAt: 3, category: "gate" },
  { text: "Gate 5: MR safety — orchestrator-controlled PR content, mandatory ai-generated labels", appearsAt: 3, category: "gate" },
  { text: "Gate 7: Kill switch — global pause activatable in <30 seconds + circuit breaker", appearsAt: 3, category: "gate" },
  { text: "Gate 0: Pre-task validation — baseline snapshot, injection pre-scan, allowlist check", appearsAt: 3, category: "gate" },
  { text: "Gate 1: Container hardening — run as non-root, read-only mounts, network egress restricted", appearsAt: 3, category: "gate" },
  { text: "Gate 6: Append-only audit log — write-only from agent perspective, session replay", appearsAt: 3, category: "gate" },
];

const CATEGORY_COLORS: Record<string, string> = {
  habit: "text-amber-400",
  gate: "text-red-400",
  tool: "text-blue-400",
};

const CATEGORY_ICONS: Record<string, string> = {
  habit: "🛡",
  gate: "🚦",
  tool: "🔧",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function StageProgressionDemo() {
  const [activeStage, setActiveStage] = useState(0); // 0-indexed
  const stage = STAGES[activeStage];

  const visibleTools = DESKTOP_TOOLS.filter((t) => t.appearsAt <= activeStage);
  const dimmedTools = DESKTOP_TOOLS.filter((t) => t.appearsAt > activeStage);
  const visibleChecks = CHECK_ITEMS.filter((c) => c.appearsAt <= activeStage);

  return (
    <div className="my-8 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">

      {/* Stage selector tabs */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto">
        {STAGES.map((s, i) => {
          const isActive = i === activeStage;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStage(i)}
              className={`flex-1 min-w-[120px] px-4 py-3.5 text-left transition-all duration-200 cursor-pointer border-b-2 ${
                isActive
                  ? `${s.borderColor} bg-[var(--bg)]`
                  : "border-transparent hover:bg-[var(--bg)]"
              }`}
            >
              <div className={`text-xs font-bold ${isActive ? s.textColor : "text-[var(--fg-muted)]"}`}>
                {s.label}
              </div>
              <div className="text-xs text-[var(--fg-muted)] mt-0.5 leading-tight hidden sm:block">
                {s.tool}
              </div>
            </button>
          );
        })}
      </div>

      {/* Leap warning banner */}
      {stage.isLeap && (
        <div className="px-5 py-3 bg-red-500/10 border-b border-red-500/30 flex items-start gap-2">
          <span className="text-red-400 text-sm mt-0.5 flex-shrink-0">⚠</span>
          <p className="text-xs text-red-300 font-medium leading-relaxed">{stage.leapWarning}</p>
        </div>
      )}

      {/* Stage header */}
      <div className={`px-5 py-4 border-b border-[var(--border)] ${stage.bgColor}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className={`text-base font-bold ${stage.textColor}`}>{stage.tool}</h3>
            <p className="text-xs text-[var(--fg-muted)] mt-0.5">{stage.tagline}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${stage.badgeColor}`}>
              Developer role: {stage.role}
            </span>
          </div>
        </div>
        <p className="text-sm text-[var(--fg-muted)] mt-3 leading-relaxed">{stage.summary}</p>
        <div className="mt-3 p-3 rounded-md bg-[var(--bg)] border border-[var(--border)]">
          <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
            <span className="font-semibold text-[var(--fg)]">Risk: </span>{stage.riskNote}
          </p>
        </div>
      </div>

      {/* Three panels */}
      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">

        {/* Panel A: Desktop view */}
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-4">
            Your Desktop
          </p>
          <div className="space-y-2">
            {visibleTools.map((tool) => (
              <div
                key={tool.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md border transition-all duration-300 ${
                  tool.appearsAt === activeStage
                    ? `${stage.borderColor} ${stage.bgColor}`
                    : "border-[var(--border)] bg-[var(--bg)]"
                }`}
              >
                <span className="text-base leading-none">{tool.icon}</span>
                <div>
                  <div className={`text-xs font-semibold ${tool.appearsAt === activeStage ? stage.textColor : "text-[var(--fg)]"}`}>
                    {tool.label}
                  </div>
                  {tool.appearsAt === activeStage && (
                    <div className="text-xs text-[var(--fg-muted)]">new at this stage</div>
                  )}
                </div>
              </div>
            ))}
            {dimmedTools.map((tool) => (
              <div
                key={tool.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md border border-[var(--border)] opacity-25"
              >
                <span className="text-base leading-none grayscale">{tool.icon}</span>
                <div>
                  <div className="text-xs font-semibold text-[var(--fg-muted)]">{tool.label}</div>
                  <div className="text-xs text-[var(--fg-muted)]">{tool.sublabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel B: Blast radius */}
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-4">
            Blast Radius
          </p>
          <div className="flex flex-col items-center justify-center py-4">
            {/* Ring visualisation */}
            <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
              {[4, 3, 2, 1].map((ring) => {
                const size = ring * 36;
                const isActive = ring <= stage.blastRings;
                const isOutermost = ring === stage.blastRings;
                return (
                  <div
                    key={ring}
                    className={`absolute rounded-full border-2 transition-all duration-500 ${
                      isActive
                        ? isOutermost
                          ? `${stage.borderColor} ${stage.bgColor}`
                          : "border-[var(--border)] bg-[var(--bg-secondary)]"
                        : "border-[var(--border)] opacity-15"
                    }`}
                    style={{ width: size, height: size }}
                  />
                );
              })}
              <div className={`relative z-10 text-center`}>
                <div className={`text-xl font-bold ${stage.textColor}`}>{stage.blastRings}</div>
                <div className="text-xs text-[var(--fg-muted)]">rings</div>
              </div>
            </div>
            <div className={`mt-4 text-sm font-semibold ${stage.textColor}`}>{stage.blastLabel}</div>
            <div className="mt-1 text-xs text-[var(--fg-muted)] text-center max-w-[160px]">
              scope of potential unintended change in a single session
            </div>
          </div>

          {/* Stage comparison legend */}
          <div className="mt-2 space-y-1.5">
            {STAGES.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-2 text-xs ${i === activeStage ? "" : "opacity-40"}`}>
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.blastColor}`} />
                <span className={i === activeStage ? "font-semibold text-[var(--fg)]" : "text-[var(--fg-muted)]"}>
                  {s.label}: {s.blastLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel C: Accumulating checklist */}
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-4">
            What You Must Have
          </p>
          {visibleChecks.length === 0 ? (
            <div className="text-xs text-[var(--fg-muted)] italic py-4 text-center">
              No additional requirements at this stage.
              <br />
              The tool handles safety.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {visibleChecks.map((item, idx) => {
                const isNew = item.appearsAt === activeStage;
                return (
                  <li key={idx} className={`flex gap-2 items-start transition-opacity duration-300`}>
                    <span className="mt-0.5 flex-shrink-0 text-sm">
                      {isNew ? CATEGORY_ICONS[item.category] : "✓"}
                    </span>
                    <div>
                      <span className={`text-xs leading-snug ${isNew ? CATEGORY_COLORS[item.category] + " font-semibold" : "text-[var(--fg-muted)]"}`}>
                        {item.text}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {activeStage === 3 && (
            <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-300 leading-relaxed">
                <span className="font-bold">8 gates total.</span> All must be in place before the first unsupervised session. These cannot be safely retrofit while the agent is running.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
