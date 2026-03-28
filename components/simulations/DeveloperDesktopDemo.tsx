"use client";

import { useState } from "react";

interface ZoneDetail {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  items: { label: string; detail: string }[];
  snippet: { filename: string; code: string };
  insight: string;
}

interface Zone {
  id: string;
  icon: string;
  label: string;
  sublabel: string;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  badgeColor: string;
  detail: ZoneDetail;
}

const ZONES: Zone[] = [
  {
    id: "skills",
    icon: "📚",
    label: "Skills Library",
    sublabel: "Institutional knowledge, encoded",
    accentColor: "emerald",
    borderColor: "border-emerald-500/60",
    bgColor: "bg-emerald-500/8",
    textColor: "text-emerald-400",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    detail: {
      title: "Zone 1 — The Skills Library",
      subtitle: "~/.cursor/skills/ or your enterprise skill registry",
      badge: "Low Risk · Foundation Layer",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
      description:
        "Skills are not documentation files. They are versioned folders containing instructions, concrete code examples from your actual codebase, gotcha files covering what the agent gets wrong by default, and executable verification scripts the agent can run. The platform team publishes them. Developers pull them. The agent reads them before generating any code.",
      items: [
        { label: "cassandra-patterns/", detail: "CQL idioms, keyspace naming conventions, gotchas the agent makes with non-parameterised queries" },
        { label: "jbpm-handler-stubs/", detail: "Process handler templates, @WorkItemHandler annotation patterns, what files to never touch" },
        { label: "oracle-sp-conventions/", detail: "Stored procedure call patterns, JDBC parameter binding, schema name conventions" },
        { label: "domain-service-scaffold/", detail: "New Spring Boot service with your annotations, logging, and deploy config pre-wired" },
        { label: "product-verification/", detail: "The most important skill — runs build/test/lint and surfaces clean output to the agent. Build this first." },
        { label: "channel-patterns/", detail: "Per SOE channel (digital, CC, POS, IVR, chatbot) component patterns and what is blocked" },
      ],
      snippet: {
        filename: "~/.cursor/skills/cassandra-patterns/SKILL.md",
        code: `# Cassandra Query Patterns

## When to use this skill
When writing or reviewing any Java class that imports
com.datastax.oss.driver or touches the customer_keyspace.

## Gotchas (read carefully)
- NEVER use session.execute() with a string literal. Always use
  PreparedStatement. The agent will try to inline strings. Block it.
- Keyspace names are lowercase_with_underscores in this codebase.
  The agent often PascalCases them. Do not.
- TTL values are defined in application.yaml, not hardcoded.

## Canonical patterns
See examples/ for before/after snippets from real PRs.

## Verification
Run: ./scripts/validate_cql.sh <file>
Returns exit 0 on clean, exit 1 with error line on violation.`,
      },
      insight: "Build Product Verification first. Spotify found this worth a full engineer-week per agent type. Without it, the agent has no ground truth and produces output it cannot validate.",
    },
  },
  {
    id: "config",
    icon: "⚙️",
    label: "Agent Configuration",
    sublabel: "Tier-locked, platform-managed",
    accentColor: "amber",
    borderColor: "border-amber-500/60",
    bgColor: "bg-amber-500/8",
    textColor: "text-amber-400",
    badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    detail: {
      title: "Zone 2 — The Agent Configuration Layer",
      subtitle: "agent_config.yaml — fetched from central platform, not written by the developer",
      badge: "Medium Risk · Platform Enforced",
      badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
      description:
        "The developer does not write this file. They run ./setup.sh --service customer-profile-service and the platform's setup script fetches the right configuration from the central registry, validates it against the platform baseline, and writes it locally. Every session start re-checks config freshness. If the platform team pushes a new deny list entry, the developer's next session picks it up automatically.",
      items: [
        { label: "allowed_repos", detail: "Exactly which repositories this agent can touch — no wildcards" },
        { label: "permitted_task_types", detail: "dependency_update, lint_fix, doc_improvement, test_coverage — no open-ended tasks" },
        { label: "change_budget", detail: "Max files per session (Tier 1: 2, Tier 2: 3, Tier 3: 5, Tier 4: 10)" },
        { label: "deny_list", detail: "Global deny list + schema deny + channel deny merged at setup time" },
        { label: "judge_model", detail: "Which LLM family to use as judge — must differ from the coding agent's family" },
        { label: "kill_switch_endpoint", detail: "Platform URL checked at session start — under 30 seconds to pause globally" },
      ],
      snippet: {
        filename: "~/projects/customer-profile-service/.agent/agent_config.yaml",
        code: `# Generated by setup.sh — do not edit manually
# Last synced: 2026-03-18T09:12:00Z
# Config hash: sha256:a3f9...

service: customer-profile-service
tier: tier3_standard
allowed_repos:
  - org/customer-profile-service

permitted_task_types:
  - dependency_update
  - lint_fix
  - doc_improvement
  - test_coverage

change_budget: 5

judge:
  model_family: openai   # agent uses anthropic
  confidence_gate: 70
  
kill_switch_endpoint: https://agent-platform.internal/kill-switch
audit_endpoint: https://agent-platform.internal/audit

deny_list_ref: global_deny_v14 + schema_deny_v3`,
      },
      insight: "The configuration is the guardrail. A developer cannot accidentally misconfigure scope — the platform team sets the boundaries and setup.sh enforces them. Config drift is caught at session start.",
    },
  },
  {
    id: "verify",
    icon: "🔄",
    label: "Verification Loop",
    sublabel: "verify() → judge → MR",
    accentColor: "orange",
    borderColor: "border-orange-500/60",
    bgColor: "bg-orange-500/8",
    textColor: "text-orange-400",
    badgeColor: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
    detail: {
      title: "Zone 3 — The Verification Loop",
      subtitle: "The feedback engine that makes agent output trustworthy",
      badge: "High Risk Zone · Most Critical to Build",
      badgeColor: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
      description:
        "This is the most important zone on the developer desktop. The verifier auto-detects the build system (Maven pom.xml? Spring Boot? Oracle JDBC?), runs build/test/lint, strips noise from the output, and returns clean pass/fail to the agent. On top of that, an LLM Judge — using a different model family — reviews the diff against the task and returns a structured verdict with a confidence score. Spotify's judge vetoes roughly 25% of sessions. The agent corrects itself about half the time when vetoed.",
      items: [
        { label: "verify() MCP tool", detail: "Auto-detects build system, runs formatters + linters + tests, summarises log output — agent gets clean pass/fail, not 800 lines of Maven output" },
        { label: "Gate 3: Diff validator", detail: "Deterministic checks: secret scan, test count delta, prohibited patterns (@Ignore, eslint-disable, maven.test.skip)" },
        { label: "Gate 4: LLM Judge", detail: "Different model family from coding agent. Structured JSON verdict: {verdict, confidence, scope_violations, test_integrity_issues}" },
        { label: "Confidence gate", detail: "APPROVE with confidence < 70 is auto-downgraded to REVIEW. Low-confidence approvals route to human queue." },
        { label: "Stop hook", detail: "If any verifier fails, no PR is opened. The session surfaces the error for the developer to review." },
        { label: "Self-correction loop", detail: "Agent receives judge feedback and retries. Up to 3 session retries before dead-letter queue." },
      ],
      snippet: {
        filename: "session output — verify() tool call",
        code: `[gate3] Running diff validation...
  ✓ Secret scan: clean
  ✓ Test count: 142 → 144 (+2, baseline met)
  ✓ Coverage: 78.4% → 78.9% (+0.5%)
  ✓ Prohibited patterns: none found

[gate4] LLM Judge (gpt-4o reviewing claude-3-5-sonnet diff)...
  verdict: APPROVE
  confidence: 84
  scope_violations: []
  test_integrity_issues: []
  reasoning: "Dependency version bump in pom.xml,
    no logic changes, tests pass and increase."

[gate5] Creating MR via orchestrator...
  title: "chore: update spring-boot-starter-parent 3.1→3.2"
  labels: [ai-generated, agent-session:sess_abc123, tier3]
  ✓ MR #4821 opened`,
      },
      insight: "The verify() tool and LLM Judge are what separate a coding agent from a code generator. Without this loop, the agent produces output it has no way to validate — and neither do you.",
    },
  },
  {
    id: "platform",
    icon: "🌐",
    label: "Platform Connection",
    sublabel: "Kill switch · Audit · Config sync",
    accentColor: "blue",
    borderColor: "border-blue-500/60",
    bgColor: "bg-blue-500/8",
    textColor: "text-blue-400",
    badgeColor: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    detail: {
      title: "Zone 4 — The Platform Connection",
      subtitle: "The developer's desktop is a node in the platform, not an island",
      badge: "Control Plane · Platform Team Owned",
      badgeColor: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
      description:
        "Every session start phones home. The desktop runner checks the kill switch endpoint — under 30 seconds to pause all agent sessions globally, or just one domain. It compares its local config hash against the platform registry — stale config means the session is blocked until the developer re-runs setup. Every tool call, LLM prompt, judge verdict, and MR link is written to the central append-only audit log under a single session_id. The platform team sees everything. The agent sees none of the audit log.",
      items: [
        { label: "Kill switch check", detail: "Redis-backed global pause flag checked before Gate 0. Under 30 seconds from trigger to full stop across all developer desktops." },
        { label: "Per-domain circuit breaker", detail: "If judge veto rate exceeds 40% in a rolling 10-session window, that domain is auto-paused and Slack alert sent. Human must re-enable." },
        { label: "Config freshness check", detail: "Local config hash vs. platform registry. Session blocked if stale — platform team pushes deny list updates automatically." },
        { label: "Central audit log", detail: "Append-only, write-only from agent perspective. Single session_id threads: task, tool calls, prompts, judge verdict, MR link." },
        { label: "Dead-letter queue", detail: "Failed or aborted sessions land here. Platform team reviews before domain is re-enabled after a trip." },
        { label: "Compliance dashboard", detail: "Platform team sees: sessions/team, judge approval rate by tier, Gate 3 rejection reasons, services with elevated veto rates." },
      ],
      snippet: {
        filename: "session start — platform checks",
        code: `[startup] Checking kill switch...
  GET https://agent-platform.internal/kill-switch
  global: ACTIVE
  domain:customer: ACTIVE  ✓

[startup] Checking config freshness...
  local hash:    sha256:a3f9...
  platform hash: sha256:a3f9...  ✓ up to date

[startup] Session registered: sess_abc123
  service: customer-profile-service
  tier:    tier3_standard
  task:    dependency_update

[audit] Streaming session events → 
  https://agent-platform.internal/audit/sess_abc123`,
      },
      insight: "The platform team's superpower is the compliance dashboard and the circuit breaker. They don't review every session — they review the pattern. When a domain's veto rate spikes, the circuit breaker acts before they need to.",
    },
  },
];

export default function DeveloperDesktopDemo() {
  const [activeZone, setActiveZone] = useState<string>("skills");

  const active = ZONES.find((z) => z.id === activeZone)!;
  const d = active.detail;

  return (
    <div className="my-8 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs font-mono text-[var(--fg-muted)]">enterprise-developer-desktop — agent session</span>
      </div>

      {/* Zone grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {ZONES.map((zone) => {
          const isActive = zone.id === activeZone;
          return (
            <button
              key={zone.id}
              onClick={() => setActiveZone(zone.id)}
              className={`rounded-lg border p-4 text-left transition-all duration-200 cursor-pointer ${
                isActive
                  ? `${zone.borderColor} ${zone.bgColor} shadow-sm`
                  : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--fg-subtle)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5">{zone.icon}</span>
                <div className="min-w-0">
                  <div className={`text-sm font-semibold leading-tight ${isActive ? zone.textColor : "text-[var(--fg)]"}`}>
                    {zone.label}
                  </div>
                  <div className="text-xs text-[var(--fg-muted)] mt-0.5 leading-snug">{zone.sublabel}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      <div className="mx-4 mb-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
        {/* Panel header */}
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-[var(--fg)]">{d.title}</h3>
              <p className="text-xs text-[var(--fg-muted)] font-mono mt-0.5">{d.subtitle}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${d.badgeColor}`}>
              {d.badge}
            </span>
          </div>
          <p className="text-sm text-[var(--fg-muted)] mt-3 leading-relaxed">{d.description}</p>
        </div>

        {/* Contents */}
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
          {/* Left: items list */}
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-3">Contents</p>
            <ul className="space-y-3">
              {d.items.map((item) => (
                <li key={item.label} className="flex gap-3 items-start">
                  <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${active.textColor.replace("text-", "bg-")}`} />
                  <div>
                    <span className="text-xs font-mono font-semibold text-[var(--fg)]">{item.label}</span>
                    <p className="text-xs text-[var(--fg-muted)] mt-0.5 leading-snug">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: code snippet */}
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-3">Example</p>
            <div className="rounded-md border border-[var(--border)] overflow-hidden">
              <div className="px-3 py-2 bg-[var(--code-bg)] border-b border-[var(--border)] flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--fg-muted)] truncate">{d.snippet.filename}</span>
              </div>
              <pre className="p-3 text-xs font-mono text-[var(--fg-muted)] overflow-x-auto leading-relaxed whitespace-pre-wrap bg-[var(--code-bg)]">
                <code>{d.snippet.code}</code>
              </pre>
            </div>

            {/* Insight callout */}
            <div className={`mt-4 rounded-md p-3 ${active.badgeColor} border`} style={{borderColor: "transparent"}}>
              <p className="text-xs leading-relaxed">
                <span className="font-semibold">Key insight: </span>
                {d.insight}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
