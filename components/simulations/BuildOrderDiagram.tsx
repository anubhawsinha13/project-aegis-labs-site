"use client";

import { useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Task {
  text: string;
  note?: string;
}

interface TaskGroup {
  category: string;
  tasks: Task[];
}

interface PhaseData {
  id: string;
  label: string;
  shortLabel: string;
  weeks: string;
  color: string;
  borderColor: string;
  ringColor: string;
  textColor: string;
  tagBg: string;
  buildingLayers: string[];
  goal: string;
  exitCriteria: string;
  groups: TaskGroup[];
}

// ─── Layer stack config ──────────────────────────────────────────────────────

const LAYERS = [
  { id: "foundation", label: "Layer 1: Verification Foundation", shortLabel: "verify()", emerald: true, color: "emerald" },
  { id: "controls", label: "Layer 2: Discipline Controls", shortLabel: "Controls", color: "amber" },
  { id: "controlplane", label: "Layer 3: Control Plane", shortLabel: "Kill Switch", color: "orange" },
  { id: "agent", label: "The Agent", shortLabel: "Agent", color: "blue" },
];

// ─── Phase data ──────────────────────────────────────────────────────────────

const PHASES: PhaseData[] = [
  {
    id: "phase1",
    label: "Phase 1",
    shortLabel: "Verifier",
    weeks: "Wk 1–2",
    color: "bg-emerald-500/10",
    borderColor: "border-emerald-500",
    ringColor: "ring-emerald-500/40",
    textColor: "text-emerald-400",
    tagBg: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    buildingLayers: ["foundation"],
    goal: "Build a single verify() tool that proves code correctness. Test it standalone against real repos — before writing a single line of agent code.",
    exitCriteria: "verify() returns reliable pass/fail on 3+ repos. No agent involved.",
    groups: [
      {
        category: "Build Verifier",
        tasks: [
          { text: "mvn compile + mvn test (Java/Maven repos)" },
          { text: "npm ci + npm run build + npm test (Node/TS repos)" },
          { text: "Capture exit code, stdout, stderr per step" },
          { text: "Return structured result: { status, duration_ms, failing_tests[] }", note: "not just an exit code" },
        ],
      },
      {
        category: "Test Runner Verifier",
        tasks: [
          { text: "Capture test count before change (baseline snapshot)" },
          { text: "After change: total_after >= total_before — hard rule" },
          { text: "Track coverage delta — warn if drops > 2%" },
          { text: "Store test output in session log for audit trail" },
        ],
      },
      {
        category: "Lint Verifier",
        tasks: [
          { text: "PMD / Checkstyle (Java) — new violations only, not full-repo scan", note: "full scan surfaces unrelated noise" },
          { text: "ESLint (TS) — compare new violation count against baseline" },
          { text: "Return list of new violations introduced by this diff" },
          { text: "Block on new violations; ignore pre-existing technical debt" },
        ],
      },
      {
        category: "MCP Tool Exposure",
        tasks: [
          { text: "Wrap all three as one verify() MCP tool" },
          { text: "Signature: verify(repo_path, branch) → VerifyResult" },
          { text: "Returns structured PASS/FAIL with specific failure reason" },
          { text: "Call it manually from CLI — confirm it's reliable before wiring to agent" },
        ],
      },
    ],
  },
  {
    id: "phase2",
    label: "Phase 2",
    shortLabel: "Controls + Kill Switch",
    weeks: "Wk 2–3",
    color: "bg-amber-500/10",
    borderColor: "border-amber-500",
    ringColor: "ring-amber-500/40",
    textColor: "text-amber-400",
    tagBg: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    buildingLayers: ["controls", "controlplane"],
    goal: "Define what the agent is and is not allowed to do. Build the kill switch before any other Phase 2 work — you need a stop button before you have anything that moves.",
    exitCriteria: "Kill switch tested. Deny list rejects a test path. Judge vetoes a test diff. Circuit breaker trips in staging.",
    groups: [
      {
        category: "Kill Switch — build this first",
        tasks: [
          { text: "Global pause flag in a config store (Redis / feature flag / SSM param)" },
          { text: "Agent checks flag at session start AND before each MR creation" },
          { text: "Test it: set flag, confirm all new sessions halt within 60 seconds" },
          { text: "Per-domain scoped pause: stop one repo group without stopping everything" },
        ],
      },
      {
        category: "edit_file Controls",
        tasks: [
          { text: "Hard-coded deny list: .env*, *.pem, *.key, .git/hooks/*, CI/CD configs" },
          { text: "Change budget: 5 files max per session (conservative starting point)" },
          { text: "Resolve symlinks before deny-list check — no bypass via symlink" },
          { text: "Return PermissionDenied with reason — never silently skip" },
        ],
      },
      {
        category: "read_file Sanitizer",
        tasks: [
          { text: "Mask values matching AWS_*, *_TOKEN, *_SECRET, *_PASSWORD patterns" },
          { text: "Replace with [REDACTED:key_name] — preserve structure, mask value" },
          { text: "Log masked field names to audit record (key name, never the value)" },
        ],
      },
      {
        category: "Diff Validator",
        tasks: [
          { text: "Secret scanner on full diff: Trufflehog or GitLeaks" },
          { text: "Test count delta: block if post-change count < pre-change count" },
          { text: "Prohibited patterns: @Ignore, @Disabled, .skip(), eslint-disable, // TODO: remove" },
          { text: "Build config protection: flag scope changes in pom.xml, build.gradle" },
        ],
      },
      {
        category: "LLM Judge",
        tasks: [
          { text: "Use a different model family from the coding agent", note: "different families, different blind spots" },
          { text: "Input: task description + full diff + verify() output" },
          { text: "Output: { verdict: APPROVE|VETO|REVIEW, confidence: 0–100, reason }" },
          { text: "confidence < 70 → REVIEW queue (human), never auto-merge" },
          { text: "VETO increments domain veto counter → circuit breaker trips at threshold" },
        ],
      },
      {
        category: "Audit Log + Circuit Breaker",
        tasks: [
          { text: "Circuit breaker: auto-pause domain when veto rate > N% in last M sessions" },
          { text: "Dead-letter queue: failed sessions stored with full context for human" },
          { text: "session_id threads through all events: task → tools → verify → judge → MR" },
          { text: "Audit log is write-only from agent perspective — no delete, no update" },
        ],
      },
    ],
  },
  {
    id: "phase3",
    label: "Phase 3",
    shortLabel: "Agent — 1 repo, manual",
    weeks: "Wk 3–4",
    color: "bg-blue-500/10",
    borderColor: "border-blue-500",
    ringColor: "ring-blue-500/40",
    textColor: "text-blue-400",
    tagBg: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    buildingLayers: ["agent"],
    goal: "Write the agent. Constrain it maximally. Manually trigger every session. MRs are draft only. A human reviews each one before any merge.",
    exitCriteria: "10 manually triggered sessions complete. MRs are draft. Each reviewed by a human before approval.",
    groups: [
      {
        category: "Agent Core",
        tasks: [
          { text: "LLM: Claude claude-sonnet-4-5 or GPT-4o with tool use enabled" },
          { text: "System prompt: role, task scope, context-separation delimiters" },
          { text: "Prohibited instruction block: agent refuses to modify tests, CI/CD, or deny-list paths" },
          { text: "Prompt structure: system → task_context (delimited) → instructions" },
        ],
      },
      {
        category: "Tool Set — minimal, no exceptions",
        tasks: [
          { text: "read_file — sanitizer active from Phase 2" },
          { text: "edit_file — deny list and budget active from Phase 2" },
          { text: "verify() — the Phase 1 tool" },
          { text: "search_code — read-only AST/grep lookup" },
          { text: "No shell execution. No git commands. No network calls.", note: "hard constraint" },
        ],
      },
      {
        category: "Session Execution",
        tasks: [
          { text: "Clone repo into isolated temp directory for each session" },
          { text: "Inject session_id at start — threads to all downstream events" },
          { text: "Agent loop: read → edit → verify → repeat until pass or max iterations" },
          { text: "Max iterations: 5 (prevents runaway loops)" },
          { text: "Session timeout: 10 minutes hard stop" },
        ],
      },
      {
        category: "MR Creation — draft only in Phase 3",
        tasks: [
          { text: "Orchestrator creates the MR — agent has no git access" },
          { text: "MR is always draft — never auto-ready-for-merge in Phase 3" },
          { text: "MR labels: agent-generated, needs-review, session:{id}" },
          { text: "MR description: task, diff summary, judge verdict, verify() output" },
        ],
      },
    ],
  },
  {
    id: "phase4",
    label: "Phase 4",
    shortLabel: "Orchestrator + MR",
    weeks: "Wk 4–5",
    color: "bg-purple-500/10",
    borderColor: "border-purple-500",
    ringColor: "ring-purple-500/40",
    textColor: "text-purple-400",
    tagBg: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
    buildingLayers: ["agent"],
    goal: "Automate the full pipeline. Task queue drives sessions. Orchestrator manages lifecycle. Still conservative — same task types, no scope expansion yet.",
    exitCriteria: "Task queue drives 5+ repos. MR rate limiter enforced. Rollback procedure tested end-to-end.",
    groups: [
      {
        category: "Task Queue",
        tasks: [
          { text: "Schema: { task_id, repo, task_type, context, created_by, priority }" },
          { text: "Dequeue only when: kill switch off + domain not paused + under rate limit" },
          { text: "Failed task → DLQ with failure reason; DLQ monitored by a human" },
          { text: "Task types: dependency updates, doc fixes only (no code refactor yet)" },
        ],
      },
      {
        category: "Orchestrator",
        tasks: [
          { text: "Dequeue → clone repo → inject session_id → invoke agent → collect result" },
          { text: "Session lifecycle: start, timeout, kill, complete — all states handled" },
          { text: "Rate limiter: max 5 MRs per repo per hour — hard-coded, not configurable by agent" },
          { text: "Session state persisted: can checkpoint and resume on restart" },
        ],
      },
      {
        category: "MR Creator",
        tasks: [
          { text: "Orchestrator-controlled — agent cannot trigger MR creation directly" },
          { text: "GPG-signed commits or verified-commit marking" },
          { text: "Mandatory labels applied automatically (agent cannot remove them)" },
          { text: "Ready-to-merge gate: judge APPROVE + confidence ≥ 70 + verify() pass" },
        ],
      },
      {
        category: "Observability",
        tasks: [
          { text: "Dashboard: active sessions, queue depth, veto rate, merge rate per domain" },
          { text: "Alert: veto rate > 30% in any domain → page on-call" },
          { text: "Rollback script: given session_id list, revert all associated MRs" },
          { text: "Weekly summary: sessions run, merged, vetoed, human-overridden" },
        ],
      },
    ],
  },
  {
    id: "pilot",
    label: "Pilot",
    shortLabel: "50 sessions, measure",
    weeks: "Wk 5–7",
    color: "bg-rose-500/10",
    borderColor: "border-rose-500",
    ringColor: "ring-rose-500/40",
    textColor: "text-rose-400",
    tagBg: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
    buildingLayers: [],
    goal: "Run 50 sessions on 1–3 repos. Measure everything. Make a documented decision on whether to expand scope or stabilize first.",
    exitCriteria: "50 sessions completed, metrics documented, expansion decision made and written down.",
    groups: [
      {
        category: "Pilot Configuration",
        tasks: [
          { text: "1–3 repos maximum: highest test coverage, most predictable builds" },
          { text: "Task type: dependency updates only — bounded, reversible, measurable" },
          { text: "Change budget: 5 files per session — do not increase during pilot" },
          { text: "Session cap: 5/day in week 1; increase only if metrics are healthy" },
        ],
      },
      {
        category: "Metrics to Track",
        tasks: [
          { text: "MR merge rate: % of agent MRs merged without human changes" },
          { text: "Judge veto rate: % of diffs that LLM Judge vetoed" },
          { text: "Human override rate: % of VETO decisions overridden by a human" },
          { text: "Build failure rate: % of sessions where verify() failed at session end" },
          { text: "Median session duration: task enqueue → MR creation" },
        ],
      },
      {
        category: "Expansion Decision Framework",
        tasks: [
          { text: "Expand repos if: merge rate > 60%, veto rate < 25%, zero security incidents" },
          { text: "Expand task types if: metrics above AND human override rate < 10%" },
          { text: "Do NOT expand both dimensions simultaneously", note: "one variable at a time" },
          { text: "Outside target on any metric: stabilize and investigate first" },
        ],
      },
      {
        category: "Retrospective",
        tasks: [
          { text: "Document every human intervention: trigger, root cause, fix" },
          { text: "Review DLQ: every failed session — find patterns" },
          { text: "Judge calibration: were REVIEW decisions warranted? Tune confidence threshold" },
          { text: "Update change budget based on observed blast radius of failed sessions" },
        ],
      },
    ],
  },
];

// ─── Architecture diagrams per phase ────────────────────────────────────────

function Box({
  label,
  sub,
  color = "default",
  dim = false,
  small = false,
}: {
  label: string;
  sub?: string;
  color?: "emerald" | "amber" | "orange" | "blue" | "purple" | "rose" | "default";
  dim?: boolean;
  small?: boolean;
}) {
  const colorMap: Record<string, string> = {
    emerald: "border-emerald-500/60 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/60 bg-amber-500/10 text-amber-300",
    orange: "border-orange-500/60 bg-orange-500/10 text-orange-300",
    blue: "border-blue-500/60 bg-blue-500/10 text-blue-300",
    purple: "border-purple-500/60 bg-purple-500/10 text-purple-300",
    rose: "border-rose-500/60 bg-rose-500/10 text-rose-300",
    default: "border-[var(--border)] bg-[var(--bg-subtle,#1a1a2e)] text-[var(--fg-muted)]",
  };
  return (
    <div
      className={[
        "rounded border px-2 py-1.5 text-center transition-opacity",
        colorMap[color],
        dim ? "opacity-25" : "",
        small ? "text-[10px]" : "text-xs",
      ].join(" ")}
    >
      <div className="font-semibold font-mono leading-tight">{label}</div>
      {sub && <div className="text-[9px] opacity-70 mt-0.5 leading-tight">{sub}</div>}
    </div>
  );
}

function Arrow({ dir = "down", label }: { dir?: "down" | "right"; label?: string }) {
  if (dir === "right")
    return (
      <div className="flex items-center gap-0.5 text-[var(--fg-muted)] opacity-50 text-xs">
        {label && <span className="text-[9px]">{label}</span>}
        <span>→</span>
      </div>
    );
  return (
    <div className="flex flex-col items-center text-[var(--fg-muted)] opacity-50 text-xs leading-none my-0.5">
      {label && <span className="text-[9px] mb-0.5">{label}</span>}
      <span>↓</span>
    </div>
  );
}

function DiagramPhase1() {
  return (
    <div className="space-y-1.5">
      <div className="border-2 border-emerald-500/60 rounded-lg p-3 bg-emerald-500/5">
        <div className="text-center text-emerald-400 font-semibold font-mono text-xs mb-2.5">
          verify() MCP Tool
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <Box label="Build" sub="mvn compile / npm build" color="emerald" small />
          <Box label="Tests" sub="mvn test / npm test" color="emerald" small />
          <Box label="Lint" sub="PMD / ESLint (new only)" color="emerald" small />
        </div>
      </div>
      <Arrow dir="down" />
      <Box
        label="VerifyResult"
        sub="{ status, failing_tests[], duration_ms }"
        color="emerald"
      />
      <Arrow dir="down" />
      <div className="border border-dashed border-[var(--border)] rounded px-2 py-1.5 text-center opacity-30">
        <span className="text-[10px] font-mono">Agent (not built yet)</span>
      </div>
      <div className="text-[9px] text-emerald-400/50 text-center pt-1">
        Test verify() standalone against 3+ repos before Phase 2
      </div>
    </div>
  );
}

function DiagramPhase2() {
  return (
    <div className="space-y-1.5">
      {/* Kill switch at top */}
      <Box label="Kill Switch" sub="global + per-domain pause" color="orange" />
      <Arrow dir="down" label="checked first" />
      {/* Tool layer */}
      <div className="grid grid-cols-2 gap-1.5">
        <Box label="edit_file" sub="deny list + budget" color="amber" small />
        <Box label="read_file" sub="secret sanitizer" color="amber" small />
      </div>
      <Arrow dir="down" />
      {/* Diff validator */}
      <Box label="Diff Validator" sub="secret scan · test delta · prohibited patterns" color="amber" />
      <Arrow dir="down" />
      {/* Judge */}
      <Box label="LLM Judge" sub="different model family · APPROVE / VETO / REVIEW" color="orange" />
      <Arrow dir="down" />
      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-1.5">
        <Box label="Audit Log" sub="immutable, write-only" color="orange" small />
        <Box label="Circuit Breaker" sub="auto-pause on veto spike" color="orange" small />
        <Box label="DLQ" sub="failed sessions + alert" color="orange" small />
      </div>
      {/* Foundation dimmed */}
      <div className="pt-1 border-t border-[var(--border)] mt-1">
        <Box label="verify() (Phase 1)" sub="already built" color="emerald" dim={false} small />
      </div>
    </div>
  );
}

function DiagramPhase3() {
  return (
    <div className="space-y-1.5">
      {/* Manual trigger */}
      <Box label="You (manual trigger)" sub="no automated dispatch yet" color="default" />
      <Arrow dir="down" />
      {/* Agent */}
      <div className="border-2 border-blue-500/60 rounded-lg p-2 bg-blue-500/5">
        <div className="text-center text-blue-400 font-semibold font-mono text-xs mb-2">
          Agent LLM
        </div>
        <div className="grid grid-cols-4 gap-1">
          <Box label="read_file" color="blue" small />
          <Box label="edit_file" color="blue" small />
          <Box label="verify()" color="emerald" small />
          <Box label="search" color="blue" small />
        </div>
        <div className="text-[9px] text-blue-400/60 text-center mt-1.5">
          5 file budget · no shell · no git · no network
        </div>
      </div>
      <Arrow dir="down" />
      {/* Controls */}
      <Box label="Controls Layer" sub="deny list · budget · sanitizer · diff validator" color="amber" />
      <Arrow dir="down" />
      {/* Judge */}
      <Box label="LLM Judge" sub="APPROVE / VETO / REVIEW" color="orange" />
      <Arrow dir="down" />
      {/* Draft MR */}
      <Box label="Draft MR" sub="orchestrator creates it · agent has no git access" color="blue" />
      <Arrow dir="down" />
      <Box label="Human review" sub="reviews each MR before approving — every one" color="default" />
    </div>
  );
}

function DiagramPhase4() {
  return (
    <div className="space-y-1.5">
      <Box label="Task Queue" sub="task_id · repo · task_type · priority" color="purple" />
      <Arrow dir="down" label="dequeue when kill-switch off + under rate limit" />
      <Box label="Orchestrator" sub="clone repo · inject session_id · manage lifecycle" color="purple" />
      <Arrow dir="down" />
      <div className="grid grid-cols-2 gap-1.5">
        <div className="space-y-1.5">
          <Box label="Agent" sub="5 file budget · isolated clone" color="blue" small />
          <Arrow dir="down" />
          <Box label="verify()" sub="Phase 1 tool" color="emerald" small />
          <Arrow dir="down" />
          <Box label="LLM Judge" sub="APPROVE / VETO" color="orange" small />
          <Arrow dir="down" />
          <Box label="MR Creator" sub="signed · rate-limited" color="purple" small />
        </div>
        <div className="space-y-1.5">
          <Box label="Rate Limiter" sub="5 MRs / repo / hr" color="purple" small />
          <Box label="Audit Log" sub="session_id threads all" color="orange" small />
          <Box label="DLQ" sub="failed sessions" color="orange" small />
          <Box label="Dashboard" sub="veto rate · merge rate" color="purple" small />
        </div>
      </div>
    </div>
  );
}

function DiagramPilot() {
  return (
    <div className="space-y-1.5">
      {/* Full stack indicator */}
      <div className="border border-rose-500/40 rounded-lg p-2.5 bg-rose-500/5">
        <div className="text-[9px] text-rose-400 font-mono text-center mb-2">Full stack running</div>
        <div className="grid grid-cols-2 gap-1">
          <Box label="verify()" color="emerald" small />
          <Box label="Controls" color="amber" small />
          <Box label="Kill Switch" color="orange" small />
          <Box label="Agent" color="blue" small />
        </div>
      </div>
      <Arrow dir="down" />
      {/* Metrics */}
      <div className="border border-rose-500/40 rounded-lg p-2.5 bg-rose-500/5 space-y-1">
        <div className="text-[9px] text-rose-400 font-mono text-center mb-1">50 sessions → measure</div>
        <div className="grid grid-cols-2 gap-1">
          <Box label="MR merge rate" sub="target > 60%" color="rose" small />
          <Box label="Veto rate" sub="target < 25%" color="rose" small />
          <Box label="Human overrides" sub="target < 10%" color="rose" small />
          <Box label="Build failures" sub="track trend" color="rose" small />
        </div>
      </div>
      <Arrow dir="down" />
      {/* Decision */}
      <div className="grid grid-cols-2 gap-1.5">
        <Box label="Expand scope" sub="one dimension at a time" color="rose" small />
        <Box label="Stabilize" sub="investigate first" color="default" small />
      </div>
      <div className="text-[9px] text-rose-400/50 text-center pt-1">
        Never expand repos and task types simultaneously
      </div>
    </div>
  );
}

const DIAGRAMS: Record<string, React.ReactNode> = {
  phase1: <DiagramPhase1 />,
  phase2: <DiagramPhase2 />,
  phase3: <DiagramPhase3 />,
  phase4: <DiagramPhase4 />,
  pilot: <DiagramPilot />,
};

// ─── Main component ──────────────────────────────────────────────────────────

export default function BuildOrderDiagram() {
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const activePhase = PHASES.find((p) => p.id === activePhaseId) ?? null;

  function toggleTask(key: string) {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function countForPhase(phase: PhaseData) {
    const keys = phase.groups.flatMap((g, gi) =>
      g.tasks.map((_, ti) => `${phase.id}::${gi}::${ti}`)
    );
    const done = keys.filter((k) => completedTasks.has(k)).length;
    return { done, total: keys.length };
  }

  return (
    <div className="my-8 rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--bg-subtle,#111827)] px-5 py-3 border-b border-[var(--border)] flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-mono font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
          Build Sequence — click a phase to expand
        </p>
        {completedTasks.size > 0 && (
          <button
            onClick={() => setCompletedTasks(new Set())}
            className="text-[10px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
          >
            reset checklist
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Phase tabs */}
        <div className="flex gap-2 flex-wrap">
          {PHASES.map((phase) => {
            const isActive = activePhaseId === phase.id;
            const { done, total } = countForPhase(phase);
            return (
              <button
                key={phase.id}
                onClick={() => setActivePhaseId(isActive ? null : phase.id)}
                className={[
                  "flex flex-col items-start px-3.5 py-2.5 rounded-lg border transition-all duration-150 text-left min-w-[110px]",
                  isActive
                    ? `${phase.color} ${phase.borderColor} ring-2 ${phase.ringColor}`
                    : "border-[var(--border)] hover:border-[var(--fg-muted)/50]",
                ].join(" ")}
              >
                <span className={`text-xs font-semibold font-mono ${isActive ? phase.textColor : "text-[var(--fg)]"}`}>
                  {phase.label}
                </span>
                <span className="text-[10px] text-[var(--fg-muted)] leading-tight mt-0.5">
                  {phase.shortLabel}
                </span>
                <span className="text-[9px] text-[var(--fg-muted)] opacity-60 mt-1 font-mono">
                  {phase.weeks}
                </span>
                {done > 0 && (
                  <div className="mt-1.5 w-full">
                    <div className="h-0.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${phase.borderColor.replace("border-", "bg-")}`}
                        style={{ width: `${(done / total) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] opacity-50 mt-0.5 block">
                      {done}/{total}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Expanded phase panel */}
        {activePhase && (
          <div className={`rounded-xl border ${activePhase.borderColor} ${activePhase.color} overflow-hidden`}>
            {/* Phase header */}
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-bold font-mono ${activePhase.textColor}`}>
                      {activePhase.label}: {activePhase.shortLabel}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${activePhase.tagBg} font-mono`}>
                      {activePhase.weeks}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--fg)]">{activePhase.goal}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 items-start">
                <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase tracking-wider shrink-0 mt-0.5">
                  Exit criteria:
                </span>
                <span className="text-[11px] text-[var(--fg-muted)] italic">{activePhase.exitCriteria}</span>
              </div>
            </div>

            {/* Two-column body */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
              {/* Left: Checklist */}
              <div className="p-4 space-y-4 overflow-y-auto max-h-[520px]">
                <p className="text-[10px] font-mono text-[var(--fg-muted)] uppercase tracking-wider mb-2">
                  Tasks to complete
                </p>
                {activePhase.groups.map((group, gi) => (
                  <div key={gi}>
                    <div className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${activePhase.textColor} font-mono`}>
                      {group.category}
                    </div>
                    <div className="space-y-1.5">
                      {group.tasks.map((task, ti) => {
                        const key = `${activePhase.id}::${gi}::${ti}`;
                        const done = completedTasks.has(key);
                        return (
                          <button
                            key={ti}
                            onClick={() => toggleTask(key)}
                            className="w-full flex gap-2.5 items-start text-left group"
                          >
                            <span
                              className={[
                                "mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all",
                                done
                                  ? `${activePhase.borderColor} ${activePhase.color}`
                                  : "border-[var(--border)] group-hover:border-[var(--fg-muted)]",
                              ].join(" ")}
                            >
                              {done && (
                                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                  <path d="M1 3L3 5L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={activePhase.textColor} />
                                </svg>
                              )}
                            </span>
                            <span className={`text-xs leading-relaxed ${done ? "line-through opacity-40" : "text-[var(--fg)]"}`}>
                              {task.text}
                              {task.note && (
                                <span className="text-[10px] text-[var(--fg-muted)] ml-1 not-italic">
                                  — {task.note}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Architecture diagram */}
              <div className="p-4">
                <p className="text-[10px] font-mono text-[var(--fg-muted)] uppercase tracking-wider mb-3">
                  Architecture — what you're building
                </p>
                {DIAGRAMS[activePhase.id]}
              </div>
            </div>
          </div>
        )}

        {/* Layer stack — highlights active layers */}
        <div>
          <p className="text-[10px] font-mono text-[var(--fg-muted)] uppercase tracking-wider mb-2">
            Stack position
          </p>
          <div className="flex flex-col gap-1.5">
            {[...LAYERS].reverse().map((layer) => {
              const isBuilding = activePhase?.buildingLayers.includes(layer.id);
              const isBuilt =
                !isBuilding &&
                activePhase &&
                PHASES.findIndex((p) => p.id === activePhase.id) >
                  PHASES.findIndex((p) => p.buildingLayers.includes(layer.id));

              const colorMap: Record<string, string> = {
                emerald: "border-emerald-500/70 bg-emerald-500/15 text-emerald-300",
                amber: "border-amber-500/70 bg-amber-500/15 text-amber-300",
                orange: "border-orange-500/70 bg-orange-500/15 text-orange-300",
                blue: "border-blue-500/70 bg-blue-500/15 text-blue-300",
              };

              return (
                <div
                  key={layer.id}
                  className={[
                    "px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all duration-200",
                    isBuilding
                      ? colorMap[layer.color]
                      : isBuilt
                      ? "border-[var(--border)] opacity-60"
                      : "border-[var(--border)] opacity-25",
                  ].join(" ")}
                >
                  <span className={isBuilding ? "font-semibold" : ""}>{layer.label}</span>
                  {isBuilding && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-current/20 shrink-0">
                      building now
                    </span>
                  )}
                  {isBuilt && (
                    <span className="text-[9px] font-mono opacity-50 shrink-0">✓ built</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rule */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle,#111827)] px-4 py-3">
          <p className="text-sm text-[var(--fg)]">
            The agent is the most exciting component.{" "}
            <span className="font-semibold">It is also the last thing you build.</span>{" "}
            Every layer below it must exist, be tested, and have a kill switch before the agent runs its first session.
          </p>
        </div>
      </div>
    </div>
  );
}
