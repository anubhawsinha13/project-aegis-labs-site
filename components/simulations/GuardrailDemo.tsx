"use client";

import { useState } from "react";

interface Gate {
  id: number;
  label: string;
  shortLabel: string;
  description: string;
  controls: string[];
  threats: string[];
  priority: "pilot-blocker" | "before-expansion" | "production-ready";
}

interface Threat {
  id: string;
  label: string;
  description: string;
  mitigatedBy: number[];
}

const GATES: Gate[] = [
  {
    id: 0,
    label: "Gate 0: Pre-Task Validation",
    shortLabel: "Pre-Task",
    description:
      "Runs before any agent execution begins. Validates the task definition, checks allowlists, captures a baseline snapshot, and scans for prompt injection in the target content.",
    controls: [
      "Task schema validation — reject unknown fields and unregistered task types",
      "Repo / resource allowlist check",
      "Baseline snapshot: git SHA, test count, coverage % before agent starts",
      "Prompt injection pre-scan on all target files",
      "Task source sanitization (Jira / Slack inputs stripped)",
    ],
    threats: ["prompt-injection", "scope-creep", "audit-gap"],
    priority: "before-expansion",
  },
  {
    id: 1,
    label: "Gate 1: Container Hardening",
    shortLabel: "Container",
    description:
      "The agent runs inside a sandboxed container with enforced egress rules, read-only mounts for critical paths, hard resource limits, and credentials injected via secrets manager — never via env vars the agent can read.",
    controls: [
      "Egress iptables rules (Artifactory + LLM API only)",
      "Protected path read-only mounts (.gitlab-ci.yml, Dockerfile, etc.)",
      "Hard limits: --cpus=2, --memory=4g, --pids-limit=200, 15-min kill timer",
      "Secrets via Vault tmpfs mount (not env vars or files)",
      "Non-root user + seccomp profile",
      "npm ci --ignore-scripts (no postinstall code execution)",
    ],
    threats: ["secret-leakage", "runaway-execution"],
    priority: "before-expansion",
  },
  {
    id: 2,
    label: "Gate 2: Agent Tool Constraints",
    shortLabel: "Tool Limits",
    description:
      "Every tool the agent can call is constrained. File access is boundary-checked, writes to critical paths are denied, a change budget caps the blast radius, and file content is sanitized before entering the LLM context window.",
    controls: [
      "File boundary enforcement — no path escape via ../ or symlinks",
      "Protected path deny list on edit_file (.env*, *.pem, *.key, .git/hooks/*, pom.xml unless permitted)",
      "Change budget: max 20 files / 500 line-delta per task (configurable)",
      "Tool call rate limit: 200 calls per session hard cap",
      "read_file content sanitizer — masks secrets before LLM context",
      "<untrusted_file_content> context delimiters in system prompt",
    ],
    threats: ["prompt-injection", "scope-creep", "secret-leakage", "runaway-execution", "verification-gaming"],
    priority: "pilot-blocker",
  },
  {
    id: 3,
    label: "Gate 3: Diff Validation",
    shortLabel: "Diff Check",
    description:
      "After the agent finishes and before the LLM Judge sees anything, deterministic checks run on the diff. Secret scanner, test integrity checks, prohibited pattern scanner, and dependency registry validation all run here.",
    controls: [
      "Secret scanner on diff (Trufflehog / GitLeaks) — immediate abort on match",
      "Test count delta: post_count ≥ baseline_count",
      "Coverage delta: drop ≤ 2% from baseline",
      "Prohibited patterns: @Ignore, @Disabled, .skip(), eslint-disable, maven.test.skip=true",
      "Build config change detection (pom.xml / package.json guarded)",
      "New dependency registry validation against approved allowlist",
      "Diff size hard limit: 50 files / 1,000 lines",
    ],
    threats: ["verification-gaming", "secret-leakage", "scope-creep"],
    priority: "pilot-blocker",
  },
  {
    id: 4,
    label: "Gate 4: LLM Judge",
    shortLabel: "LLM Judge",
    description:
      "A second LLM — from a different model family than the coding agent — reviews the diff against the original task. Structured JSON verdict with confidence score. Low confidence approvals route to human review.",
    controls: [
      "Different model family from coding agent (non-negotiable — shared family = correlated blind spots)",
      "Immutable judge prompt stored in orchestrator only (agent cannot read or influence it)",
      "Structured JSON verdict: verdict, confidence 0–100, scope_violations[], reasoning",
      "Confidence < 70 on APPROVE → mandatory human review (needs-human-review label)",
      "Dev discipline criteria: scope adherence, test preservation, build config integrity",
      "2nd REJECT → dead-letter queue + Slack alert (no silent failure)",
    ],
    threats: ["scope-creep", "verification-gaming", "correlated-judge"],
    priority: "pilot-blocker",
  },
  {
    id: 5,
    label: "Gate 5: MR Safety",
    shortLabel: "MR Safety",
    description:
      "The orchestrator — not the agent — controls what enters version control. MR title, description, and commit messages are generated from templates. Every AI-generated MR is labelled and signed by a dedicated service account.",
    controls: [
      "Orchestrator-generated MR content (title, description, commit messages from template)",
      "Mandatory labels: ai-generated, agent-session:<id>, task-type, domain",
      "Branch naming enforced: agent/<task-id>/<repo-slug>",
      "Signed commits from dedicated agent-bot service account (never a human token)",
      "Protected path flag → requires-owner-review for CI/CD, auth, DB migration files",
      "CODEOWNERS bypass prevention — orchestrator token cannot self-approve",
      "MR rate limiter: max 5 MRs per repo per rolling hour",
    ],
    threats: ["scope-creep", "audit-gap", "mr-commit-safety"],
    priority: "pilot-blocker",
  },
  {
    id: 6,
    label: "Gate 6: Audit and Traceability",
    shortLabel: "Audit",
    description:
      "Every session produces an immutable append-only log. A single session_id threads through all systems. The judge verdict is persisted with the MR. Sessions can be replayed for forensic investigation.",
    controls: [
      "Immutable session log: task hash, all tool call I/O, all LLM prompt/response pairs",
      "session_id threaded through task, container, tool calls, MR description, Jira, Slack",
      "Judge verdict stored in audit DB + embedded in MR description (survives MR deletion)",
      "Baseline vs. final comparison stored (test count, coverage, dependency list)",
      "Encrypted at rest, 90-day retention, RBAC access control",
      "Session replay for deterministic forensic reconstruction",
    ],
    threats: ["audit-gap"],
    priority: "before-expansion",
  },
  {
    id: 7,
    label: "Gate 7: Kill Switch and Circuit Breaker",
    shortLabel: "Kill Switch",
    description:
      "A global pause flag stops all new agent sessions in under 30 seconds. Per-domain disable for surgical pausing. Automatic circuit breaker triggers on metric thresholds. All failed sessions go to a dead-letter queue with human notification.",
    controls: [
      "Global pause flag (Redis / config-map) — activatable in < 30 seconds",
      "Per-domain disable flag for surgical pausing without halting all work",
      "Auto circuit breaker: judge veto rate > 40% in rolling 10 sessions → pause domain",
      "MR auto-move to Draft state on global pause with bot comment",
      "Dead-letter queue: failed sessions → Slack alert → team acknowledgement required",
      "Verifier health checks: 3 consecutive Artifactory failures → pause tech stack",
    ],
    threats: ["runaway-execution", "audit-gap"],
    priority: "pilot-blocker",
  },
];

const THREATS: Threat[] = [
  {
    id: "prompt-injection",
    label: "Prompt Injection",
    description:
      "Malicious content in repo files (README, comments, test fixtures) redirects the agent away from its task.",
    mitigatedBy: [0, 2],
  },
  {
    id: "scope-creep",
    label: "Scope Creep",
    description:
      "Agent modifies files outside the declared task scope — unrelated refactoring, touching other modules, or making unrequested changes.",
    mitigatedBy: [0, 2, 3, 4, 5],
  },
  {
    id: "verification-gaming",
    label: "Verification Gaming",
    description:
      "Agent deletes/disables tests, adds @Ignore annotations, or modifies the build script itself to make the verifier pass without fixing the real issue.",
    mitigatedBy: [2, 3, 4],
  },
  {
    id: "secret-leakage",
    label: "Secret Leakage",
    description:
      "Credentials in repo files enter the LLM context and appear in the generated diff or MR description.",
    mitigatedBy: [1, 2, 3],
  },
  {
    id: "runaway-execution",
    label: "Runaway Execution",
    description:
      "No change budget or time limit means a bad task can loop indefinitely or touch every file in a repo.",
    mitigatedBy: [1, 2, 7],
  },
  {
    id: "audit-gap",
    label: "Audit Gap",
    description:
      "No way to reconstruct what the agent did, why it made a change, or which session produced a given MR after the fact.",
    mitigatedBy: [5, 6, 7],
  },
  {
    id: "mr-commit-safety",
    label: "MR / Commit Safety",
    description:
      "Agent-controlled MR titles, descriptions, or commit identities make it impossible to distinguish AI-generated changes from human changes.",
    mitigatedBy: [5],
  },
  {
    id: "correlated-judge",
    label: "Correlated Judge Failure",
    description:
      "Using the same model family for both the coding agent and the judge means they share the same blind spots — errors the agent makes, the judge also fails to catch.",
    mitigatedBy: [4],
  },
];

const PRIORITY_COLORS: Record<Gate["priority"], string> = {
  "pilot-blocker": "bg-red-500/20 text-red-300 border-red-500/40",
  "before-expansion": "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  "production-ready": "bg-green-500/20 text-green-300 border-green-500/40",
};

const PRIORITY_LABELS: Record<Gate["priority"], string> = {
  "pilot-blocker": "Pilot blocker",
  "before-expansion": "Before expansion",
  "production-ready": "Full production",
};

export default function GuardrailDemo() {
  const [activeGate, setActiveGate] = useState<number | null>(null);
  const [activeThreat, setActiveThreat] = useState<string | null>(null);

  const highlightedGates = activeThreat
    ? THREATS.find((t) => t.id === activeThreat)?.mitigatedBy ?? []
    : activeGate !== null
    ? [activeGate]
    : [];

  const highlightedThreats = activeGate !== null
    ? GATES.find((g) => g.id === activeGate)?.threats ?? []
    : activeThreat
    ? [activeThreat]
    : [];

  const selectedGate = activeGate !== null ? GATES[activeGate] : null;

  return (
    <div className="my-8 rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--bg-subtle,#1a1a2e)] px-5 py-3 border-b border-[var(--border)]">
        <p className="text-xs font-mono text-[var(--fg-muted)]">
          Click a gate to explore its controls — or click a threat to see which gates defend against it.
        </p>
      </div>

      <div className="p-5 space-y-6">
        {/* Gate pipeline */}
        <div>
          <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">
            8-Gate Defense Pipeline
          </p>
          <div className="flex flex-wrap gap-2">
            {GATES.map((gate) => {
              const isHighlighted = highlightedGates.includes(gate.id);
              const isActive = activeGate === gate.id;
              const isDimmed = highlightedGates.length > 0 && !isHighlighted;
              return (
                <button
                  key={gate.id}
                  onClick={() => {
                    setActiveThreat(null);
                    setActiveGate(isActive ? null : gate.id);
                  }}
                  className={[
                    "px-3 py-1.5 text-xs rounded-lg border transition-all duration-150 font-mono",
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : isHighlighted
                      ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                      : isDimmed
                      ? "border-[var(--border)] text-[var(--fg-muted)] opacity-30"
                      : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
                  ].join(" ")}
                >
                  G{gate.id} {gate.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected gate detail */}
        {selectedGate && (
          <div className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-[var(--fg)]">{selectedGate.label}</h3>
              <span
                className={`shrink-0 px-2 py-0.5 text-xs rounded-full border ${
                  PRIORITY_COLORS[selectedGate.priority]
                }`}
              >
                {PRIORITY_LABELS[selectedGate.priority]}
              </span>
            </div>
            <p className="text-sm text-[var(--fg-muted)]">{selectedGate.description}</p>
            <div>
              <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">
                Controls
              </p>
              <ul className="space-y-1">
                {selectedGate.controls.map((c, i) => (
                  <li key={i} className="text-xs text-[var(--fg)] flex gap-2">
                    <span className="text-[var(--accent)] shrink-0">—</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Threat cards */}
        <div>
          <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">
            Threat Model — click a threat to see which gates defend against it
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {THREATS.map((threat) => {
              const isHighlighted = highlightedThreats.includes(threat.id);
              const isActive = activeThreat === threat.id;
              const isDimmed =
                highlightedThreats.length > 0 && !isHighlighted;
              return (
                <button
                  key={threat.id}
                  onClick={() => {
                    setActiveGate(null);
                    setActiveThreat(isActive ? null : threat.id);
                  }}
                  className={[
                    "text-left p-3 rounded-lg border transition-all duration-150",
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : isHighlighted
                      ? "border-[var(--accent)]/60 bg-[var(--accent)]/5"
                      : isDimmed
                      ? "border-[var(--border)] opacity-30"
                      : "border-[var(--border)] hover:border-[var(--accent)]/60",
                  ].join(" ")}
                >
                  <p className="text-xs font-semibold text-[var(--fg)] mb-1">
                    {threat.label}
                  </p>
                  <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
                    {threat.description}
                  </p>
                  {isActive && (
                    <p className="text-xs text-[var(--accent)] mt-2 font-mono">
                      Mitigated by: {threat.mitigatedBy.map((g) => `G${g}`).join(", ")}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority legend */}
        <div className="flex flex-wrap gap-3 pt-1 border-t border-[var(--border)]">
          {(Object.entries(PRIORITY_LABELS) as [Gate["priority"], string][]).map(
            ([key, label]) => (
              <span
                key={key}
                className={`px-2 py-0.5 text-xs rounded-full border ${PRIORITY_COLORS[key]}`}
              >
                {label}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
