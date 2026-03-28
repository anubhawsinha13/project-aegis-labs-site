"use client";

import { useState } from "react";

interface Control {
  text: string;
}

interface GateNode {
  id: number;
  label: string;
  shortLabel: string;
  pilotBlocker: boolean;
  color: string;
  borderColor: string;
  textColor: string;
  tagBg: string;
  description: string;
  controls: Control[];
}

const GATES: GateNode[] = [
  {
    id: 0,
    label: "Gate 0: Pre-Task Validation",
    shortLabel: "Pre-Task",
    pilotBlocker: false,
    color: "bg-slate-500/10",
    borderColor: "border-slate-500/50",
    textColor: "text-slate-300",
    tagBg: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    description: "Runs before any execution. Prevents bad tasks from ever starting.",
    controls: [
      { text: "Task schema validation — reject unknown fields and unregistered task types" },
      { text: "Repo / resource allowlist check" },
      { text: "Baseline snapshot: git SHA, test count, coverage % before agent starts" },
      { text: "Prompt injection pre-scan on all target files" },
      { text: "Task source sanitization (Jira / Slack inputs stripped)" },
    ],
  },
  {
    id: 1,
    label: "Gate 1: Container Hardening",
    shortLabel: "Container",
    pilotBlocker: false,
    color: "bg-cyan-500/10",
    borderColor: "border-cyan-500/50",
    textColor: "text-cyan-300",
    tagBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    description: "The agent runs in a sandboxed container it cannot escape.",
    controls: [
      { text: "Egress iptables rules (Artifactory + LLM API only)" },
      { text: "Protected paths mounted read-only (.gitlab-ci.yml, Dockerfile, etc.)" },
      { text: "Hard limits: --cpus=2, --memory=4g, --pids-limit=200, 15-min kill timer" },
      { text: "Secrets via Vault tmpfs mount (not env vars or files the agent can read)" },
      { text: "Non-root user + seccomp profile" },
      { text: "npm ci --ignore-scripts (no postinstall code execution)" },
    ],
  },
  {
    id: 2,
    label: "Gate 2: Agent Tool Constraints",
    shortLabel: "Tool Limits",
    pilotBlocker: true,
    color: "bg-emerald-500/10",
    borderColor: "border-emerald-500/50",
    textColor: "text-emerald-300",
    tagBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    description: "Defines what the agent's tools can and cannot do at the call level.",
    controls: [
      { text: "File boundary enforcement — no path escape via ../ or symlinks" },
      { text: "Protected path deny list on edit_file (.env*, *.pem, .git/hooks/*, CI/CD configs)" },
      { text: "Change budget enforced: max files + max line-delta per task type" },
      { text: "read_file content sanitizer — secrets masked before LLM context" },
      { text: "Untrusted content wrapped in context-separation delimiters" },
      { text: "Tool call rate limit per session" },
    ],
  },
  {
    id: 3,
    label: "Gate 3: Diff Validation",
    shortLabel: "Diff Check",
    pilotBlocker: true,
    color: "bg-yellow-500/10",
    borderColor: "border-yellow-500/50",
    textColor: "text-yellow-300",
    tagBg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    description: "Every proposed diff is validated before the judge sees it.",
    controls: [
      { text: "Secret scanner on full diff (Trufflehog / GitLeaks)" },
      { text: "Test count delta: block if post-change count < pre-change count" },
      { text: "Coverage delta check (drop ≤ configured threshold)" },
      { text: "Prohibited pattern scanner: @Ignore, @Disabled, .skip(), eslint-disable" },
      { text: "Build config change detection (pom.xml, package.json, Dockerfile guarded)" },
      { text: "New dependency registry validation against approved allowlist" },
      { text: "Diff size hard limit (max files + max lines)" },
    ],
  },
  {
    id: 4,
    label: "Gate 4: LLM Judge",
    shortLabel: "Judge",
    pilotBlocker: true,
    color: "bg-violet-500/10",
    borderColor: "border-violet-500/50",
    textColor: "text-violet-300",
    tagBg: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    description: "A second LLM using a different model family reviews every diff.",
    controls: [
      { text: "Judge uses a DIFFERENT model family from the coding agent — non-negotiable" },
      { text: "Judge prompt stored in orchestrator only (not accessible to agent)" },
      { text: "Structured JSON verdict: { verdict, confidence, scope_violations, reasoning }" },
      { text: "Confidence < 70 → mandatory human review (not auto-merge)" },
      { text: "Dev discipline evaluation: scope, test integrity, build config, no debug artifacts" },
      { text: "Each retry independently logged with judge verdict + delta" },
      { text: "After 2 rejects → dead-letter queue + human notification" },
    ],
  },
  {
    id: 5,
    label: "Gate 5: MR Safety",
    shortLabel: "MR Safety",
    pilotBlocker: true,
    color: "bg-orange-500/10",
    borderColor: "border-orange-500/50",
    textColor: "text-orange-300",
    tagBg: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    description: "Output reaches version control with the right identity, labels, and rate controls.",
    controls: [
      { text: "Orchestrator generates MR title, description, and labels (not the agent)" },
      { text: "Diff size hard limit (50 files / 1000 lines) — last check before submission" },
      { text: "Signed commits from dedicated service account (not a human token)" },
      { text: "Mandatory labels: ai-generated, agent-session:{id}, task-type:{type}" },
      { text: "Protected path flag: CI/CD file changes route to code-owner review" },
      { text: "Orchestrator token cannot self-approve its own MRs" },
      { text: "Per-target output rate limiter: max 5 MRs per repo per hour" },
    ],
  },
  {
    id: 6,
    label: "Gate 6: Audit and Traceability",
    shortLabel: "Audit",
    pilotBlocker: false,
    color: "bg-teal-500/10",
    borderColor: "border-teal-500/50",
    textColor: "text-teal-300",
    tagBg: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    description: "Every session is fully reconstructable after the fact.",
    controls: [
      { text: "Immutable append-only session log: task hash, all tool calls, all LLM I/O" },
      { text: "Full LLM trace: every prompt + response + tool call input/output" },
      { text: "Judge verdict persisted with MR (survives MR deletion)" },
      { text: "Baseline vs. final state stored per session for comparison" },
      { text: "Single session_id threaded through all systems (logs, output, tickets, alerts)" },
      { text: "Session replay capability for forensic investigation" },
    ],
  },
  {
    id: 7,
    label: "Gate 7: Kill Switch and Circuit Breaker",
    shortLabel: "Kill Switch",
    pilotBlocker: true,
    color: "bg-rose-500/10",
    borderColor: "border-rose-500/50",
    textColor: "text-rose-300",
    tagBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    description: "Exists on day one. Can stop everything in under 60 seconds. Monitors all other gates.",
    controls: [
      { text: "Global pause flag activatable in < 60 seconds (Redis / config-map / feature flag)" },
      { text: "Per-domain scoped pause — surgical stop without halting everything" },
      { text: "Auto circuit breaker: judge veto rate > 40% in a domain → pause that domain" },
      { text: "Dead-letter queue: failed sessions stored with full context for human review" },
      { text: "MR rate limiter enforced by orchestrator (max 5 per repo per hour)" },
      { text: "Kill switch tested end-to-end before first pilot session" },
    ],
  },
];

export default function DefenseArchDiagram() {
  const [expandedGate, setExpandedGate] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const visibleGates = showAll ? GATES : GATES;

  return (
    <div className="my-8 rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--bg-subtle,#111827)] px-5 py-3 border-b border-[var(--border)] flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-mono font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
          Defense-in-Depth Architecture — click any gate to expand controls
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-rose-400 font-mono">■</span>
          <span className="text-[10px] text-[var(--fg-muted)]">pilot blocker</span>
        </div>
      </div>

      <div className="p-4 space-y-1.5">
        {GATES.map((gate, idx) => {
          const isExpanded = expandedGate === gate.id;
          const isFirst = idx === 0;
          const isLast = idx === GATES.length - 1;

          return (
            <div key={gate.id} className="flex gap-2">
              {/* Tree line */}
              <div className="flex flex-col items-center w-5 shrink-0 pt-1">
                <div className={`w-0.5 ${isFirst ? "h-3 mt-3" : "flex-1"} bg-[var(--border)]`} />
                <div className={`w-2 h-2 rounded-full border-2 ${gate.borderColor} bg-[var(--bg)]`} />
                <div className={`w-0.5 ${isLast ? "h-3" : "flex-1"} bg-[var(--border)]`} />
              </div>

              {/* Gate card */}
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setExpandedGate(isExpanded ? null : gate.id)}
                  className={[
                    "w-full text-left rounded-lg border px-3.5 py-2.5 transition-all duration-150",
                    isExpanded ? `${gate.color} ${gate.borderColor}` : "border-[var(--border)] hover:border-[var(--fg-muted)/40]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[11px] font-mono font-bold w-5 shrink-0 ${isExpanded ? gate.textColor : "text-[var(--fg-muted)]"}`}>
                        G{gate.id}
                      </span>
                      <span className={`text-sm font-semibold leading-tight ${isExpanded ? gate.textColor : "text-[var(--fg)]"}`}>
                        {gate.label}
                      </span>
                      {gate.pilotBlocker && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                          pilot blocker
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-[var(--fg-muted)]">
                        {gate.controls.length} controls
                      </span>
                      <span className={`text-xs transition-transform duration-150 ${isExpanded ? "rotate-90" : ""} text-[var(--fg-muted)]`}>
                        ›
                      </span>
                    </div>
                  </div>

                  {!isExpanded && (
                    <p className="text-[11px] text-[var(--fg-muted)] mt-1 ml-7 leading-relaxed">
                      {gate.description}
                    </p>
                  )}

                  {isExpanded && (
                    <div className="mt-3 ml-7 space-y-2">
                      <p className="text-xs text-[var(--fg-muted)] italic mb-3">{gate.description}</p>
                      {gate.controls.map((ctrl, ci) => (
                        <div key={ci} className="flex gap-2 items-start">
                          <span className={`shrink-0 mt-1 text-[8px] ${gate.textColor}`}>▸</span>
                          <span className="text-xs text-[var(--fg)] leading-relaxed">{ctrl.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-subtle,#111827)]">
        <p className="text-[11px] text-[var(--fg-muted)]">
          Gate 7 monitors all other gates and can halt execution anywhere in the pipeline in under 60 seconds.
          Gates 2–5 and 7 must be complete before the first pilot session.
        </p>
      </div>
    </div>
  );
}
