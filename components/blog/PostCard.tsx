import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="group flex gap-6 py-4 border-b border-[var(--border)] last:border-0">
      <time className="shrink-0 w-28 text-xs text-[var(--fg-muted)] font-mono pt-0.5">
        {new Date(post.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </time>
      <div className="flex-1 min-w-0">
        <Link href={`/blog/${post.slug}/`}>
          <h3 className="text-sm font-medium text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors leading-snug">
            {post.title}
          </h3>
        </Link>
        {post.description && (
          <p className="mt-1 text-xs text-[var(--fg-muted)] line-clamp-2">{post.description}</p>
        )}
        <div className="mt-2 flex gap-1.5 flex-wrap">
          {post.tags?.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[10px] rounded-full border border-[var(--border)] text-[var(--fg-muted)] font-medium"
            >
              {tag}
            </span>
          ))}
          {post.hasSimulation && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-[var(--accent)] text-white font-medium">
              interactive
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
