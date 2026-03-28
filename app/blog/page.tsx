import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import PostCard from "@/components/blog/PostCard";

export const metadata: Metadata = {
  title: "Insights",
  description: "Articles on AI systems, LLMs, and enterprise engineering from Aegis Labs.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--fg)]">Insights</h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          {posts.length} articles on AI, LLMs, and engineering — hosted on Aegis Labs.
        </p>
      </div>

      <div>
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-[var(--fg-muted)]">No articles yet — check back soon.</p>
        )}
      </div>
    </div>
  );
}
