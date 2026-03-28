"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PromptVariant {
  id: string;
  label: string;
  style: string;
  transform: (input: string) => string;
  responseStyle: string;
  responseTraits: string[];
}

interface Scenario {
  id: string;
  label: string;
  baseQuestion: string;
  responses: Record<string, string>;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const VARIANTS: PromptVariant[] = [
  {
    id: "casual",
    label: "Casual",
    style: "Hey, can you tell me about",
    transform: (q) => `Hey, can you tell me about ${q}?`,
    responseStyle: "Informal, friendly, uses analogies and conversational tone",
    responseTraits: ["Uses 'you'", "Analogies", "Short sentences", "Skips caveats"],
  },
  {
    id: "formal",
    label: "Formal / Technical",
    style: "Please provide a comprehensive analysis of",
    transform: (q) => `Please provide a comprehensive technical analysis of ${q}, including key mechanisms, trade-offs, and practical implications.`,
    responseStyle: "Structured, detailed, uses precise terminology",
    responseTraits: ["Headers/lists", "Technical terms", "Caveats included", "Longer output"],
  },
  {
    id: "eli5",
    label: "ELI5",
    style: "Explain like I'm five:",
    transform: (q) => `Explain ${q} like I'm five years old. Use simple words and a fun analogy.`,
    responseStyle: "Simple vocabulary, playful metaphors, very short",
    responseTraits: ["Simple words", "Fun metaphor", "Very short", "No jargon"],
  },
];

const SCENARIOS: Scenario[] = [
  {
    id: "gradient",
    label: "gradient descent",
    baseQuestion: "gradient descent",
    responses: {
      casual: `So gradient descent is basically how neural networks learn! Imagine you're blindfolded on a hilly field and you need to find the lowest valley. You'd feel the ground around your feet and take a step downhill, right? That's literally what the model does — except the "hill" is the error rate, and each step is an adjustment to the weights.

The trick is step size. Too big and you overshoot the valley. Too small and you're there all day. That's what the learning rate controls.`,
      formal: `Gradient descent is an iterative optimisation algorithm used to minimise a differentiable loss function by updating model parameters in the direction of the negative gradient.

**Core mechanism:**
- Compute the gradient ∇L(θ) of the loss function with respect to parameters θ
- Update rule: θ_{t+1} = θ_t - η · ∇L(θ_t), where η is the learning rate

**Key variants:**
- **Batch GD**: Uses entire dataset per update — stable but computationally expensive
- **Stochastic GD (SGD)**: Single sample per update — noisy but fast convergence
- **Mini-batch GD**: Compromise using subset of data — standard in practice

**Trade-offs:** Learning rate selection remains the primary challenge. Adaptive methods (Adam, AdaGrad, RMSProp) adjust per-parameter rates but introduce additional hyperparameters.`,
      eli5: `Imagine you're on a really big slide at the playground, but it's dark and you can't see! You wiggle your feet to feel which way is "down" and take a tiny step that way. Then you wiggle again and take another step.

You keep doing this until you reach the very bottom of the slide. That's how a computer learns — it keeps taking tiny steps toward the right answer! 🎢`,
    },
  },
  {
    id: "kubernetes",
    label: "Kubernetes",
    baseQuestion: "Kubernetes",
    responses: {
      casual: `Kubernetes (everyone calls it K8s) is basically a system that manages your containers for you. Think of it like an air traffic controller for your apps — it decides where each container runs, restarts them if they crash, and scales them up when traffic spikes.

You tell K8s "I want 3 copies of my web server running" and it just... makes that happen. Container dies at 3am? K8s restarts it before your pager goes off. Pretty sweet.`,
      formal: `Kubernetes is a container orchestration platform that automates deployment, scaling, and management of containerised applications across distributed infrastructure.

**Architecture:**
- **Control plane**: API server, scheduler, controller manager, etcd (cluster state store)
- **Worker nodes**: kubelet, kube-proxy, container runtime (containerd/CRI-O)

**Core abstractions:**
- **Pod**: Smallest deployable unit — one or more co-located containers sharing network/storage
- **Deployment**: Declarative pod lifecycle management with rolling updates and rollbacks
- **Service**: Stable network endpoint abstracting pod IP churn via label selectors
- **Ingress**: Layer 7 routing for external HTTP/HTTPS traffic

**Operational considerations:** Resource quota management, namespace isolation, RBAC policy design, and persistent volume provisioning are critical for production readiness.`,
      eli5: `Imagine you have a bunch of toy robots, and each one knows how to do one job — like making sandwiches or pouring juice.

Kubernetes is like a really smart babysitter who watches all the robots. If one falls over, the babysitter picks it up and turns it back on. If lots of people want sandwiches, the babysitter wakes up MORE sandwich robots! 🤖`,
    },
  },
  {
    id: "attention",
    label: "attention mechanism",
    baseQuestion: "the attention mechanism in transformers",
    responses: {
      casual: `Attention is the thing that made modern AI actually work well! Before attention, models processed text word by word in order, which meant by the time you reached the end of a long sentence, the beginning was basically forgotten.

Attention says "hey, for this word I'm generating, let me look BACK at every word in the input and decide which ones matter most right now." It's like having a highlighter that lights up the important parts of a sentence differently depending on what question you're asking.`,
      formal: `The attention mechanism computes a weighted representation of input elements where weights reflect pairwise relevance to a given query position.

**Scaled dot-product attention:**
- Attention(Q, K, V) = softmax(QK^T / √d_k) · V
- Q (queries), K (keys), V (values) are linear projections of input embeddings
- Scaling factor √d_k prevents softmax saturation in high dimensions

**Multi-head attention:**
- Applies h parallel attention functions with independent learned projections
- Concatenates outputs and projects: MultiHead = Concat(head_1,...,head_h)W^O
- Enables simultaneous attention to different representation subspaces

**Computational complexity:** O(n²d) for sequence length n and dimension d. This quadratic scaling with sequence length motivates sparse attention variants (Longformer, BigBird) and linear attention approximations.`,
      eli5: `Imagine you're reading a storybook with your friend, and they ask "who took the cookie?"

You'd go back through the pages and your eyes would jump to the important parts — the character names, the word "cookie," the sneaky part. You'd skip the boring descriptions.

That's what attention does! When the computer is thinking about one word, it looks back at ALL the other words and decides which ones to pay extra attention to. 👀📖`,
    },
  },
];

// ─── Typewriter hook ─────────────────────────────────────────────────────────

function useTypewriter(text: string, speed: number = 12) {
  const [displayed, setDisplayed] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;
    setIsTyping(true);
    const id = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= text.length) {
        setDisplayed(text);
        setIsTyping(false);
        clearInterval(id);
      } else {
        setDisplayed(text.slice(0, indexRef.current));
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return { displayed, isTyping };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PromptSensitivityDemo() {
  const [activeScenario, setActiveScenario] = useState("gradient");
  const [activeVariant, setActiveVariant] = useState("casual");
  const [customInput, setCustomInput] = useState("");

  const scenario = SCENARIOS.find((s) => s.id === activeScenario)!;
  const variant = VARIANTS.find((v) => v.id === activeVariant)!;

  const topic = customInput.trim() || scenario.baseQuestion;
  const fullPrompt = variant.transform(topic);
  const responseText = scenario.responses[activeVariant];

  const { displayed, isTyping } = useTypewriter(responseText, 8);

  const variantColors: Record<string, { border: string; bg: string; text: string; badge: string }> = {
    casual:  { border: "border-emerald-500/50", bg: "bg-emerald-500/8",  text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" },
    formal:  { border: "border-blue-500/50",    bg: "bg-blue-500/8",     text: "text-blue-400",    badge: "bg-blue-500/20 text-blue-300 border border-blue-500/30" },
    eli5:    { border: "border-amber-500/50",   bg: "bg-amber-500/8",    text: "text-amber-400",   badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30" },
  };
  const vc = variantColors[activeVariant];

  return (
    <div className="my-8 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">

      {/* Header with topic selector */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs font-mono text-[var(--fg-muted)]">prompt-sensitivity-lab</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs text-[var(--fg-muted)] leading-relaxed self-center mr-1">Topic:</span>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveScenario(s.id); setCustomInput(""); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                activeScenario === s.id && !customInput
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--fg-subtle)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt style selector */}
      <div className="flex border-b border-[var(--border)]">
        {VARIANTS.map((v) => {
          const isActive = activeVariant === v.id;
          const c = variantColors[v.id];
          return (
            <button
              key={v.id}
              onClick={() => setActiveVariant(v.id)}
              className={`flex-1 px-4 py-3 text-left transition-all cursor-pointer border-b-2 ${
                isActive ? `${c.border} ${c.bg}` : "border-transparent hover:bg-[var(--bg)]"
              }`}
            >
              <div className={`text-xs font-bold ${isActive ? c.text : "text-[var(--fg-muted)]"}`}>
                {v.label}
              </div>
              <div className="text-xs text-[var(--fg-muted)] mt-0.5 leading-tight hidden sm:block">{v.responseStyle}</div>
            </button>
          );
        })}
      </div>

      {/* Prompt display */}
      <div className={`px-5 py-3 border-b border-[var(--border)] ${vc.bg} transition-all duration-300`}>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-2">Actual Prompt Sent</p>
        <div className={`rounded-md border ${vc.border} bg-[var(--bg)] px-4 py-3`}>
          <p className="text-sm font-mono text-[var(--fg)] leading-relaxed">{fullPrompt}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {variant.responseTraits.map((trait) => (
            <span key={trait} className={`text-xs px-2 py-0.5 rounded-full ${vc.badge}`}>
              {trait}
            </span>
          ))}
        </div>
      </div>

      {/* Response output — typewriter */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)]">Model Response</p>
          {isTyping && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${vc.badge} animate-pulse`}>
              generating...
            </span>
          )}
        </div>
        <div className={`rounded-lg border ${vc.border} bg-[var(--bg)] p-5 min-h-[200px] transition-all duration-300`}>
          <pre className="text-sm font-sans leading-relaxed whitespace-pre-wrap text-[var(--fg)]">
            {displayed}
            {isTyping && <span className={`inline-block w-2 h-4 ml-0.5 ${vc.text.replace("text-", "bg-")} animate-pulse`} />}
          </pre>
        </div>
      </div>

      {/* Insight bar */}
      <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--bg)]">
        <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
          <span className="font-semibold text-[var(--fg)]">The same knowledge, different packaging.</span>{" "}
          The model has the same training data for all three prompts. What changes is the probability distribution over output tokens — formal phrasing activates patterns the model learned from technical documentation, casual phrasing activates conversational patterns, and ELI5 activates simplified explanation patterns. The wording of your prompt is a content-free signal that shifts the entire output distribution.
        </p>
      </div>
    </div>
  );
}
