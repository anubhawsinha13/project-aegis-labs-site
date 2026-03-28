"use client";

import { useState, useEffect, useRef } from "react";

interface Problem {
  id: string;
  label: string;
  icon: string;
  question: string;
  directResponse: string;
  directCorrect: boolean;
  cotResponse: string;
  cotCorrect: boolean;
}

const PROBLEMS: Problem[] = [
  {
    id: "math",
    label: "Word Problem",
    icon: "🧮",
    question: "A store sells apples for $2 each. If I buy 3 apples and pay with a $20 bill, how much change should I receive? Also, how many more apples could I buy with the change?",
    directResponse: `You should receive $14 in change, and you could buy 6 more apples.

(Note: Jumped straight to the answer — but got it wrong. $20 - $6 = $14, and $14 / $2 = 7, not 6.)`,
    directCorrect: false,
    cotResponse: `Let me work through this step by step.

Step 1: Calculate the cost of 3 apples
  3 apples × $2 per apple = $6

Step 2: Calculate the change from $20
  $20 - $6 = $14

Step 3: How many more apples can I buy with $14?
  $14 ÷ $2 per apple = 7 apples

Answer: You receive $14 in change and could buy 7 more apples.

(Note: Each step is verifiable. The reasoning chain catches what direct mode missed.)`,
    cotCorrect: true,
  },
  {
    id: "logic",
    label: "Logic Puzzle",
    icon: "🧩",
    question: "If all roses are flowers, and some flowers fade quickly, can we conclude that some roses fade quickly?",
    directResponse: `Yes, since all roses are flowers and some flowers fade quickly, some roses must also fade quickly.

(Note: WRONG. This is a classic syllogistic fallacy. "Some flowers fade quickly" does not mean the ones that fade are roses. The fading flowers could be tulips or daisies.)`,
    directCorrect: false,
    cotResponse: `Let me think through the logical structure.

Premise 1: All roses are flowers (Roses ⊂ Flowers)
Premise 2: Some flowers fade quickly (∃x: Flower(x) ∧ FadesQuickly(x))

Question: Does it follow that some roses fade quickly?

Step 1: "All roses are flowers" means every rose is in the set of flowers.
Step 2: "Some flowers fade quickly" means there exists at least one flower that fades quickly.
Step 3: But we don't know WHICH flowers fade quickly. The flowers that fade quickly could be entirely outside the rose subset — they could be tulips, daisies, or any other flower.

Conclusion: No, we CANNOT conclude that some roses fade quickly. This is a formal logical fallacy (undistributed middle term). The fading flowers might not include any roses at all.

(Note: The reasoning chain explicitly maps out the set relationships and catches the fallacy.)`,
    cotCorrect: true,
  },
  {
    id: "code",
    label: "Code Bug",
    icon: "🐛",
    question: "What's wrong with this code?\n\ndef get_average(numbers):\n    total = 0\n    for n in numbers:\n        total += n\n    return total / len(numbers)",
    directResponse: `The code looks correct for calculating an average. It sums all numbers and divides by the count.

(Note: Missed the bug. What happens when the list is empty? Division by zero.)`,
    directCorrect: false,
    cotResponse: `Let me trace through this function step by step.

Step 1: What does the function do?
  - Initializes total to 0
  - Iterates over numbers, adding each to total
  - Returns total divided by the length of numbers

Step 2: What inputs could cause problems?
  - Normal list like [1, 2, 3]: total=6, len=3, returns 2.0 ✓
  - Single element [5]: total=5, len=1, returns 5.0 ✓
  - Empty list []: total=0, len=0, returns... 0/0 → ZeroDivisionError ✗

Step 3: The bug is a missing empty-list check.

Fix:
def get_average(numbers):
    if not numbers:
        return 0  # or raise ValueError
    total = 0
    for n in numbers:
        total += n
    return total / len(numbers)

(Note: The step-by-step trace tested edge cases that direct mode skipped.)`,
    cotCorrect: true,
  },
  {
    id: "spatial",
    label: "Spatial Reasoning",
    icon: "🗺",
    question: "I'm facing north. I turn right 90 degrees, then turn right again 90 degrees, then turn left 90 degrees. Which direction am I now facing?",
    directResponse: `After turning right twice and left once, you are facing south.

(Note: Plausible-sounding but wrong. Let's check with the chain of thought version.)`,
    directCorrect: false,
    cotResponse: `Let me track each turn.

Starting direction: North

Turn 1: Right 90° from North
  North → East
  Now facing: East

Turn 2: Right 90° from East
  East → South
  Now facing: South

Turn 3: Left 90° from South
  South → East
  Now facing: East

Final answer: East.

(Note: By tracking each intermediate state explicitly, the model avoids compounding errors across multiple sequential transformations.)`,
    cotCorrect: true,
  },
];

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

export default function ChainOfThoughtDemo() {
  const [activeProblem, setActiveProblem] = useState("math");
  const [mode, setMode] = useState<"direct" | "cot">("direct");

  const problem = PROBLEMS.find((p) => p.id === activeProblem)!;
  const response = mode === "direct" ? problem.directResponse : problem.cotResponse;
  const correct = mode === "direct" ? problem.directCorrect : problem.cotCorrect;
  const { displayed, done } = useTypewriter(response, 6);

  return (
    <div className="my-8 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
      {/* Problem selector */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto">
        {PROBLEMS.map((p) => (
          <button key={p.id} onClick={() => { setActiveProblem(p.id); setMode("direct"); }}
            className={`flex-1 min-w-[110px] px-4 py-3 text-left transition-all cursor-pointer border-b-2 ${
              activeProblem === p.id ? "border-[var(--accent)] bg-[var(--bg)]" : "border-transparent hover:bg-[var(--bg)]"
            }`}>
            <div className={`text-xs font-bold ${activeProblem === p.id ? "text-[var(--accent)]" : "text-[var(--fg-muted)]"}`}>
              {p.icon} {p.label}
            </div>
          </button>
        ))}
      </div>

      {/* Mode toggle */}
      <div className="px-5 py-3 border-b border-[var(--border)]">
        <div className="flex gap-2">
          <button onClick={() => setMode("direct")}
            className={`flex-1 px-4 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              mode === "direct"
                ? "border-red-500/50 bg-red-500/10 text-red-400"
                : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--fg-subtle)]"
            }`}>
            Direct Answer — no reasoning
          </button>
          <button onClick={() => setMode("cot")}
            className={`flex-1 px-4 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              mode === "cot"
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--fg-subtle)]"
            }`}>
            Chain of Thought — "think step by step"
          </button>
        </div>
      </div>

      {/* Question */}
      <div className="px-5 py-3 border-b border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-2">Question</p>
        <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
          <pre className="text-sm font-sans leading-relaxed whitespace-pre-wrap text-[var(--fg)]">{problem.question}</pre>
        </div>
      </div>

      {/* Response */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)]">
            {mode === "direct" ? "Direct Response" : "Chain-of-Thought Response"}
          </p>
          <div className="flex items-center gap-2">
            {!done && <span className="text-xs text-[var(--accent)] animate-pulse">generating...</span>}
            {done && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                correct
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-red-500/20 text-red-300 border border-red-500/30"
              }`}>
                {correct ? "✓ Correct" : "✗ Incorrect"}
              </span>
            )}
          </div>
        </div>
        <div className={`rounded-lg border bg-[var(--bg)] p-5 min-h-[180px] transition-all duration-300 ${
          done ? (correct ? "border-emerald-500/40" : "border-red-500/40") : "border-[var(--border)]"
        }`}>
          <pre className="text-sm font-sans leading-relaxed whitespace-pre-wrap text-[var(--fg)]">
            {displayed}
            {!done && <span className="inline-block w-2 h-4 ml-0.5 bg-[var(--accent)] animate-pulse" />}
          </pre>
        </div>
      </div>

      {/* Scoreboard */}
      {done && (
        <div className="px-5 py-3 border-t border-[var(--border)]">
          <div className="flex gap-4">
            <div className={`flex-1 rounded-md p-3 text-center ${problem.directCorrect ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
              <div className="text-xs text-[var(--fg-muted)] mb-1">Direct</div>
              <div className={`text-sm font-bold ${problem.directCorrect ? "text-emerald-400" : "text-red-400"}`}>
                {problem.directCorrect ? "✓ Correct" : "✗ Wrong"}
              </div>
            </div>
            <div className={`flex-1 rounded-md p-3 text-center ${problem.cotCorrect ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
              <div className="text-xs text-[var(--fg-muted)] mb-1">Chain of Thought</div>
              <div className={`text-sm font-bold ${problem.cotCorrect ? "text-emerald-400" : "text-red-400"}`}>
                {problem.cotCorrect ? "✓ Correct" : "✗ Wrong"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--bg)]">
        <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
          <span className="font-semibold text-[var(--fg)]">Reasoning is not decoration — it is computation.</span>{" "}
          When the model writes intermediate steps, each step becomes context for the next token prediction. The visible reasoning chain constrains the output at each stage, making errors detectable before they compound. Direct answers skip this constraint — the model jumps to a final answer without verifying each intermediate state.
        </p>
      </div>
    </div>
  );
}
