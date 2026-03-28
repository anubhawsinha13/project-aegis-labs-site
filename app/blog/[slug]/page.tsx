import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPost } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import TokenizerDemo from "@/components/simulations/TokenizerDemo";
import ContextWindowDemo from "@/components/simulations/ContextWindowDemo";
import GuardrailDemo from "@/components/simulations/GuardrailDemo";
import BuildOrderDiagram from "@/components/simulations/BuildOrderDiagram";
import DefenseArchDiagram from "@/components/simulations/DefenseArchDiagram";
import DeveloperDesktopDemo from "@/components/simulations/DeveloperDesktopDemo";
import StageProgressionDemo from "@/components/simulations/StageProgressionDemo";
import TemperatureDemo from "@/components/simulations/TemperatureDemo";
import PromptSensitivityDemo from "@/components/simulations/PromptSensitivityDemo";
import FewShotDemo from "@/components/simulations/FewShotDemo";
import HallucinationDemo from "@/components/simulations/HallucinationDemo";
import SystemPromptDemo from "@/components/simulations/SystemPromptDemo";
import ChainOfThoughtDemo from "@/components/simulations/ChainOfThoughtDemo";
import RAGDemo from "@/components/simulations/RAGDemo";
import TokensDemo from "@/components/simulations/TokensDemo";
import PromptInjectionDemo from "@/components/simulations/PromptInjectionDemo";
import LLMJudgeDemo from "@/components/simulations/LLMJudgeDemo";
import StructuredOutputDemo from "@/components/simulations/StructuredOutputDemo";

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

const components = {
  TokenizerDemo,
  ContextWindowDemo,
  GuardrailDemo,
  BuildOrderDiagram,
  DefenseArchDiagram,
  DeveloperDesktopDemo,
  StageProgressionDemo,
  TemperatureDemo,
  PromptSensitivityDemo,
  FewShotDemo,
  HallucinationDemo,
  SystemPromptDemo,
  ChainOfThoughtDemo,
  RAGDemo,
  TokensDemo,
  PromptInjectionDemo,
  LLMJudgeDemo,
  StructuredOutputDemo,
};

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link
        href="/blog/"
        className="inline-flex items-center gap-1 text-xs text-[var(--fg-muted)] hover:text-[var(--accent)] mb-8 transition-colors"
      >
        ← Back to Insights
      </Link>

      <header className="mb-8">
        <div className="text-xs text-[var(--fg-muted)] font-mono mb-3">
          {new Date(post.date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          {post.readingTime && <> · {post.readingTime}</>}
        </div>
        <h1 className="text-3xl font-bold text-[var(--fg)] leading-tight">{post.title}</h1>
        {post.description && <p className="mt-3 text-[var(--fg-muted)]">{post.description}</p>}
        {(post.tags?.length || post.hasSimulation) && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {post.tags?.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 text-xs rounded-full border border-[var(--border)] text-[var(--fg-muted)]"
              >
                {tag}
              </span>
            ))}
            {post.hasSimulation && (
              <span className="px-2.5 py-0.5 text-xs rounded-full bg-[var(--accent)] text-white font-medium">
                interactive
              </span>
            )}
          </div>
        )}
      </header>

      <div className="prose">
        <MDXRemote
          source={post.content}
          components={components}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeHighlight, rehypeSlug],
            },
          }}
        />
      </div>
    </div>
  );
}
